import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import HeroBanner from "@/app/components/shop/HeroBanner";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  try {
    await connectDB();
  } catch {
    return (
      <main className="min-h-screen bg-[#faf7f8]">
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-[var(--brand-primary)]">
            Collections temporarily unavailable
          </h1>
          <p className="mt-4 text-gray-500">
            Please try again shortly while the database connection is restored.
          </p>
        </section>
      </main>
    );
  }

  const collections = await Collection.find({
    status: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-[#faf7f8]">
      <HeroBanner
        name="Our Collections"
        subtitle="Clothstown"
        description="Explore seasonal collections of thoughtfully designed clothing, made for comfort, quality, and everyday style."
        buttonText="Explore Collections"
        buttonLink="#collections"
        image={collections.find((collection) => collection.image)?.image}
        imageAlt="Clothstown seasonal collection"
        priority
      />

      {/* Collections */}
      <section id="collections" className="mx-auto max-w-7xl px-6 py-16">
        {collections.length === 0 ? (
          <div className="rounded-3xl border bg-white py-20 text-center">
            <h2 className="text-2xl font-semibold">
              No Collections Found
            </h2>

            <p className="mt-3 text-gray-500">
              Please add collections from Admin Panel.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection._id}
                href={`/collections/${collection.slug}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative h-80 overflow-hidden bg-gray-100">
                  {collection.image ? (
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"
                      aria-label="No collection image uploaded"
                    >
                      <ImageIcon size={48} strokeWidth={1.25} aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="p-7">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {collection.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-gray-600">
                    {collection.description}
                  </p>

                  <div className="mt-8 inline-flex items-center gap-2 font-semibold text-primary">
                    Explore Collection
                    <span>→</span>
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