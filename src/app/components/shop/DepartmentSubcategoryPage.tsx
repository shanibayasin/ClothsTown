import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter, getOnSaleProductFilter } from "@/lib/products";
import Category from "@/models/Category";
import Product from "@/models/Product";
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
  const size = first(query.size);
  const color = first(query.color);
  const brand = first(query.brand);
  const fabric = first(query.fabric);
  const sizesSelected = values(query.size);
  const colorsSelected = values(query.color);
  const brandsSelected = values(query.brand);
  const fabricsSelected = values(query.fabric);
  const productType = first(query.productType);
  const productTypesSelected = values(query.productType);
  const sale = first(query.sale) === "true";
  const available = first(query.available) === "true";
  if (sizesSelected.length) filter.sizes = { $in: sizesSelected };
  if (colorsSelected.length) filter.colors = { $in: colorsSelected };
  if (brandsSelected.length) filter.brand = { $in: brandsSelected };
  if (fabricsSelected.length) filter.fabric = { $in: fabricsSelected };
  if (productTypesSelected.length) {
    filter.productType = { $in: productTypesSelected };
  }
  if (sale) {
    filter.$and = [getOnSaleProductFilter()];
  }
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
    highestPrice,
  ] = await Promise.all([
    Product.countDocuments(activeFilter),
    Product.distinct("sizes", getActiveProductFilter({ category: category._id })),
    Product.distinct("colors", getActiveProductFilter({ category: category._id })),
    Product.distinct("brand", getActiveProductFilter({ category: category._id })),
    Product.distinct("fabric", getActiveProductFilter({ category: category._id })),
    Product.distinct("productType", getActiveProductFilter({ category: category._id })),
    Product.findOne(getActiveProductFilter({ category: category._id }))
      .sort({ price: -1 })
      .select("price")
      .lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const products = await Product.find(activeFilter)
    .sort({ ...sortOrder, _id: 1 })
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${parentCategory.slug}`} className="hover:text-slate-900 capitalize">{parentCategory.name}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-700">{category.name}</span>
      </nav>
      <CategoryPageBanner
        name={category.name}
        image={category.bannerImage || category.image}
        title={category.bannerTitle}
        description={category.bannerDescription}
        position={category.bannerPosition}
      />
      <p className="-mt-4 mb-6 text-sm text-slate-600">{total} available products</p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
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
          }}
          value={{
            ...EMPTY_PRODUCT_FILTERS,
            size: sizesSelected,
            color: colorsSelected,
            brand: brandsSelected,
            productType: productTypesSelected,
            fabric: fabricsSelected,
            minPrice: Number(minPriceValue) || 0,
            maxPrice: Number(maxPriceValue) || 0,
            availability: available,
            onSale: sale,
          }}
          priceCeiling={Math.max(1, Number(highestPrice?.price) || 100000)}
        />
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

      <form method="get" className="hidden">
        <label className="text-xs font-medium text-slate-600">Minimum price
          <input type="number" name="minPrice" min="0" defaultValue={minPriceValue} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-600">Maximum price
          <input type="number" name="maxPrice" min="0" defaultValue={maxPriceValue} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        {([
          ["brand", "Brand", brands, brand],
          ["fabric", "Fabric / material", fabrics, fabric],
          ["productType", "Product type", productTypes, productType],
          ["size", "Size", sizes, size],
          ["color", "Color", colors, color],
        ] as const).map(([key, label, values, selected]) => (
          <label key={key} className="text-xs font-medium text-slate-600">{label}
            <select name={key} defaultValue={selected ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">Any {label.toLowerCase()}</option>
              {values
                .filter((value): value is string => typeof value === "string" && value.length > 0)
                .sort()
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        ))}
        <label className="text-xs font-medium text-slate-600">Sort
          <select name="sort" defaultValue={sort} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-600">
          <input type="checkbox" name="sale" value="true" defaultChecked={sale} /> Sale items only
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-600">
          <input type="checkbox" name="available" value="true" defaultChecked={available} /> In stock only
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="min-h-10 rounded-md bg-[#173246] px-5 text-sm font-semibold text-white hover:bg-[#244c63]">Apply filters</button>
          <Link href={`/shop/${department}/${slug}`} className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700">Clear</Link>
        </div>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-20 text-center">
          <h2 className="text-xl font-semibold text-slate-800">No products found</h2>
          <p className="mt-2 text-sm text-slate-500">There are no matching products in this category yet.</p>
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
          {currentPage > 1 && <Link href={pageHref(department, slug, query, currentPage - 1)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Previous</Link>}
          <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && <Link href={pageHref(department, slug, query, currentPage + 1)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Next</Link>}
        </nav>
      )}
    </main>
  );
}
