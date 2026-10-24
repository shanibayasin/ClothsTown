import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import CategoryImage from "@/app/components/category/CategoryImage";
import HeroBanner from "@/app/components/shop/HeroBanner";

export default async function CategoriesPage() {
  await connectDB();

  const categories = await Category.find({
    status: true,
  })
    .sort({ createdAt: -1 })
    .lean();
  const categoriesById = new Map(
    categories.map((category) => [category._id.toString(), category])
  );

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

        {categories.length === 0 ? (
          <div className="rounded-3xl border bg-white py-20 text-center">
            <h2 className="text-3xl font-bold text-[#102d40]">
              No Categories Found
            </h2>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {categories.map((category) => (

              <Link
                key={category._id.toString()}
                href={
                  category.parentCategory &&
                  categoriesById.get(category.parentCategory.toString())?.slug
                    ? `/shop/${categoriesById.get(category.parentCategory.toString())?.slug}/${category.slug}`
                    : `/shop/${category.slug}`
                }
                className="group overflow-hidden rounded-[30px] bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >

                {/* Image */}

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

                    <h2 className="font-heading text-3xl text-white">
                      {category.name}
                    </h2>

                  </div>

                </div>

                {/* Footer */}

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
        )}

      </section>
    </main>
  );
}