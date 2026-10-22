import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter } from "@/lib/products";
import Product from "@/models/Product";

export default async function FeaturedPage() {
  await connection();
  await connectDB();

  const products = await Product.find(getActiveProductFilter({
    $or: [{ featured: true }, { isFeatured: true }],
  }))
    .sort({ createdAt: -1 })
    .lean();

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      {/* Header */}

      <div className="mb-16 text-center">

        <span className="text-sm uppercase tracking-[0.3em] text-primary">
          Premium Picks
        </span>

        <h1 className="mt-4 font-heading text-5xl text-[#2B1A22]">
          Featured Collection
        </h1>

        <p className="mt-5 text-gray-500">
          {products.length} Featured Products
        </p>

      </div>

      {products.length === 0 ? (

        <div className="rounded-3xl border py-20 text-center">

          <h2 className="text-3xl font-bold">
            No Featured Products
          </h2>

        </div>

      ) : (

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">

          {products.map((product) => (

            <div
              key={product._id.toString()}
              className="overflow-hidden rounded-[30px] bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
            >

              <div className="relative h-105">

                <Image
                  src={
                    product.images?.[0] ||
                    "/images/placeholder-product.jpg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                />

                <span className="absolute left-5 top-5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
                  Featured
                </span>

              </div>

              <div className="p-6">

                <h2 className="font-heading text-2xl">
                  {product.name}
                </h2>

                <p className="mt-4 flex items-baseline gap-3 text-2xl font-bold text-primary">
                  Rs. {product.discountPrice > 0 && product.discountPrice < product.price
                    ? product.discountPrice
                    : product.price}
                  {product.discountPrice > 0 && product.discountPrice < product.price && (
                    <span className="text-base font-normal text-slate-400 line-through">
                      Rs. {product.price}
                    </span>
                  )}
                </p>

                <Link
                  href={`/product/${product.slug}`}
                  className="mt-6 block rounded-full bg-primary py-3 text-center font-semibold text-white transition hover:bg-primary-dark"
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