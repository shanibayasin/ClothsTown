import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import catalogData from "../src/lib/category-catalog.json" with { type: "json" };

export const catalog = catalogData;

export const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const menMappings = new Map([
  ["footwear", "footwear"],
  ["formal and wedding wear", "formal-wedding-wear"],
  ["kurtas and waistcoats", "kurtas-waistcoats"],
  ["mens accessories", "watches-belts-caps"],
  ["accessories", "watches-belts-caps"],
  ["perfumes and fragrances", "perfumes-fragrances"],
  ["shalwar kameez", "shalwar-kameez"],
  ["traditional essentials", "shalwar-kameez"],
  ["unstitched fabric", "mens-unstitched-fabric"],
  ["western wear", "western-wear"],
  ["winter wear", "mens-winter-wear"],
]);

const groupMappings = {
  Men: menMappings,
  Women: new Map([
    ["unstitched suits", "unstitched-suits"],
    ["unstitched fabric", "unstitched-suits"],
    ["unstitched lawn", "unstitched-suits"],
    ["unstitched khaddar", "unstitched-suits"],
    ["unstitched cambric and cotton", "unstitched-suits"],
    ["ready to wear", "ready-to-wear"],
    ["stitched suits", "ready-to-wear"],
    ["kurtis and tops", "ready-to-wear"],
    ["2 piece and 3 piece suits", "ready-to-wear"],
    ["formal and bridal wear", "formal-bridal-wear"],
    ["formal and wedding wear", "formal-bridal-wear"],
    ["formal wear", "formal-bridal-wear"],
    ["bridal wear", "formal-bridal-wear"],
    ["western and casual wear", "western-casual-wear"],
    ["western wear", "western-casual-wear"],
    ["casual wear", "western-casual-wear"],
    ["winter wear", "womens-winter-wear"],
    ["winter collection", "womens-winter-wear"],
    ["dupattas and stoles", "dupattas-stoles"],
    ["dupattas", "dupattas-stoles"],
    ["dupattas and shawls", "dupattas-stoles"],
    ["shawls", "dupattas-stoles"],
    ["stoles", "dupattas-stoles"],
    ["womens accessories", "watches-belts-caps"],
  ]),
  Kids: new Map([
    ["girls casual wear", "girls-casual-wear"],
    ["casual wear girls", "girls-casual-wear"],
    ["girls party and festive wear", "girls-party-festive-wear"],
    ["party and festive wear", "girls-party-festive-wear"],
    ["girls party wear", "girls-party-festive-wear"],
    ["boys casual wear", "boys-casual-wear"],
    ["casual wear boys", "boys-casual-wear"],
    ["boys traditional wear", "boys-traditional-wear"],
    ["traditional wear", "boys-traditional-wear"],
  ]),
  "Accessories & Others": new Map([
    ["footwear", "footwear"],
    ["bags and wallets", "bags-wallets"],
    ["bags", "bags-wallets"],
    ["wallets", "bags-wallets"],
    ["perfumes and fragrances", "perfumes-fragrances"],
    ["perfumes", "perfumes-fragrances"],
    ["fragrances", "perfumes-fragrances"],
    ["watches belts and caps", "watches-belts-caps"],
    ["mens accessories", "watches-belts-caps"],
    ["womens accessories", "watches-belts-caps"],
  ]),
};

const definitionsBySlug = new Map(catalog.map((item) => [item.slug, item]));
const groupsByName = new Map([
  ["men", "Men"],
  ["mens", "Men"],
  ["men wear", "Men"],
  ["mens wear", "Men"],
  ["women", "Women"],
  ["womens", "Women"],
  ["women wear", "Women"],
  ["womens wear", "Women"],
  ["girls", "Kids"],
  ["boys", "Kids"],
  ["kids", "Kids"],
  ["accessories", "Accessories & Others"],
  ["accessory", "Accessories & Others"],
  ["accessories and others", "Accessories & Others"],
]);

const categoriesCollectionName = "categories";
const productsCollectionName = "products";
const backupDirectory = path.resolve(process.cwd(), "backup");
const reportPath = path.join(backupDirectory, "category-migration-report.json");

export function getCategoryPath(categoryById, category) {
  const pathParts = [];
  let current = category;
  let depth = 0;
  while (current && depth < 8) {
    pathParts.unshift(current.name ?? "");
    const parentId = current.parentCategory?.toString();
    current = parentId ? categoryById.get(parentId) : null;
    depth += 1;
  }
  return pathParts.filter(Boolean);
}

export function getGroup(categoryPath, category) {
  for (const part of categoryPath) {
    const group = groupsByName.get(normalize(part));
    if (group) return group;
  }
  if (category.group && groupMappings[category.group]) return category.group;
  if (category.routeGroup === "men") return "Men";
  if (category.routeGroup === "women") return "Women";
  if (["girls", "boys"].includes(category.routeGroup)) return "Kids";
  if (category.routeGroup === "accessories") return "Accessories & Others";
  return null;
}

function getCurrentDepartmentRoute(categoryPath, category) {
  const pathNames = categoryPath.map(normalize);
  const rootName = pathNames[0];
  if (rootName === "girls") return "girls";
  if (rootName === "boys") return "boys";
  if (rootName === "men") return "men";
  if (rootName === "women") return "women";
  if (rootName === "accessories") return "accessories";
  if (["men", "women", "girls", "boys"].includes(category.routeGroup)) {
    return category.routeGroup;
  }
  return category.routeGroup === "accessories" ? "accessories" : null;
}

export function resolveCategory(category, categoryPath) {
  const name = normalize(category.name);
  const group = getGroup(categoryPath, category);

  if (category.slug && definitionsBySlug.has(category.slug)) {
    return definitionsBySlug.get(category.slug);
  }
  const pathNames = categoryPath.map(normalize);
  if (pathNames.includes("girls")) {
    const targetSlug = name.includes("party") || name.includes("festive")
      ? "girls-party-festive-wear"
      : name.includes("casual") || name.includes("wear")
        ? "girls-casual-wear"
        : null;
    if (targetSlug) return definitionsBySlug.get(targetSlug);
  }
  if (pathNames.includes("boys")) {
    const targetSlug = name.includes("traditional")
      ? "boys-traditional-wear"
      : name.includes("casual") || name.includes("wear")
        ? "boys-casual-wear"
        : null;
    if (targetSlug) return definitionsBySlug.get(targetSlug);
  }
  if (group) {
    const mappedSlug = groupMappings[group]?.get(name);
    if (mappedSlug) return definitionsBySlug.get(mappedSlug);
  }
  const exactMatches = catalog.filter(
    (item) => normalize(item.name) === name && (!group || item.group === group)
  );
  if (exactMatches.length === 1) return exactMatches[0];
  return null;
}

export const validGenders = new Set(["men", "women", "girls", "boys", "unisex"]);

export function classifyProductForGroup(product, group, sourcePath) {
  const text = normalize(
    `${product.name ?? ""} ${product.productType ?? ""} ${product.brand ?? ""} ${sourcePath.join(" ")}`
  );
  if (group === "Men") {
    if (/\bperfume|fragrance\b/.test(text)) return "perfumes-fragrances";
    if (/\bshoe|footwear|sandal|boot\b/.test(text)) return "footwear";
    if (/\bbag|wallet|clutch|pouch\b/.test(text)) return "bags-wallets";
    if (/\bwatch|belt|cap|accessor|tasbih|prayer mat|ihram|turban|scarf\b/.test(text)) {
      return "watches-belts-caps";
    }
    if (/\bunstitched|fabric\b/.test(text)) return "mens-unstitched-fabric";
    if (/\bwinter|wool|coat|cardigan|sweater\b/.test(text)) return "mens-winter-wear";
    if (/\bformal|wedding|occasion\b/.test(text)) return "formal-wedding-wear";
    if (/\bwestern|shirt|trouser|denim|jean|t-shirt\b/.test(text)) return "western-wear";
    if (/\bwaistcoat|kurta\b/.test(text)) return "kurtas-waistcoats";
    return "shalwar-kameez";
  }
  if (group === "Women") {
    if (/\bdupatta|shawl|stole|scarf\b/.test(text)) return "dupattas-stoles";
    if (/\bunstitched|fabric|lawn|khaddar|cambric\b/.test(text)) return "unstitched-suits";
    if (/\bwinter|wool|coat|cardigan|sweater\b/.test(text)) return "womens-winter-wear";
    if (/\bformal|wedding|bridal|party|festive|occasion|lehenga|sharara\b/.test(text)) {
      return "formal-bridal-wear";
    }
    return "ready-to-wear";
  }
  if (group === "Kids") {
    const isGirls =
      sourcePath.some((part) => normalize(part) === "girls") ||
      /\bgirls?\b/.test(text);
    const party = /\bparty|festive|formal|occasion|wedding\b/.test(text);
    if (isGirls) return party ? "girls-party-festive-wear" : "girls-casual-wear";
    return /\btraditional|kurta|shalwar|waistcoat\b/.test(text)
      ? "boys-traditional-wear"
      : "boys-casual-wear";
  }
  if (group === "Accessories & Others") {
    if (/\bshoe|footwear|sandal|boot\b/.test(text)) return "footwear";
    if (/\bbag|wallet|clutch|pouch\b/.test(text)) return "bags-wallets";
    if (/\bperfume|fragrance\b/.test(text)) return "perfumes-fragrances";
    return "watches-belts-caps";
  }
  return null;
}

export function inferLooseGroup(product) {
  const text = normalize(`${product.name ?? ""} ${product.productType ?? ""}`);
  if (/\bgirls?\b/.test(text)) return "Kids";
  if (/\bboys?\b/.test(text)) return "Kids";
  if (/\bmen'?s?\b|\bmenswear\b/.test(text)) return "Men";
  if (/\bwomen'?s?\b|\bwomenswear\b|\bladies\b/.test(text)) return "Women";
  if (/\bperfume|fragrance|footwear|shoe|bag|wallet|accessory|accessories\b/.test(text)) {
    return "Accessories & Others";
  }
  if (/\bsuit|lawn|frock|dress|dupatta|tunic|kurti|kurta|cotton|shirt|trouser|co ord|embroidered|2 piece|3 piece|cambric|khaddar\b/.test(text)) {
    return "Women";
  }
  return null;
}

export function inferredGender(group, target, existingGender) {
  if (target.routeGroup === "accessories") {
    if (group === "Men") return "men";
    if (group === "Women") return "women";
    return validGenders.has(existingGender) ? existingGender : "unisex";
  }
  return target.gender;
}

export function isMisplacedMenProduct(name) {
  return /\bdupatta\b|floral\s+2[- ]piece|embroidered\s+shirt/i.test(name);
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Set MONGODB_URI or MONGO_URI before running this migration.");
  }
  const dryRun = process.argv.includes("--dry-run");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDirectory,
    `category-backup-${timestamp}.json`
  );

  await mongoose.connect(mongoUri);
  const database = mongoose.connection.db;
  if (!database) throw new Error("Connected to MongoDB without selecting a database.");
  const host = mongoose.connection.host || new URL(mongoUri).hostname;
  const databaseName = database.databaseName;
  console.log(`MongoDB host: ${host}`);
  console.log(`MongoDB database: ${databaseName}`);

  const categories = await database.collection(categoriesCollectionName).find({}).toArray();
  const products = await database.collection(productsCollectionName).find({}).toArray();
  const categoryById = new Map(categories.map((category) => [category._id.toString(), category]));
  const categoryPaths = new Map(
    categories.map((category) => [
      category._id.toString(),
      getCategoryPath(categoryById, category),
    ])
  );

  const categoryMappings = new Map();
  const unmatchedCategories = [];
  const manualReview = [];
  for (const category of categories) {
    const target = resolveCategory(category, categoryPaths.get(category._id.toString()) ?? []);
    if (target) {
      categoryMappings.set(category._id.toString(), target.slug);
    } else if (!definitionsBySlug.has(category.slug)) {
      unmatchedCategories.push({
        categoryId: category._id,
        name: category.name,
        slug: category.slug,
        path: categoryPaths.get(category._id.toString()),
      });
    }
  }

  const plannedUpdates = [];
  const unmatchedProducts = [];
  for (const product of products) {
    const sourceId = product.category?.toString();
    const sourceCategory = sourceId ? categoryById.get(sourceId) : null;
    const sourcePath = sourceId ? categoryPaths.get(sourceId) ?? [] : [];
    let targetSlug = sourceId ? categoryMappings.get(sourceId) : null;
    let group = sourceCategory
      ? getGroup(sourcePath, sourceCategory)
      : null;
    let inferredCategory = false;

    if (group === "Men" && isMisplacedMenProduct(product.name)) {
      targetSlug = /\bdupatta\b/i.test(product.name) ? "dupattas-stoles" : "unstitched-suits";
      group = "Women";
      inferredCategory = true;
      manualReview.push({
        productId: product._id,
        name: product.name,
        reason: "Moved from Men based on product title; verify the assigned Women category.",
        targetSlug,
      });
    }

    if (!targetSlug && group) {
      targetSlug = classifyProductForGroup(product, group, sourcePath);
      inferredCategory = Boolean(targetSlug);
    }
    if (!targetSlug && !group) {
      group = inferLooseGroup(product);
      if (group) {
        targetSlug = classifyProductForGroup(product, group, sourcePath);
        inferredCategory = Boolean(targetSlug);
      }
    }

    if (!targetSlug || !definitionsBySlug.has(targetSlug)) {
      unmatchedProducts.push({
        productId: product._id,
        name: product.name,
        sourceCategoryId: product.category ?? null,
        sourceCategoryPath: sourcePath,
      });
      continue;
    }

    if (sourceCategory && normalize(sourceCategory.name) === "traditional essentials") {
      manualReview.push({
        productId: product._id,
        name: product.name,
        reason: "Traditional Essentials was mapped to Shalwar Kameez; manual review required.",
        targetSlug,
      });
    }

    const target = definitionsBySlug.get(targetSlug);
    if (
      inferredCategory &&
      !manualReview.some((item) => String(item.productId) === String(product._id))
    ) {
      manualReview.push({
        productId: product._id,
        name: product.name,
        reason: `Assigned to ${target.name} based on product title and source category; verify manually.`,
        targetSlug,
      });
    }
    const gender = inferredGender(group, target, product.gender);
    plannedUpdates.push({
      productId: product._id,
      sourceCategoryId: product.category ?? null,
      targetSlug,
      gender,
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: { gender },
        },
      },
    });
  }

  const targetCategories = await database
    .collection(categoriesCollectionName)
    .find({ slug: { $in: catalog.map((item) => item.slug) } })
    .toArray();
  const targetBySlug = new Map(targetCategories.map((category) => [category.slug, category]));
  const productsById = new Map(
    products.map((product) => [product._id.toString(), product])
  );
  const movedCountsBySlug = new Map(catalog.map((item) => [item.slug, 0]));

  for (const operation of plannedUpdates) {
    const target = targetBySlug.get(operation.targetSlug);
    const original = productsById.get(operation.updateOne.filter._id.toString());
    if (!target || original?.category?.toString() !== target._id.toString()) {
      movedCountsBySlug.set(
        operation.targetSlug,
        (movedCountsBySlug.get(operation.targetSlug) ?? 0) + 1
      );
    }
  }
  const plannedCountBySlug = new Map(catalog.map((item) => [item.slug, 0]));
  for (const operation of plannedUpdates) {
    plannedCountBySlug.set(
      operation.targetSlug,
      (plannedCountBySlug.get(operation.targetSlug) ?? 0) + 1
    );
  }
  const productsAssignedPerCategory = catalog.map((item) => ({
    name: item.name,
    slug: item.slug,
    count: plannedCountBySlug.get(item.slug) ?? 0,
  }));
  const zeroProductCategories = productsAssignedPerCategory.filter((item) => item.count === 0);
  const productsWithInvalidGender = products.filter(
    (product) => !validGenders.has(product.gender)
  ).length;
  const currentRouteCounts = new Map(
    ["men", "women", "girls", "boys", "accessories"].map((route) => [route, 0])
  );
  for (const product of products) {
    const isActive =
      (product.publicationStatus === "active" && product.status !== false) ||
      (product.publicationStatus === undefined && product.status === true);
    if (!isActive) continue;
    const sourceId = product.category?.toString();
    const sourceCategory = sourceId ? categoryById.get(sourceId) : null;
    const sourcePath = sourceId ? categoryPaths.get(sourceId) ?? [] : [];
    const currentRoute = sourceCategory
      ? getCurrentDepartmentRoute(sourcePath, sourceCategory)
      : null;
    if (currentRoute && currentRouteCounts.has(currentRoute)) {
      currentRouteCounts.set(currentRoute, currentRouteCounts.get(currentRoute) + 1);
    }
  }
  const plannedRouteCounts = new Map(
    ["men", "women", "girls", "boys", "accessories"].map((routeGroup) => [routeGroup, 0])
  );
  for (const operation of plannedUpdates) {
    const original = productsById.get(operation.productId.toString());
    const isActive =
      (original?.publicationStatus === "active" && original.status !== false) ||
      (original?.publicationStatus === undefined && original?.status === true);
    if (!isActive) continue;
    const target = definitionsBySlug.get(operation.targetSlug);
    if (target.routeGroup === "accessories") {
      plannedRouteCounts.set(
        "accessories",
        plannedRouteCounts.get("accessories") + 1
      );
      if (operation.gender !== "unisex") {
        plannedRouteCounts.set(
          operation.gender,
          plannedRouteCounts.get(operation.gender) + 1
        );
      }
    } else {
      plannedRouteCounts.set(
        target.routeGroup,
        plannedRouteCounts.get(target.routeGroup) + 1
      );
    }
  }
  const productsMovedPerCategory = catalog.map((item) => ({
    name: item.name,
    slug: item.slug,
    count: movedCountsBySlug.get(item.slug) ?? 0,
  }));

  console.log(`Backup path ${dryRun ? "that would be used" : "to be created"}: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`Products total: ${products.length}`);
  console.log(`Products with a valid planned audience: ${plannedUpdates.length}`);
  console.log(`Products currently missing/invalid audience (will be backfilled): ${productsWithInvalidGender}`);
  console.log("Products assigned per new category:");
  console.table(productsAssignedPerCategory);
  console.log("Categories with 0 planned products:");
  console.table(zeroProductCategories);
  console.log(`Unmapped products (${unmatchedProducts.length}):`);
  console.table(unmatchedProducts.map((item) => ({
    id: String(item.productId),
    name: item.name,
    categoryPath: item.sourceCategoryPath.join(" > "),
  })));
  console.log(`Manual-review products (${manualReview.length}):`);
  console.table(manualReview.map((item) => ({
    id: String(item.productId),
    name: item.name,
    target: item.targetSlug,
    reason: item.reason,
  })));
  console.log("Current product counts by department route, before migration:");
  console.table([...currentRouteCounts].map(([route, count]) => ({
    route: `/shop/${route}`,
    count,
  })));
  console.log("Planned product counts by department route, after migration:");
  console.table([...plannedRouteCounts].map(([route, count]) => ({
    route: `/shop/${route}`,
    count,
  })));

  if (dryRun) {
    console.log("Dry run complete: no database or filesystem writes were made.");
    return;
  }

  if (unmatchedProducts.length > 0) {
    throw new Error(
      `${unmatchedProducts.length} product(s) have no valid target category. Resolve the reported items before running without --dry-run. No writes were made.`
    );
  }
  if (
    plannedUpdates.length !== products.length ||
    plannedUpdates.some((operation) => !validGenders.has(operation.gender))
  ) {
    throw new Error(
      "The migration plan does not assign a valid category and audience to every product. No writes were made."
    );
  }

  const { createInterface } = await import("node:readline/promises");
  const { stdin, stdout } = await import("node:process");
  const prompt = createInterface({ input: stdin, output: stdout });
  const confirmation = await prompt.question(
    `${manualReview.length} product(s) are flagged for manual review. ` +
      `Type the database name "${databaseName}" to confirm all migration writes: `
  );
  prompt.close();
  if (confirmation.trim() !== databaseName) {
    throw new Error("Database name confirmation did not match. No writes were made.");
  }

  await mkdir(backupDirectory, { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        databaseName,
        categories,
        productCategoryLinks: products.map((product) => ({
          productId: product._id,
          name: product.name,
          categoryId: product.category ?? null,
          gender: product.gender ?? null,
        })),
      },
      null,
      2
    ),
    "utf8"
  );

  const upserts = catalog.map((item) => ({
    updateOne: {
      filter: { slug: item.slug },
      update: {
        $set: {
          name: item.name,
          slug: item.slug,
          group: item.group,
          routeGroup: item.routeGroup,
          gender: item.gender,
          sortOrder: item.sortOrder,
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
  }));
  await database.collection(categoriesCollectionName).bulkWrite(upserts, { ordered: true });

  const writtenCategories = await database
    .collection(categoriesCollectionName)
    .find({ slug: { $in: catalog.map((item) => item.slug) } })
    .toArray();
  if (writtenCategories.length !== catalog.length) {
    throw new Error(`Expected ${catalog.length} target categories, found ${writtenCategories.length}.`);
  }
  const writtenBySlug = new Map(writtenCategories.map((category) => [category.slug, category]));
  const verifiedProductUpdates = plannedUpdates.map((operation) => {
    const target = writtenBySlug.get(operation.targetSlug);
    if (!target) throw new Error(`Target category ${operation.targetSlug} was not created.`);
    return {
      updateOne: {
        filter: { _id: operation.productId },
        update: {
          $set: { category: target._id, gender: operation.gender },
          $unset: {
            categorySlug: "",
            categoryName: "",
            categoryGroup: "",
          },
        },
      },
    };
  });
  if (verifiedProductUpdates.length) {
    await database.collection(productsCollectionName).bulkWrite(verifiedProductUpdates, { ordered: true });
  }

  const targetIds = writtenCategories.map((category) => category._id);
  const unassignedCount = await database.collection(productsCollectionName).countDocuments({
    $or: [
      { category: { $nin: targetIds } },
      { category: { $exists: false } },
      { category: null },
    ],
  });
  const missingGenderCount = await database.collection(productsCollectionName).countDocuments({
    gender: { $nin: [...validGenders] },
  });
  if (unassignedCount || missingGenderCount) {
    throw new Error(
      `Post-migration verification failed (${unassignedCount} invalid category references; ${missingGenderCount} missing or invalid gender values). Legacy categories were not deleted.`
    );
  }
  const countsBySlug = await database.collection(productsCollectionName).aggregate([
    { $match: { category: { $in: targetIds } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]).toArray();
  const countByCategoryId = new Map(countsBySlug.map((item) => [item._id.toString(), item.count]));
  const actualProductsPerCategory = catalog.map((item) => {
    const category = writtenBySlug.get(item.slug);
    return { name: item.name, slug: item.slug, count: countByCategoryId.get(category._id.toString()) ?? 0 };
  });

  const report = {
    createdAt: new Date().toISOString(),
    backupFile: path.relative(process.cwd(), backupPath),
    productsMoved: [...movedCountsBySlug.values()].reduce((total, count) => total + count, 0),
    productsUpdated: verifiedProductUpdates.length,
    productsMovedPerCategory,
    productsAssignedPerCategory: actualProductsPerCategory,
    productsFlaggedForManualReview: manualReview,
    unmatchedCategories,
    unmatchedProducts,
    oldCategoriesDeleted: 0,
    productsWithoutNewCategory: unassignedCount,
    productsWithoutValidGender: missingGenderCount,
  };

  const result = await database.collection(categoriesCollectionName).deleteMany({
    _id: { $nin: targetIds },
  });
  report.oldCategoriesDeleted = result.deletedCount;

  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    backupFile: report.backupFile,
    productsMoved: report.productsMoved,
    productsMovedPerCategory,
    productsAssignedPerCategory: actualProductsPerCategory,
    productsFlaggedForManualReview: manualReview.length,
    unmatchedCategories: unmatchedCategories.length,
    unmatchedProducts: unmatchedProducts.length,
    productsWithoutNewCategory: unassignedCount,
    productsWithoutValidGender: missingGenderCount,
    oldCategoriesDeleted: report.oldCategoriesDeleted,
    reportFile: path.relative(process.cwd(), reportPath),
  }, null, 2));

  if (report.categoryDeletionSkipped) {
    console.error("Old categories were kept because some products still need category mapping.");
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run()
    .catch((error) => {
      console.error("Category migration failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}
