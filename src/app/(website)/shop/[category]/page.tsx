import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter, getOnSaleProductFilter } from "@/lib/products";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Collection from "@/models/Collection";
import ProductCard, { type StoreProductCardData } from "@/app/components/product/ProductCard";
import UrlProductFilters from "@/app/components/shop/UrlProductFilters";
import ProductSortSelect from "@/app/components/shop/ProductSortSelect";
import { EMPTY_PRODUCT_FILTERS } from "@/app/components/shop/ProductFilterDrawer";
import HeroBanner from "@/app/components/shop/HeroBanner";
import {
  CATEGORY_GROUPS,
  getCategoryHref,
  isProductTypeFilterValue,
  sortProductSizes,
} from "@/lib/category-catalog";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function values(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
}
function pageHref(
  category: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/shop/${category}?${params.toString()}`;
}

export default async function StoreCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: SearchParams;
}) {
  const [{ category: categoryParam }, query] = await Promise.all([params, searchParams]);
  const categorySlug = categoryParam.toLowerCase();
  const routeGroup = CATEGORY_GROUPS.find((group) => group.slug === categorySlug);

  await connectDB();
  const [databaseCategory, routeGroupCategories] = await Promise.all([
    routeGroup
      ? Promise.resolve(null)
      : Category.findOne({ slug: categorySlug, status: true }).lean(),
    routeGroup
      ? Category.find({ routeGroup: routeGroup.routeGroup, status: true })
          .sort({ sortOrder: 1, name: 1 })
          .lean()
      : Promise.resolve([]),
  ]);
  if (!routeGroup && !databaseCategory) notFound();

  const rootCategories = routeGroupCategories.filter((item) => !item.parentCategory);
  const departmentSubcategories = routeGroup
    ? routeGroupCategories.filter((item) => Boolean(item.parentCategory))
    : await Category.find({
        parentCategory: databaseCategory!._id,
        status: true,
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
  const category = routeGroup
    ? rootCategories[0] ?? routeGroupCategories[0] ?? {
        _id: categorySlug,
        name: routeGroup.name,
        slug: categorySlug,
      }
    : databaseCategory!;
  const pageTitle = routeGroup?.name ?? category.name;
  const categoryIds = [
    ...(routeGroup
      ? routeGroupCategories.map((item) => item._id)
      : [databaseCategory!._id, ...departmentSubcategories.map((item) => item._id)]),
  ];
  const requestedSubcategories = values(query.subcategory);
  const selectedSubcategories = requestedSubcategories.filter((slug) =>
    departmentSubcategories.some((item) => item.slug === slug)
  );
  const filter: Record<string, unknown> = requestedSubcategories.length
    ? {
        category: {
          $in: departmentSubcategories
            .filter((item) => selectedSubcategories.includes(item.slug))
            .map((item) => item._id),
        },
      }
    : routeGroup
      ? {
          $or: [
            { category: { $in: categoryIds } },
            { gender: routeGroup.routeGroup },
          ],
        }
      : {
          category: categoryIds.length
            ? { $in: categoryIds }
            : { $in: [] },
        };
  const minimumPrice = Number(first(query.minPrice));
  const maximumPrice = Number(first(query.maxPrice));
  if (Number.isFinite(minimumPrice) && minimumPrice > 0) {
    filter.price = { ...(filter.price as object), $gte: minimumPrice };
  }
  if (Number.isFinite(maximumPrice) && maximumPrice > 0) {
    filter.price = { ...(filter.price as object), $lte: maximumPrice };
  }
  const selectedSizes = values(query.size);
  const selectedColors = values(query.color);
  const selectedBrands = values(query.brand);
  const selectedFabrics = values(query.fabric);
  const selectedProductTypes = values(query.productType);
  const selectedSeasons = values(query.season);
  const selectedGenders = values(query.gender);
  const selectedCollections = values(query.collection);
  const sale = first(query.sale) === "true";
  const available = first(query.available) === "true";
  const conditions: Record<string, unknown>[] = [];
  if (selectedSizes.length) filter.sizes = { $in: selectedSizes };
  if (selectedColors.length) filter.colors = { $in: selectedColors };
  if (selectedBrands.length) filter.brand = { $in: selectedBrands };
  if (selectedFabrics.length) filter.fabric = { $in: selectedFabrics };
  if (selectedProductTypes.length) {
    filter.productType = { $in: selectedProductTypes };
  }
  if (selectedSeasons.length) filter.season = { $in: selectedSeasons };
  if (selectedGenders.length) filter.gender = { $in: selectedGenders };
  if (selectedCollections.length) {
    const collectionIds = selectedCollections.filter((id) => Types.ObjectId.isValid(id));
    conditions.push({
      $or: [
        { collection: { $in: collectionIds } },
        { collections: { $in: collectionIds } },
      ],
    });
  }
  if (sale) {
    conditions.push(getOnSaleProductFilter());
  }
  if (conditions.length) filter.$and = conditions;
  if (available) filter.stock = { $gt: 0 };

  const sort = first(query.sort) ?? "newest";
  const sortOrder: Record<string, 1 | -1> =
    sort === "price-low" ? { price: 1 } :
      sort === "price-high" ? { price: -1 } :
        sort === "name" ? { name: 1 } : { createdAt: -1 };
  const page = Math.max(1, Number.parseInt(first(query.page) ?? "1", 10) || 1);
  const activeFilter = getActiveProductFilter(filter);
  const [
    total,
    sizes,
    colors,
    brands,
    fabrics,
    productTypes,
    seasons,
    genders,
    productCollectionIds,
    highestPrice,
  ] = await Promise.all([
    Product.countDocuments(activeFilter),
    Product.distinct("sizes", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("colors", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("brand", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("fabric", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("productType", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("season", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("gender", getActiveProductFilter({ category: { $in: categoryIds } })),
    Promise.all([
      Product.distinct("collection", getActiveProductFilter({ category: { $in: categoryIds } })),
      Product.distinct("collections", getActiveProductFilter({ category: { $in: categoryIds } })),
    ]).then(([single, multiple]) =>
      [...new Set([...single, ...multiple]
        .filter((id) => id != null && Types.ObjectId.isValid(String(id)))
        .map(String))]
    ),
    Product.findOne(getActiveProductFilter({ category: { $in: categoryIds } }))
      .sort({ price: -1 })
      .select("price")
      .lean(),
  ]);
  const collections = await Collection.find({
    status: true,
    _id: { $in: productCollectionIds },
  })
    .select("_id title")
    .sort({ title: 1 })
    .lean();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const products = await Product.find(activeFilter)
    .sort({ ...sortOrder, _id: 1 })
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1440px] bg-white px-4 py-8 sm:px-6 lg:px-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--brand-primary)]">Home</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[var(--brand-primary)]">{pageTitle}</span>
      </nav>
      <HeroBanner
        key={category._id.toString()}
        name={routeGroup?.name ?? category.name}
        image={category.bannerImage || category.image}
        title={category.bannerTitle}
        description={category.bannerDescription}
        buttonText={category.bannerButtonText || `Shop ${pageTitle}`}
        buttonLink={
          category.bannerButtonLink ||
          `/shop/${categorySlug}${sale ? "?sale=true" : ""}`
        }
        position={category.bannerPosition}
        imagePosition="center"
        priority
      />
      {(rootCategories.length > 0 || departmentSubcategories.length > 0) && (
        <nav aria-label={`${pageTitle} categories`} className="mb-6 flex flex-wrap gap-2">
          {rootCategories.map((rootCategory) => (
            <Link
              key={rootCategory._id.toString()}
              href={getCategoryHref(rootCategory)}
              className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              {rootCategory.name}
            </Link>
          ))}
          {departmentSubcategories.map((subcategory) => (
            <Link
              key={subcategory._id.toString()}
              href={getCategoryHref(subcategory)}
              className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              {subcategory.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <UrlProductFilters
          options={{
            category: departmentSubcategories.map((item) => ({
              value: item.slug,
              label: item.name,
            })),
            size: sortProductSizes(sizes.filter((item): item is string => typeof item === "string")).map((value) => ({ value, label: value })),
            color: colors.filter((item): item is string => typeof item === "string").map((value) => ({ value, label: value })),
            brand: brands.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
            productType: productTypes.filter(isProductTypeFilterValue).map((value) => ({ value, label: value })),
            fabric: fabrics.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
            season: seasons.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
            gender: genders
              .filter((item): item is string =>
                ["men", "women", "girls", "boys", "unisex"].includes(item)
              )
              .map((value) => ({ value, label: value })),
            collection: collections.map((collection) => ({
              value: collection._id.toString(),
              label: collection.title,
            })),
          }}
          value={{
            ...EMPTY_PRODUCT_FILTERS,
            category: selectedSubcategories,
            collection: selectedCollections,
            size: selectedSizes,
            color: selectedColors,
            brand: selectedBrands,
            productType: selectedProductTypes,
            fabric: selectedFabrics,
            season: selectedSeasons,
            gender: selectedGenders,
            minPrice: Number(first(query.minPrice)) || 0,
            maxPrice: Number(first(query.maxPrice)) || 0,
            availability: available,
            onSale: sale,
          }}
          priceCeiling={Math.max(1, Number(highestPrice?.price) || 100000)}
          showCategory={departmentSubcategories.length > 0}
          showCollection={collections.length > 0}
          showGender={genders.length > 0}
        />
        <p className="text-xs font-medium text-[var(--text-secondary)]">{total} products</p>
        <ProductSortSelect
          value={sort}
          options={[
            ["newest", "Newest"],
            ["price-low", "Price: low to high"],
            ["price-high", "Price: high to low"],
            ["name", "Name"],
          ]}
        />
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] px-5 py-20 text-center">
          <h2 className="text-xl font-semibold text-[var(--brand-primary)]">No products found</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id.toString()} product={JSON.parse(JSON.stringify(product)) as StoreProductCardData} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Product pagination" className="mt-8 flex items-center justify-center gap-3">
          {currentPage > 1 && <Link href={pageHref(categorySlug, query, currentPage - 1)} className="rounded-md border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">Previous</Link>}
          <span className="text-sm text-[var(--text-secondary)]">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && <Link href={pageHref(categorySlug, query, currentPage + 1)} className="rounded-md border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">Next</Link>}
        </nav>
      )}
    </main>
  );
}
