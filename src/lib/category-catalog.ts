export const CATEGORY_GROUPS = [
  { name: "Men", slug: "men", routeGroup: "men" },
  { name: "Women", slug: "women", routeGroup: "women" },
  { name: "Girls", slug: "girls", routeGroup: "girls" },
  { name: "Boys", slug: "boys", routeGroup: "boys" },
  { name: "Accessories & Others", slug: "accessories", routeGroup: "accessories" },
] as const;

const PRODUCT_TYPE_FILTER_VALUES = new Set([
  "abaya",
  "blazer",
  "cardigan",
  "coat",
  "co-ord set",
  "dress",
  "frock",
  "gown",
  "hoodie",
  "jacket",
  "jeans",
  "kameez",
  "kaftan",
  "kurta",
  "kurti",
  "lehenga",
  "pajama",
  "polo shirt",
  "salwar",
  "sharara",
  "sherwani",
  "shirt",
  "shorts",
  "skirt",
  "suit",
  "sweater",
  "t-shirt",
  "top",
  "trousers",
  "tunic",
  "waistcoat",
]);

export function isProductTypeFilterValue(value: unknown): value is string {
  return (
    typeof value === "string" &&
    PRODUCT_TYPE_FILTER_VALUES.has(value.trim().toLowerCase())
  );
}

export function getCategoryHref(category: {
  routeGroup?: string;
  slug?: string;
  parentCategory?: unknown;
}) {
  if (!category.slug) return "/categories";
  return category.parentCategory && category.routeGroup
    ? `/shop/${category.routeGroup}/${category.slug}`
    : `/shop/${category.slug}`;
}

export function sortProductSizes(values: string[]) {
  const order = ["S", "M", "L", "XL", "XXL"];
  return [...new Set(values)].sort((left, right) => {
    const leftIndex = order.indexOf(left.toUpperCase());
    const rightIndex = order.indexOf(right.toUpperCase());
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}
