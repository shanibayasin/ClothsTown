import mongoose from "mongoose";
import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({
  params,
}: Props) {
  await connectDB();

  const { slug } = await params;

  const category: any = await Category.findOne({
    $or: [
      { slug },
      ...(mongoose.Types.ObjectId.isValid(slug)
        ? [{ _id: new mongoose.Types.ObjectId(slug) }]
        : []),
    ],
  }).lean();

  if (!category) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-4xl font-bold">
          Category Not Found
        </h1>
      </section>
    );
  }

  const products: any[] = await Product.find({
    category: category._id,
    status: true,
  })
    .populate("category")
    .lean();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">

      {/* Header */}

      <div className="mb-12 text-center">

        <h1 className="text-5xl font-bold text-[#6f1d46]">
          {category.name}
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
                  <span className="absolute right-3 top-3 rounded-full bg-[#6f1d46] px-3 py-1 text-xs text-white">
                    Featured
                  </span>
                )}

              </div>

              <div className="p-6">

                <h2 className="text-2xl font-semibold">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {category.name}
                </p>

                <div className="mt-4">

                  {product.discountPrice ? (
                    <div className="flex items-center gap-3">

                      <span className="text-xl font-bold text-[#6f1d46]">
                        Rs. {product.discountPrice}
                      </span>

                      <span className="text-gray-400 line-through">
                        Rs. {product.price}
                      </span>

                    </div>
                  ) : (
                    <span className="text-xl font-bold text-[#6f1d46]">
                      Rs. {product.price}
                    </span>
                  )}

                </div>

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
  );
}