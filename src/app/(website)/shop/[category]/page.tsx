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

const CATEGORY_NAMES: Record<string, RegExp> = {
  men: /^(men(?:'s|s)?(?:\s*(?:wear|clothing))?|menswear)$/i,
  women: /^(women(?:'s|s)?(?:\s*(?:wear|clothing))?|womenswear)$/i,
  girls: /^(girls?(?:\s*(?:wear|clothing))?)$/i,
  boys: /^(boys?(?:\s*(?:wear|clothing))?)$/i,
  accessories: /^(accessor(y|ies))$/i,
};
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
  await connectDB();
  const category =
    await Category.findOne({ slug: categorySlug, status: true }).lean() ??
    (CATEGORY_NAMES[categorySlug]
      ? await Category.findOne({
          status: true,
          name: { $regex: CATEGORY_NAMES[categorySlug] },
        }).lean()
      : null);
  if (!category) notFound();
  const departmentSubcategories = await Category.find({
    status: true,
    parentCategory: category._id,
  })
    .sort({ name: 1 })
    .select("_id name slug")
    .lean();
  const categoryIds = [category._id, ...departmentSubcategories.map((item) => item._id)];
  const selectedSubcategories = values(query.subcategory);
  const filter: Record<string, unknown> = {
    category: selectedSubcategories.length
      ? {
          $in: departmentSubcategories
            .filter((item) => selectedSubcategories.includes(item.slug))
            .map((item) => item._id),
        }
      : categoryIds.length > 1
        ? { $in: categoryIds }
        : categoryIds[0],
  };
  const minimumPrice = Number(first(query.minPrice));
  const maximumPrice = Number(first(query.maxPrice));
  if (Number.isFinite(minimumPrice) && minimumPrice > 0) {
    filter.price = { ...(filter.price as object), $gte: minimumPrice };
  }
  if (Number.isFinite(maximumPrice) && maximumPrice > 0) {
    filter.price = { ...(filter.price as object), $lte: maximumPrice };
  }
  const size = first(query.size);
  const color = first(query.color);
  const brand = first(query.brand);
  const fabric = first(query.fabric);
  const selectedSizes = values(query.size);
  const selectedColors = values(query.color);
  const selectedBrands = values(query.brand);
  const selectedFabrics = values(query.fabric);
  const productType = first(query.productType);
  const selectedProductTypes = values(query.productType);
  const sale = first(query.sale) === "true";
  const available = first(query.available) === "true";
  if (selectedSizes.length) filter.sizes = { $in: selectedSizes };
  if (selectedColors.length) filter.colors = { $in: selectedColors };
  if (selectedBrands.length) filter.brand = { $in: selectedBrands };
  if (selectedFabrics.length) filter.fabric = { $in: selectedFabrics };
  if (selectedProductTypes.length) {
    filter.productType = { $in: selectedProductTypes };
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
  const page = Math.max(1, Number.parseInt(first(query.page) ?? "1", 10) || 1);
  const activeFilter = getActiveProductFilter(filter);
  const [total, sizes, colors, brands, fabrics, productTypes, categoryCount, highestPrice] = await Promise.all([
    Product.countDocuments(activeFilter),
    Product.distinct("sizes", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("colors", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("brand", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("fabric", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.distinct("productType", getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.countDocuments(getActiveProductFilter({ category: { $in: categoryIds } })),
    Product.findOne(getActiveProductFilter({ category: { $in: categoryIds } }))
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
        <Link href="/shop" className="hover:text-slate-900">Shop</Link>
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
      <p className="-mt-4 mb-6 text-sm text-slate-600">{categoryCount} available products</p>

      {departmentSubcategories.length > 0 && (
        <nav aria-label={`${category.name} subcategories`} className="mb-6 flex flex-wrap gap-2">
          {departmentSubcategories.map((subcategory) => (
            <Link
              key={subcategory._id.toString()}
              href={`/shop/${category.slug}/${subcategory.slug}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#173246] hover:text-[#173246]"
            >
              {subcategory.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <UrlProductFilters
          options={{
            category: departmentSubcategories.map((item) => ({
              value: item.slug,
              label: item.name,
            })),
            size: sizes.filter((item): item is string => typeof item === "string").map((value) => ({ value, label: value })),
            color: colors.filter((item): item is string => typeof item === "string").map((value) => ({ value, label: value })),
            brand: brands.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
            productType: productTypes.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
            fabric: fabrics.filter((item): item is string => typeof item === "string" && Boolean(item)).map((value) => ({ value, label: value })),
          }}
          value={{
            ...EMPTY_PRODUCT_FILTERS,
            category: selectedSubcategories,
            size: selectedSizes,
            color: selectedColors,
            brand: selectedBrands,
            productType: selectedProductTypes,
            fabric: selectedFabrics,
            minPrice: Number(first(query.minPrice)) || 0,
            maxPrice: Number(first(query.maxPrice)) || 0,
            availability: available,
            onSale: sale,
          }}
          priceCeiling={Math.max(1, Number(highestPrice?.price) || 100000)}
          showCategory={departmentSubcategories.length > 0}
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
        <label className="text-xs font-medium text-slate-600">
          Minimum price
          <input type="number" name="minPrice" min="0" defaultValue={first(query.minPrice)} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Maximum price
          <input type="number" name="maxPrice" min="0" defaultValue={first(query.maxPrice)} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Size
          <select name="size" defaultValue={size ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="">Any size</option>
            {sizes.filter((item): item is string => typeof item === "string").sort().map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Color
          <select name="color" defaultValue={color ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="">Any color</option>
            {colors.filter((item): item is string => typeof item === "string").sort().map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        {categorySlug === "men" && (
          <>
            <label className="text-xs font-medium text-slate-600">
              Brand
              <select name="brand" defaultValue={brand ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">Any brand</option>
                {brands.filter((item): item is string => typeof item === "string" && item.length > 0).sort().map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Fabric / material
              <select name="fabric" defaultValue={fabric ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">Any fabric</option>
                {fabrics.filter((item): item is string => typeof item === "string" && item.length > 0).sort().map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Product type
              <select name="productType" defaultValue={productType ?? ""} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">Any type</option>
                {productTypes.filter((item): item is string => typeof item === "string" && item.length > 0).sort().map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-600">
              <input type="checkbox" name="sale" value="true" defaultChecked={sale} />
              Sale items only
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-600">
              <input type="checkbox" name="available" value="true" defaultChecked={available} />
              In stock only
            </label>
          </>
        )}
        <label className="text-xs font-medium text-slate-600">
          Sort
          <select name="sort" defaultValue={sort} className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="min-h-10 rounded-md bg-[#173246] px-5 text-sm font-semibold text-white hover:bg-[#244c63]">Apply filters</button>
          <Link href={`/shop/${categorySlug}`} className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700">Clear</Link>
        </div>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-20 text-center">
          <h2 className="text-xl font-semibold text-slate-800">No products found</h2>
          <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or check back later.</p>
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
          {currentPage > 1 && <Link href={pageHref(categorySlug, query, currentPage - 1)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Previous</Link>}
          <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && <Link href={pageHref(categorySlug, query, currentPage + 1)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Next</Link>}
        </nav>
      )}
    </main>
  );
}
