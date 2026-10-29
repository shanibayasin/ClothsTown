import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import CategoryTile from "@/app/components/category/CategoryTile";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await connectDB();

  const categories = await Category.find({ status: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return (
    <main className="min-h-screen bg-white">
      <section
        id="category-list"
        className="mx-auto max-w-[1920px] px-4 pb-14 pt-5 sm:px-5 sm:pb-16 sm:pt-7"
      >
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"
        >
          <Link href="/" className="transition-colors hover:text-[var(--brand-primary)]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-[var(--brand-primary)]">
            All Categories
          </span>
        </nav>

        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--brand-primary)] sm:text-2xl">
              Explore Categories
            </h1>
            <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              Find clothing and accessories for every member of the family.
            </p>
          </div>
          <span className="shrink-0 text-[10px] text-[var(--text-secondary)] sm:text-xs">
            {categories.length} categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-4 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
          {categories.map((category) => (
            <CategoryTile
              key={category._id.toString()}
              category={{
                _id: category._id.toString(),
                name: category.name,
                slug: category.slug,
                image: category.image,
                routeGroup: category.routeGroup,
                parentCategory: category.parentCategory,
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
