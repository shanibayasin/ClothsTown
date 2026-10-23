import type { Types } from "mongoose";
import slugify from "slugify";

export type ProductPublicationStatus = "active" | "draft" | "inactive";

export interface ProductQuery {
  _id?: Types.ObjectId;
  category?: Types.ObjectId;
  collection?: Types.ObjectId;
  collections?: Types.ObjectId[];
  name?: string;
  sku?: string;
  slug?: string;
  price?: number;
  discountPrice?: number;
  sizes?: string[];
  colors?: string[];
  brand?: string;
  fabric?: string;
  productType?: string;
  onSale?: boolean;
  newArrival?: boolean;
  isNewArrival?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  status?: boolean;
  publicationStatus?: ProductPublicationStatus;
  createdAt?: Date;
  stock?: number;
}

export interface CanonicalProductFields {
  collectionIds: string[];
  featured: boolean;
  newArrival: boolean;
  publicationStatus: ProductPublicationStatus;
}

interface ProductFieldSource {
  collection?: unknown;
  collections?: unknown;
  featured?: unknown;
  isFeatured?: unknown;
  newArrival?: unknown;
  isNewArrival?: unknown;
  status?: unknown;
  publicationStatus?: unknown;
}

function relationshipId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null) return null;

  if ("_id" in value) {
    const id = value._id;
    if (typeof id === "string") return id;
    if (
      typeof id === "object" &&
      id !== null &&
      "toString" in id &&
      typeof id.toString === "function"
    ) {
      return id.toString();
    }
  }

  if (
    "toString" in value &&
    typeof value.toString === "function" &&
    value.toString !== Object.prototype.toString
  ) {
    return value.toString();
  }

  return null;
}

export function getCanonicalProductFields(
  product: ProductFieldSource
): CanonicalProductFields {
  const collectionValues =
    Array.isArray(product.collections) && product.collections.length > 0
      ? product.collections
      : [product.collection];
  const collectionIds = Array.from(
    new Set(
      collectionValues
        .map(relationshipId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const storedPublicationStatus =
    product.publicationStatus === "active" ||
    product.publicationStatus === "draft" ||
    product.publicationStatus === "inactive"
      ? product.publicationStatus
      : undefined;
  const publicationStatus: ProductPublicationStatus =
    product.status === false && storedPublicationStatus === "active"
      ? "inactive"
      : storedPublicationStatus ?? (product.status === true ? "active" : "inactive");

  return {
    collectionIds,
    featured: product.featured === true || product.isFeatured === true,
    newArrival: product.newArrival === true || product.isNewArrival === true,
    publicationStatus,
  };
}

export function normalizeProductAliases<T extends ProductFieldSource>(product: T) {
  const fields = getCanonicalProductFields(product);

  return {
    ...product,
    featured: fields.featured,
    isFeatured: fields.featured,
    newArrival: fields.newArrival,
    isNewArrival: fields.newArrival,
    status: fields.publicationStatus === "active",
    publicationStatus: fields.publicationStatus,
  };
}

export function getFeaturedProductFilter(): import("mongoose").QueryFilter<ProductQuery> {
  return { $or: [{ featured: true }, { isFeatured: true }] };
}

export function getNewArrivalProductFilter(): import("mongoose").QueryFilter<ProductQuery> {
  return { $or: [{ newArrival: true }, { isNewArrival: true }] };
}

export function getOnSaleProductFilter(): import("mongoose").QueryFilter<ProductQuery> {
  return {
    $or: [
      { onSale: true },
      {
        $and: [
          { onSale: { $exists: false } },
          {
            $expr: {
              $and: [
                { $gt: ["$discountPrice", 0] },
                { $lt: ["$discountPrice", "$price"] },
              ],
            },
          },
        ],
      },
    ],
  };
}

export function getCollectionProductFilter(
  collectionId: Types.ObjectId
): import("mongoose").QueryFilter<ProductQuery> {
  return {
    $or: [{ collection: collectionId }, { collections: collectionId }],
  };
}

export function getActiveProductFilter(
  extra: import("mongoose").QueryFilter<ProductQuery> = {}
): import("mongoose").QueryFilter<ProductQuery> {
  return {
    $and: [
      {
        $or: [
          { publicationStatus: "active" as const, status: { $ne: false } },
          {
            $and: [
              { publicationStatus: { $exists: false } },
              { status: true },
            ],
          },
        ],
      },
      extra,
    ],
  };
}

export function getProductStatusFilter(
  status: ProductPublicationStatus
): import("mongoose").QueryFilter<ProductQuery> {
  if (status === "active") {
    return {
      $or: [
        { publicationStatus: "active" as const, status: { $ne: false } },
        {
          $and: [
            { publicationStatus: { $exists: false } },
            { status: true },
          ],
        },
      ],
    };
  }

  if (status === "draft") {
    return { publicationStatus: "draft" as const };
  }

  return {
    $or: [
      { publicationStatus: "inactive" as const },
      {
        $and: [
          { publicationStatus: "active" as const },
          { status: false },
        ],
      },
      {
        $and: [
          { publicationStatus: { $exists: false } },
          { status: false },
        ],
      },
      {
        $and: [
          { publicationStatus: { $exists: false } },
          { status: { $exists: false } },
        ],
      },
    ],
  };
}

export function createProductSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}
