import mongoose from "mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Collection from "@/models/Collection";
import { createProductSlug, type ProductPublicationStatus } from "@/lib/products";

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

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
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
  const collections = Array.from(
    new Set([
      ...stringArray(value.collections),
      ...(typeof value.collection === "string" && value.collection ? [value.collection] : []),
    ])
  );

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
  if (!mongoose.Types.ObjectId.isValid(category) || !(await Category.exists({ _id: category }))) {
    throw new ProductInputError("Select a valid product category.");
  }
  if (collections.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ProductInputError("Select valid collections.");
  }
  if (
    collections.length > 0 &&
    (await Collection.countDocuments({ _id: { $in: collections } })) !== collections.length
  ) {
    throw new ProductInputError("One or more selected collections no longer exist.");
  }

  const existing = productId ? await Product.findById(productId).select("slug sku").lean() : null;
  if (productId && !existing) return null;

  const publicationStatus: ProductPublicationStatus =
    value.publicationStatus === "active" ||
    value.publicationStatus === "draft" ||
    value.publicationStatus === "inactive"
      ? value.publicationStatus
      : value.status === false
        ? "inactive"
        : "active";
  const featured = value.isFeatured === true || value.featured === true;
  const newArrival = value.isNewArrival === true || value.newArrival === true;
  const slugValue = typeof value.slug === "string" ? value.slug.trim() : "";
  const skuValue = typeof value.sku === "string" ? value.sku.trim() : "";
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
    price,
    discountPrice,
    stock,
    sku,
    category,
    collection: collections[0] || null,
    collections,
    images: stringArray(value.images),
    sizes: stringArray(value.sizes),
    colors: stringArray(value.colors),
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
