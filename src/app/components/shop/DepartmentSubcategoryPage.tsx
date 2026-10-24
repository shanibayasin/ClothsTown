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
import CategoryPageBanner from "@/app/components/shop/CategoryPageBanner";

const PAGE_SIZE = 12;
type Query = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function values(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
}
function pageHref(department: string, slug: string, query: Query, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page") continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/shop/${department}/${slug}?${params.toString()}`;
}

export default async function DepartmentSubcategoryPage({
  params,
  searchParams,
  department,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<Query>;
  department: string;
}) {
  const [{ subcategory: slug }, query] = await Promise.all([params, searchParams]);
  await connectDB();

  const parentCategory = await Category.findOne({ slug: department, status: true }).select("_id name slug").lean();
  if (!parentCategory) notFound();
  const category = await Category.findOne({
    slug,
    status: true,
    parentCategory: parentCategory._id,
  })
    .select("_id name slug image bannerImage bannerTitle bannerDescription bannerPosition")
    .lean();
  if (!category) notFound();

  const filter: Record<string, unknown> = { category: category._id };
  const minPriceValue = first(query.minPrice);
  const maxPriceValue = first(query.maxPrice);
  const minPrice = minPriceValue ? Number(minPriceValue) : undefined;
  const maxPrice = maxPriceValue ? Number(maxPriceValue) : undefined;
  if (minPrice !== undefined && Number.isFinite(minPrice) && minPrice >= 0) {
    filter.price = { ...(filter.price as object), $gte: minPrice };
  }
  if (maxPrice !== undefined && Number.isFinite(maxPrice) && maxPrice >= 0) {
    filter.price = { ...(filter.price as object), $lte: maxPrice };
  }
  const sizesSelected = values(query.size);
  const colorsSelected = values(query.color);
  const brandsSelected = values(query.brand);
  const fabricsSelected = values(query.fabric);
  const productTypesSelected = values(query.productType);
  const seasonsSelected = values(query.season);
  const collectionsSelected = values(query.collection);
  const sale = first(query.sale) === "true";
  const available = first(query.available) === "true";
  const conditions: Record<string, unknown>[] = [];
  if (sizesSelected.length) filter.sizes = { $in: sizesSelected };
  if (colorsSelected.length) filter.colors = { $in: colorsSelected };
  if (brandsSelected.length) filter.brand = { $in: brandsSelected };
  if (fabricsSelected.length) filter.fabric = { $in: fabricsSelected };
  if (productTypesSelected.length) {
    filter.productType = { $in: productTypesSelected };
  }
  if (seasonsSelected.length) filter.season = { $in: seasonsSelected };
  if (collectionsSelected.length) {
    const collectionIds = collectionsSelected.filter((id) => Types.ObjectId.isValid(id));
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
  const activeFilter = getActiveProductFilter(filter);
  const page = Math.max(1, Number.parseInt(first(query.page) ?? "1", 10) || 1);
  const [
    total,
    sizes,
    colors,
    brands,
    fabrics,
    productTypes,
    seasons,
    productCollectionIds,
    highestPrice,
  ] = await Promise.all([
    Product.countDocuments(activeFilter),
    Product.distinct("sizes", getActiveProductFilter({ category: category._id })),
    Product.distinct("colors", getActiveProductFilter({ category: category._id })),
    Product.distinct("brand", getActiveProductFilter({ category: category._id })),
    Product.distinct("fabric", getActiveProductFilter({ category: category._id })),
    Product.distinct("productType", getActiveProductFilter({ category: category._id })),
    Product.distinct("season", getActiveProductFilter({ category: category._id })),
    Promise.all([
      Product.distinct("collection", getActiveProductFilter({ category: category._id })),
      Product.distinct("collections", getActiveProductFilter({ category: category._id })),
    ]).then(([single, multiple]) =>
      [...new Set([...single, ...multiple]
        .filter((id) => id != null && Types.ObjectId.isValid(String(id)))
        .map(String))]
    ),
    Product.findOne(getActiveProductFilter({ category: category._id }))
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
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[#536875]">
        <Link href="/" className="hover:text-[#102d40]">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${parentCategory.slug}`} className="capitalize hover:text-[#102d40]">{parentCategory.name}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#102d40]">{category.name}</span>
      </nav>
      <CategoryPageBanner
        key={category._id.toString()}
        name={category.name}
        image={category.bannerImage}
        title={category.bannerTitle}
        description={category.bannerDescription}
        position={category.bannerPosition}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e7edf1] pb-4">
        <UrlProductFilters
          options={{
            size: sizes
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            color: colors
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            brand: brands
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            productType: productTypes
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            fabric: fabrics
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            season: seasons
              .filter((value): value is string => typeof value === "string" && Boolean(value))
              .map((value) => ({ value, label: value })),
            collection: collections.map((collection) => ({
              value: collection._id.toString(),
              label: collection.title,
            })),
          }}
          value={{
            ...EMPTY_PRODUCT_FILTERS,
            size: sizesSelected,
            color: colorsSelected,
            brand: brandsSelected,
            productType: productTypesSelected,
            fabric: fabricsSelected,
            season: seasonsSelected,
            collection: collectionsSelected,
            minPrice: Number(minPriceValue) || 0,
            maxPrice: Number(maxPriceValue) || 0,
            availability: available,
            onSale: sale,
          }}
          priceCeiling={Math.max(1, Number(highestPrice?.price) || 100000)}
          showCollection={collections.length > 0}
        />
        <p className="text-xs font-medium text-[#536875]">{total} products</p>
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
        <div className="rounded-xl border border-dashed border-[#e7edf1] px-5 py-20 text-center">
          <h2 className="text-xl font-semibold text-[#102d40]">No products found</h2>
          <p className="mt-2 text-sm text-[#536875]">There are no matching products in this category yet.</p>
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
          {currentPage > 1 && <Link href={pageHref(department, slug, query, currentPage - 1)} className="rounded-md border border-[#e7edf1] px-4 py-2 text-sm text-[#536875] hover:text-[#102d40]">Previous</Link>}
          <span className="text-sm text-[#536875]">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && <Link href={pageHref(department, slug, query, currentPage + 1)} className="rounded-md border border-[#e7edf1] px-4 py-2 text-sm text-[#536875] hover:text-[#102d40]">Next</Link>}
        </nav>
      )}
    </main>
  );
}
