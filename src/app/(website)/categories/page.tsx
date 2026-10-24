import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import CategoryImage from "@/app/components/category/CategoryImage";
import HeroBanner from "@/app/components/shop/HeroBanner";
import {
  CATEGORY_CATALOG,
  getCategoryHref,
} from "@/lib/category-catalog";

export const dynamic = "force-dynamic";
const categoryGroups = ["Men", "Women", "Kids", "Accessories & Others"] as const;

export default async function CategoriesPage() {
  await connectDB();

  const databaseCategories = await Category.find({
    status: true,
    slug: { $in: CATEGORY_CATALOG.map((category) => category.slug) },
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const categoriesBySlug = new Map(
    databaseCategories.map((category) => [category.slug, category])
  );
  const categories = CATEGORY_CATALOG.map((definition) => ({
    ...definition,
    ...categoriesBySlug.get(definition.slug),
    name: definition.name,
    slug: definition.slug,
  }));

  return (
    <main className="min-h-screen bg-white">
      <HeroBanner
        name="Discover Our Collections"
        subtitle="Shop by Category"
        description="Explore clothing and accessories for every style, season, and occasion."
        buttonText="Browse Categories"
        buttonLink="#category-list"
        priority
      />
      <section id="category-list" className="mx-auto max-w-7xl px-6 pb-20">
        {categoryGroups.map((group) => (
          <div key={group} className="mb-12 last:mb-0">
            <h2 className="mb-5 font-heading text-2xl text-[#321b27]">
              {group}
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {categories
                .filter((category) => category.group === group)
                .map((category) => (
                  <Link
                    key={category.slug}
                    href={getCategoryHref(category)}
                    className="group overflow-hidden rounded-[30px] bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <CategoryImage
                        src={category.image}
                        alt={category.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                        fallbackClassName="text-sm text-[#536875]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-6 left-6">
                        <h3 className="font-heading text-3xl text-white">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6">
                      <span className="text-sm uppercase tracking-[0.25em] text-[#536875]">
                        View Collection
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#102d40] text-white transition group-hover:translate-x-1">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}