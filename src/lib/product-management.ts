import mongoose from "mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Collection from "@/models/Collection";
import {
  createProductSlug,
  getCanonicalProductFields,
  type ProductPublicationStatus,
} from "@/lib/products";

type ProductInput = Record<string, unknown>;

export class ProductInputError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is ProductInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, field: string, fallback: string[] = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new ProductInputError(`${field} must be an array of strings.`);
  }
  return value.map((item: string) => item.trim()).filter(Boolean);
}

async function createUniqueSlug(value: string, excludeId?: string) {
  const base = createProductSlug(value) || "product";
  let candidate = base;
  let suffix = 2;
  while (
    await Product.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

async function createUniqueSku(name: string) {
  const prefix =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "PRD";
  let sku = "";
  do {
    sku = `CT-${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (await Product.exists({ sku }));
  return sku;
}

export async function saveProduct(value: unknown, productId?: string) {
  if (!isRecord(value)) {
    throw new ProductInputError("Product data must be an object.");
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const price = Number(value.price);
  const discountPrice = Number(value.discountPrice ?? 0);
  const stock = Number(value.stock ?? 0);
  const category = typeof value.category === "string" ? value.category : "";
  const selectedGender = value.gender;
  if (name.length < 3 || name.length > 160) {
    throw new ProductInputError("Product name must be between 3 and 160 characters.");
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new ProductInputError("Enter a valid product price greater than zero.");
  }
  if (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price) {
    throw new ProductInputError("Discount price must be between zero and the regular price.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ProductInputError("Stock must be a non-negative whole number.");
  }
  if (!mongoose.Types.ObjectId.isValid(category)) {
    throw new ProductInputError("Select a valid product category.");
  }
  const categoryDocument = await Category.findById(category).select("gender").lean();
  if (!categoryDocument) {
    throw new ProductInputError("Select a valid product category.");
  }

  const existing = productId
    ? await Product.findById(productId)
        .select("slug sku collection collections featured isFeatured newArrival isNewArrival status publicationStatus images sizes colors brand productType fragranceType bottleSize gender")
        .lean()
    : null;
  if (productId && !existing) return null;
  if (
    selectedGender !== undefined &&
    !["men", "women", "girls", "boys", "unisex"].includes(String(selectedGender))
  ) {
    throw new ProductInputError("Choose a valid product audience.");
  }
  const gender =
    typeof selectedGender === "string"
      ? selectedGender
      : existing?.gender ?? categoryDocument.gender ?? "unisex";

  const existingFields = existing ? getCanonicalProductFields(existing) : null;
  for (const flag of ["featured", "isFeatured", "newArrival", "isNewArrival", "onSale"] as const) {
    if (value[flag] !== undefined && typeof value[flag] !== "boolean") {
      throw new ProductInputError(`${flag} must be a boolean.`);
    }
  }

  let publicationStatus: ProductPublicationStatus;
  if (value.publicationStatus !== undefined) {
    if (
      value.publicationStatus !== "active" &&
      value.publicationStatus !== "draft" &&
      value.publicationStatus !== "inactive"
    ) {
      throw new ProductInputError("Choose a valid product publication status.");
    }
    publicationStatus = value.publicationStatus;
  } else if (value.status !== undefined) {
    if (typeof value.status !== "boolean") {
      throw new ProductInputError("Product status must be a boolean.");
    }
    publicationStatus = value.status ? "active" : "inactive";
  } else {
    publicationStatus = existingFields?.publicationStatus ?? "active";
  }

  const featured =
    typeof value.featured === "boolean"
      ? value.featured
      : typeof value.isFeatured === "boolean"
        ? value.isFeatured
        : existingFields?.featured ?? false;
  const newArrival =
    typeof value.newArrival === "boolean"
      ? value.newArrival
      : typeof value.isNewArrival === "boolean"
        ? value.isNewArrival
        : existingFields?.newArrival ?? false;

  let collections: string[];
  if (value.collections !== undefined) {
    collections = stringArray(value.collections, "Collections");
  } else if (value.collection !== undefined) {
    if (value.collection === null || value.collection === "") {
      collections = [];
    } else if (typeof value.collection === "string") {
      collections = [value.collection.trim()];
    } else {
      throw new ProductInputError("Select a valid collection.");
    }
  } else {
    collections = existingFields?.collectionIds ?? [];
  }
  collections = Array.from(new Set(collections));

  if (collections.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ProductInputError("Select valid collections.");
  }
  if (
    collections.length > 0 &&
    (await Collection.countDocuments({ _id: { $in: collections } })) !== collections.length
  ) {
    throw new ProductInputError("One or more selected collections no longer exist.");
  }

  const slugValue = typeof value.slug === "string" ? value.slug.trim() : "";
  const skuValue = typeof value.sku === "string" ? value.sku.trim() : "";
  for (const field of ["brand", "productType", "fragranceType", "bottleSize"] as const) {
    if (value[field] !== undefined && typeof value[field] !== "string") {
      throw new ProductInputError(`${field} must be a string.`);
    }
    if (typeof value[field] === "string" && value[field].trim().length > 120) {
      throw new ProductInputError(`${field} must be 120 characters or fewer.`);
    }
  }
  const slug = await createUniqueSlug(slugValue || name, productId);
  const sku = skuValue || existing?.sku || (await createUniqueSku(name));
  if (await Product.exists({ sku, ...(productId ? { _id: { $ne: productId } } : {}) })) {
    throw new ProductInputError("That SKU is already assigned to another product.", 409);
  }

  const productData = {
    name,
    slug,
    shortDescription: typeof value.shortDescription === "string" ? value.shortDescription.trim() : "",
    description: typeof value.description === "string" ? value.description.trim() : "",
    season: typeof value.season === "string" ? value.season.trim() : "",
    fabric: typeof value.fabric === "string" ? value.fabric.trim() : "",
    brand: typeof value.brand === "string" ? value.brand.trim() : existing?.brand ?? "",
    productType:
      typeof value.productType === "string"
        ? value.productType.trim()
        : existing?.productType ?? "",
    fragranceType:
      typeof value.fragranceType === "string"
        ? value.fragranceType.trim()
        : existing?.fragranceType ?? "",
    bottleSize:
      typeof value.bottleSize === "string"
        ? value.bottleSize.trim()
        : existing?.bottleSize ?? "",
    price,
    discountPrice,
    stock,
    sku,
    category,
    gender,
    collection: collections[0] || null,
    collections,
    images: stringArray(value.images, "Images", existing?.images ?? []),
    sizes: stringArray(value.sizes, "Sizes", existing?.sizes ?? []),
    colors: stringArray(value.colors, "Colors", existing?.colors ?? []),
    featured,
    isFeatured: featured,
    onSale:
      typeof value.onSale === "boolean"
        ? value.onSale
        : discountPrice > 0 && discountPrice < price,
    newArrival,
    isNewArrival: newArrival,
    status: publicationStatus === "active",
    publicationStatus,
  };

  if (!productId) return Product.create(productData);

  return Product.findByIdAndUpdate(productId, productData, {
    new: true,
    runValidators: true,
  });
}
