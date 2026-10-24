import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import {
  catalog,
  classifyProductForGroup,
  getCategoryPath,
  getGroup,
  inferLooseGroup,
  inferredGender,
  isMisplacedMenProduct,
  normalize,
  resolveCategory,
  validGenders,
} from "./migrate-categories.mjs";

const categoriesCollectionName = "categories";
const productsCollectionName = "products";
const validSlugs = new Set(catalog.map((item) => item.slug));
const definitionsBySlug = new Map(catalog.map((item) => [item.slug, item]));
const backupDirectory = path.resolve(process.cwd(), "backup");

function canonicalSourceSlug(product, categoriesById) {
  const category = categoriesById.get(product.category?.toString());
  return category?.slug && validSlugs.has(category.slug) ? category.slug : null;
}

async function confirmDatabaseName(databaseName) {
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await input.question(
      `Type the database name "${databaseName}" to apply these changes: `
    );
    return answer === databaseName;
  } finally {
    input.close();
  }
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Set MONGODB_URI or MONGO_URI before running this repair.");
  }
  if (process.argv.includes("--apply") && process.argv.includes("--dry-run")) {
    throw new Error("Choose either --dry-run or --apply, not both.");
  }

  const apply = process.argv.includes("--apply");
  await mongoose.connect(mongoUri);
  const database = mongoose.connection.db;
  if (!database) throw new Error("Connected to MongoDB without selecting a database.");

  console.log(`MongoDB host: ${mongoose.connection.host}`);
  console.log(`MongoDB database: ${database.databaseName}`);
  console.log(`Mode: ${apply ? "apply (typed confirmation required)" : "dry-run (no writes)"}`);

  const [categories, products] = await Promise.all([
    database.collection(categoriesCollectionName).find({}).toArray(),
    database.collection(productsCollectionName).find({}).toArray(),
  ]);
  const categoriesById = new Map(
    categories.map((category) => [category._id.toString(), category])
  );
  const categoryPaths = new Map(
    categories.map((category) => [
      category._id.toString(),
      getCategoryPath(categoriesById, category),
    ])
  );
  const categoryMappings = new Map();
  for (const category of categories) {
    const target = resolveCategory(
      category,
      categoryPaths.get(category._id.toString()) ?? []
    );
    if (target) categoryMappings.set(category._id.toString(), target.slug);
  }

  const legacyProductTypeLabels = new Set([
    ...catalog.flatMap((item) => [normalize(item.name), normalize(item.slug)]),
    ...categories.flatMap((category) => [
      normalize(category.name),
      normalize(category.slug),
    ]),
    "men",
    "mens",
    "mens wear",
    "men wear",
    "women",
    "womens",
    "womens wear",
    "women wear",
    "girls",
    "boys",
    "kids",
    "accessories",
    "accessory",
  ]);

  const plannedUpdates = [];
  const unmappedProducts = [];
  const manualReview = [];
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  for (const product of products) {
    const sourceId = product.category?.toString();
    const sourceCategory = sourceId ? categoriesById.get(sourceId) : null;
    const sourcePath = sourceId ? categoryPaths.get(sourceId) ?? [] : [];
    let targetSlug = sourceId ? categoryMappings.get(sourceId) : null;
    let group = sourceCategory ? getGroup(sourcePath, sourceCategory) : null;
    let inferred = false;

    if (group === "Men" && isMisplacedMenProduct(product.name ?? "")) {
      targetSlug = /\bdupatta\b/i.test(product.name)
        ? "dupattas-stoles"
        : "unstitched-suits";
      group = "Women";
      inferred = true;
      manualReview.push({
        productId: product._id,
        name: product.name,
        targetSlug,
        reason: "Moved from Men based on product title; verify the Women assignment.",
      });
    }

    if (!targetSlug && group) {
      targetSlug = classifyProductForGroup(product, group, sourcePath);
      inferred = Boolean(targetSlug);
    }
    if (!targetSlug && !group) {
      group = inferLooseGroup(product);
      if (group) {
        targetSlug = classifyProductForGroup(product, group, sourcePath);
        inferred = Boolean(targetSlug);
      }
    }

    if (!targetSlug || !definitionsBySlug.has(targetSlug)) {
      unmappedProducts.push({
        id: String(product._id),
        name: product.name,
        sourceCategory: sourceCategory?.name ?? "(missing category)",
        sourcePath: sourcePath.join(" > "),
      });
      continue;
    }

    const target = definitionsBySlug.get(targetSlug);
    if (
      sourceCategory &&
      normalize(sourceCategory.name) === "traditional essentials"
    ) {
      manualReview.push({
        productId: product._id,
        name: product.name,
        targetSlug,
        reason: "Traditional Essentials maps to Shalwar Kameez; manual review requested.",
      });
    } else if (
      inferred &&
      !manualReview.some((item) => String(item.productId) === String(product._id))
    ) {
      manualReview.push({
        productId: product._id,
        name: product.name,
        targetSlug,
        reason: "Category inferred from product/source fields; verify manually.",
      });
    }

    const gender = inferredGender(group, target, product.gender);
    const productType = typeof product.productType === "string"
      ? product.productType.trim()
      : "";
    const cleanProductType =
      Boolean(productType) &&
      legacyProductTypeLabels.has(normalize(productType));
    plannedUpdates.push({
      productId: product._id,
      sourceCategoryId: product.category ?? null,
      targetSlug,
      gender,
      cleanProductType,
      before: {
        category: sourceCategory?.name ?? "(missing category)",
        gender: product.gender ?? "(missing)",
        productType: product.productType ?? "(empty)",
      },
      after: {
        category: target.name,
        gender,
        productType: cleanProductType ? "(removed category label)" : productType || "(empty)",
      },
    });
  }

  const existingCatalogCategories = await database
    .collection(categoriesCollectionName)
    .find({ slug: { $in: catalog.map((item) => item.slug) } })
    .toArray();
  const existingCatalogSlugs = new Set(
    existingCatalogCategories.map((category) => category.slug)
  );
  const categoriesToCreate = catalog.filter((item) => !existingCatalogSlugs.has(item.slug));
  const plannedCounts = new Map(catalog.map((item) => [item.slug, 0]));
  for (const update of plannedUpdates) {
    plannedCounts.set(update.targetSlug, (plannedCounts.get(update.targetSlug) ?? 0) + 1);
  }
  const categorySummary = catalog.map((item) => ({
    category: item.name,
    slug: item.slug,
    plannedProducts: plannedCounts.get(item.slug) ?? 0,
    dbCategory: existingCatalogSlugs.has(item.slug) ? "exists" : "would create",
  }));
  const oldCategories = categories.filter((category) => !validSlugs.has(category.slug));
  const typeCleanupCount = plannedUpdates.filter((item) => item.cleanProductType).length;
  const categoryMoveCount = plannedUpdates.filter((item) => {
    const source = item.sourceCategoryId?.toString();
    const product = productsById.get(item.productId.toString());
    return !source || canonicalSourceSlug(product, categoriesById) !== item.targetSlug;
  }).length;
  const genderUpdateCount = plannedUpdates.filter((item) => {
    const product = productsById.get(item.productId.toString());
    return product.gender !== item.gender;
  }).length;
  const backupPath = path.join(
    backupDirectory,
    `stale-category-repair-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );

  console.log("\nPlanned products per canonical category:");
  console.log(JSON.stringify(categorySummary));
  console.table(categorySummary);
  console.log("\nBefore / after product changes:");
  console.table(
    plannedUpdates.map((item) => ({
      product: item.before.category,
      name: productsById.get(item.productId.toString())?.name ?? "",
      category: `${item.before.category} -> ${item.after.category}`,
      gender: `${item.before.gender} -> ${item.after.gender}`,
      productType: `${item.before.productType} -> ${item.after.productType}`,
    }))
  );
  console.log(`\nProducts needing a category reassignment: ${categoryMoveCount}`);
  console.log(`Products needing gender backfill/correction: ${genderUpdateCount}`);
  console.log(`Products with category-like productType to remove: ${typeCleanupCount}`);
  console.log(`Canonical category records that would be created: ${categoriesToCreate.length}`);
  console.log(`Legacy category records that would be deleted after verification: ${oldCategories.length}`);
  console.log(`Backup file that would be created: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`Unmapped products (${unmappedProducts.length}):`);
  console.table(unmappedProducts);
  console.log(`Manual-review products (${manualReview.length}):`);
  console.table(
    manualReview.map((item) => ({
      id: String(item.productId),
      name: item.name,
      target: item.targetSlug,
      reason: item.reason,
    }))
  );

  if (!apply) {
    console.log("Dry run complete. No database or filesystem writes were made.");
    return;
  }
  if (unmappedProducts.length) {
    throw new Error(
      "Apply aborted: resolve every unmapped product in the report before writing."
    );
  }
  if (!(await confirmDatabaseName(database.databaseName))) {
    throw new Error("Database name confirmation did not match. No writes were made.");
  }

  await mkdir(backupDirectory, { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        database: database.databaseName,
        categories,
        products: products.map((product) => ({
          _id: product._id,
          name: product.name,
          category: product.category ?? null,
          gender: product.gender ?? null,
          productType: product.productType ?? null,
        })),
      },
      null,
      2
    ),
    "utf8"
  );

  await database.collection(categoriesCollectionName).bulkWrite(
    catalog.map((definition) => ({
      updateOne: {
        filter: { slug: definition.slug },
        update: {
          $set: {
            name: definition.name,
            slug: definition.slug,
            group: definition.group,
            routeGroup: definition.routeGroup,
            gender: definition.gender,
            sortOrder: definition.sortOrder,
            status: true,
            parentCategory: null,
          },
          $setOnInsert: {
            image: "",
            bannerImage: "",
            bannerTitle: "",
            bannerDescription: "",
            bannerButtonText: "",
            bannerButtonLink: "",
            bannerPosition: "left",
            sectionTiles: [],
            menuGroups: [],
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: true }
  );

  const targetCategories = await database
    .collection(categoriesCollectionName)
    .find({ slug: { $in: catalog.map((item) => item.slug) } })
    .toArray();
  if (targetCategories.length !== catalog.length) {
    throw new Error(
      `Expected ${catalog.length} canonical categories after upsert; found ${targetCategories.length}.`
    );
  }
  const targetBySlug = new Map(
    targetCategories.map((category) => [category.slug, category])
  );
  const productWrites = plannedUpdates.map((item) => {
    const target = targetBySlug.get(item.targetSlug);
    if (!target) throw new Error(`Missing target category ${item.targetSlug}.`);
    const $set = { category: target._id, gender: item.gender };
    const $unset = {
      categorySlug: "",
      categoryName: "",
      categoryGroup: "",
      ...(item.cleanProductType ? { productType: "" } : {}),
    };
    return {
      updateOne: {
        filter: { _id: item.productId },
        update: { $set, $unset },
      },
    };
  });
  if (productWrites.length) {
    await database.collection(productsCollectionName).bulkWrite(productWrites, {
      ordered: true,
    });
  }

  const targetIds = targetCategories.map((category) => category._id);
  const [invalidCategoryCount, invalidGenderCount] = await Promise.all([
    database.collection(productsCollectionName).countDocuments({
      $or: [
        { category: { $nin: targetIds } },
        { category: { $exists: false } },
        { category: null },
      ],
    }),
    database.collection(productsCollectionName).countDocuments({
      gender: { $nin: [...validGenders] },
    }),
  ]);
  if (invalidCategoryCount || invalidGenderCount) {
    throw new Error(
      `Verification failed: ${invalidCategoryCount} invalid category references and ${invalidGenderCount} invalid gender values remain. Legacy categories were not deleted.`
    );
  }

  const legacyIds = oldCategories.map((category) => category._id);
  if (legacyIds.length) {
    await database.collection(categoriesCollectionName).updateMany(
      { parentCategory: { $in: legacyIds } },
      { $set: { parentCategory: null } }
    );
    const attachedLegacyProducts = await database
      .collection(productsCollectionName)
      .countDocuments({ category: { $in: legacyIds } });
    if (attachedLegacyProducts) {
      throw new Error(
        `Verification failed: ${attachedLegacyProducts} products still reference legacy categories; no legacy category documents were deleted.`
      );
    }
    await database.collection(categoriesCollectionName).deleteMany({
      _id: { $in: legacyIds },
      slug: { $nin: catalog.map((item) => item.slug) },
    });
  }

  console.log(
    JSON.stringify(
      {
        backupFile: path.relative(process.cwd(), backupPath),
        productsReassigned: categoryMoveCount,
        productsGenderUpdated: genderUpdateCount,
        productTypesRemoved: typeCleanupCount,
        canonicalCategoriesCreated: categoriesToCreate.length,
        oldCategoriesDeleted: oldCategories.length,
        invalidCategoryReferences: invalidCategoryCount,
        invalidGenderValues: invalidGenderCount,
      },
      null,
      2
    )
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  run()
    .catch((error) => {
      console.error("Stale category repair failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}
