import { connection } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter, getFeaturedProductFilter } from "@/lib/products";
import Product from "@/models/Product";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";

export default async function FeaturedPage() {
  await connection();
  await connectDB();

  const products = await Product.find(
    getActiveProductFilter(getFeaturedProductFilter())
  )
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
            <ProductCard
              key={product._id.toString()}
              product={
                JSON.parse(JSON.stringify(product)) as StoreProductCardData
              }
            />
          ))}

        </div>

      )}

    </section>
  );
}