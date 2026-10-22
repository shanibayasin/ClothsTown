import slugify from "slugify";

export type ProductPublicationStatus = "active" | "draft" | "inactive";

export function getActiveProductFilter(extra: Record<string, unknown> = {}) {
  return {
    $and: [
      { status: true },
      {
        $or: [
          { publicationStatus: "active" },
          { publicationStatus: { $exists: false } },
        ],
      },
      extra,
    ],
  };
}

export function getProductStatusFilter(status: ProductPublicationStatus) {
  if (status === "active") {
    return {
      $and: [
        { status: true },
        {
          $or: [
            { publicationStatus: "active" },
            { publicationStatus: { $exists: false } },
          ],
        },
      ],
    };
  }

  if (status === "draft") {
    return { publicationStatus: "draft" };
  }

  return {
    $or: [
      { publicationStatus: "inactive" },
      { publicationStatus: { $exists: false }, status: false },
    ],
  };
}

export function createProductSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}
