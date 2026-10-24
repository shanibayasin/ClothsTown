import catalog from "./category-catalog.json";

export type CategoryGroup = "Men" | "Women" | "Kids" | "Accessories & Others";
export type ProductGender = "men" | "women" | "girls" | "boys" | "unisex";
export type CategoryRouteGroup = "men" | "women" | "girls" | "boys" | "accessories";

export interface CategoryDefinition {
  name: string;
  slug: string;
  group: CategoryGroup;
  routeGroup: CategoryRouteGroup;
  gender: ProductGender;
  sortOrder: number;
}

export const CATEGORY_CATALOG = catalog as CategoryDefinition[];
export const CATEGORY_SLUGS = new Set(CATEGORY_CATALOG.map((category) => category.slug));

export const CATEGORY_GROUPS = [
  { name: "Men", slug: "men", routeGroup: "men" },
  { name: "Women", slug: "women", routeGroup: "women" },
  { name: "Girls", slug: "girls", routeGroup: "girls" },
  { name: "Boys", slug: "boys", routeGroup: "boys" },
  { name: "Accessories & Others", slug: "accessories", routeGroup: "accessories" },
] as const;

export function getCategoryDefinition(slug: string) {
  return CATEGORY_CATALOG.find((category) => category.slug === slug);
}

export function getCategoryRouteGroup(route: string) {
  const normalized = route.toLowerCase();
  return CATEGORY_GROUPS.find((group) => group.slug === normalized)?.routeGroup;
}

export function getCategoriesForRoute(route: string) {
  const routeGroup = getCategoryRouteGroup(route);
  return routeGroup
    ? CATEGORY_CATALOG.filter((category) => category.routeGroup === routeGroup)
    : [];
}

export function getCategoryHref(category: CategoryDefinition) {
  return `/shop/${category.routeGroup}/${category.slug}`;
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
