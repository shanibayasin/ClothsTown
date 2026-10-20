import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export default async function NewArrivalsPage() {
  await connectDB();

  const products: any[] = await Product.find({
    newArrival: true,
    status: true,
  }).lean();

  return (
    <main className="min-h-screen bg-[#FCF8F6]">

      {/* Hero */}

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6f1d46]">
            ClothesTown
          </p>

          <h1 className="mt-5 text-5xl font-bold text-gray-900">
            New Arrivals
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Discover the latest additions to our collection, selected for
            their comfort, quality, and contemporary style.
          </p>

        </div>
      </section>

      {/* Products */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        {products.length === 0 ? (

          <div className="rounded-3xl border bg-white py-20 text-center">

            <h2 className="text-3xl font-bold">
              No New Arrivals Found
            </h2>

            <p className="mt-3 text-gray-500">
              New products will appear here soon.
            </p>

          </div>

        ) : (

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {products.map((product) => (

              <div
                key={product._id.toString()}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl"
              >

                {/* Image */}

                <div className="relative h-[420px] overflow-hidden">

                  <Image
                    src={
                      product.images?.[0] ||
                      "/images/placeholder-product.jpg"
                    }
                    alt={product.name}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  {/* Badge */}

                  <span className="absolute left-4 top-4 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow">
                    NEW
                  </span>

                </div>

                {/* Content */}

                <div className="p-6">

                  <h2 className="text-2xl font-semibold text-[#2B1A22]">
                    {product.name}
                  </h2>

                  {product.discountPrice ? (

                    <div className="mt-4 flex items-center gap-3">

                      <span className="text-2xl font-bold text-[#6f1d46]">
                        Rs. {product.discountPrice}
                      </span>

                      <span className="text-gray-400 line-through">
                        Rs. {product.price}
                      </span>

                    </div>

                  ) : (

                    <p className="mt-4 text-2xl font-bold text-[#6f1d46]">
                      Rs. {product.price}
                    </p>

                  )}

                  <Link
                    href={`/product/${product.slug}`}
                    className="mt-6 block rounded-xl bg-[#6f1d46] py-3 text-center font-semibold text-white transition hover:bg-[#5a1738]"
                  >
                    View Product
                  </Link>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}
