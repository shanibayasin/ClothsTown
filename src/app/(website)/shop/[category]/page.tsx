import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter } from "@/lib/products";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductCard, { type StoreProductCardData } from "@/app/components/product/ProductCard";

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
  const categoryPattern = CATEGORY_NAMES[categorySlug];
  if (!categoryPattern) notFound();

  await connectDB();
  const matchingCategories = await Category.find({
    status: true,
    $or: [
      { slug: categorySlug },
      { name: { $regex: categoryPattern } },
    ],
  })
    .sort({ name: 1 })
    .lean();
  const category =
    matchingCategories.find(
      (item) =>
        item.slug?.toLowerCase() === categorySlug ||
        item.name?.trim().toLowerCase() === categorySlug
    ) ?? matchingCategories[0];
  if (!category) notFound();

  const filter: Record<string, unknown> = { category: category._id };
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
  if (size) filter.sizes = size;
  if (color) filter.colors = color;

  const sort = first(query.sort) ?? "newest";
  const sortOrder: Record<string, 1 | -1> =
    sort === "price-low" ? { price: 1 } :
      sort === "price-high" ? { price: -1 } :
        sort === "name" ? { name: 1 } : { createdAt: -1 };
  const page = Math.max(1, Number.parseInt(first(query.page) ?? "1", 10) || 1);
  const activeFilter = getActiveProductFilter(filter);
  const [total, sizes, colors, categoryCount] = await Promise.all([
    Product.countDocuments(activeFilter),
    Product.distinct("sizes", getActiveProductFilter({ category: category._id })),
    Product.distinct("colors", getActiveProductFilter({ category: category._id })),
    Product.countDocuments(getActiveProductFilter({ category: category._id })),
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
        <span className="font-medium capitalize text-slate-700">{categorySlug}</span>
      </nav>
      <header className="mb-6 rounded-xl bg-[#f7f5f2] px-5 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b654b]">ClothesTown collection</p>
        <h1 className="mt-2 text-3xl font-bold capitalize text-[#173246] sm:text-4xl">{category.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{categoryCount} available products</p>
      </header>

      <form method="get" className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
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
