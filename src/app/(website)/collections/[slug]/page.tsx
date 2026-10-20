import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CollectionPage({
  params,
}: Props) {
  const { slug } = await params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();

  try {
    await connectDB();
  } catch {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-primary">
          Collection temporarily unavailable
        </h1>
        <p className="mt-4 text-gray-500">
          Please try again shortly while the database connection is restored.
        </p>
      </section>
    );
  }

  const collection: any = await Collection.findOne({
    slug: normalizedSlug,
  }).lean();

  if (!collection) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-4xl font-bold">
          Collection Not Found
        </h1>
      </section>
    );
  }

  const products: any[] = await Product.find({
    collection: collection._id,
    status: true,
  })
    .populate("category")
    .populate("collection")
    .lean();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">

      {/* Header */}

      <div className="mb-12 text-center">

        <h1 className="text-5xl font-bold text-primary">
          {collection.title}
        </h1>

        <p className="mt-4 text-gray-500">
          {products.length} Products Available
        </p>

      </div>

      {products.length === 0 ? (

        <div className="rounded-2xl border py-20 text-center">

          <h2 className="text-3xl font-bold">
            No Products Found
          </h2>

        </div>

      ) : (

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {products.map((product) => (

            <div
              key={product._id.toString()}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >

              <div className="relative h-96">

                <Image
                  src={
                    product.images?.[0] ||
                    "/images/placeholder-product.jpg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                />

                {product.newArrival && (
                  <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                    NEW
                  </span>
                )}

                {product.featured && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs text-white">
                    Featured
                  </span>
                )}

              </div>

              <div className="p-6">

                <h2 className="text-2xl font-semibold">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {collection.title}
                </p>

                <div className="mt-4">

                  {product.discountPrice ? (

                    <div className="flex items-center gap-3">

                      <span className="text-xl font-bold text-primary">
                        Rs. {product.discountPrice}
                      </span>

                      <span className="text-gray-400 line-through">
                        Rs. {product.price}
                      </span>

                    </div>

                  ) : (

                    <span className="text-xl font-bold text-primary">
                      Rs. {product.price}
                    </span>

                  )}

                </div>

                <Link
                  href={`/product/${product.slug}`}
                  className="mt-6 block rounded-xl bg-primary py-3 text-center font-semibold text-white transition hover:bg-[#5a1738]"
                >
                  View Product
                </Link>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}