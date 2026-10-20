import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export default async function CategoriesPage() {
  await connectDB();

  const categories: any[] = await Category.find({
    status: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <section className="bg-[#FCF8F6] py-20">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}

        <div className="mb-16 text-center">

          <span className="text-sm uppercase tracking-[0.3em] text-[#6f1d46]">
            Shop By Category
          </span>

          <h1 className="mt-5 font-heading text-5xl text-[#2B1A22]">
            Discover Our Collections
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-gray-500">
            Explore clothing and accessories for every style, season, and occasion.
          </p>

        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border bg-white py-20 text-center">
            <h2 className="text-3xl font-bold text-[#6f1d46]">
              No Categories Found
            </h2>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {categories.map((category) => (

              <Link
                key={category._id.toString()}
                href={`/category/${category.slug}`}
                className="group overflow-hidden rounded-[30px] bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >

                {/* Image */}

                <div className="relative h-[420px] overflow-hidden">

                  <Image
                    src={
                      category.image
                        ? category.image
                        : "/placeholder.png"
                    }
                    alt={category.name}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
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

                  <span className="text-sm uppercase tracking-[0.25em] text-gray-500">
                    View Collection
                  </span>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6f1d46] text-white transition group-hover:translate-x-1">

                    <ArrowRight size={18} />

                  </div>

                </div>

              </Link>

            ))}

          </div>
        )}

      </div>
    </section>
  );
}