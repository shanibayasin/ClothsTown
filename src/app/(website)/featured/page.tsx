import { connection } from "next/server";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter, getFeaturedProductFilter } from "@/lib/products";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";
import HeroBanner from "@/app/components/shop/HeroBanner";

export default async function FeaturedPage() {
  await connection();
  await connectDB();

  const [products, featuredCategory] = await Promise.all([
    Product.find(getActiveProductFilter(getFeaturedProductFilter()))
      .sort({ createdAt: -1 })
      .lean(),
    Category.findOne({
      status: true,
      $or: [
        { slug: /^featured(?:-products|-collection)?$/i },
        { name: /^featured(?: products| collection)?$/i },
      ],
    }).lean(),
  ]);

  return (
    <main className="min-h-screen">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 py-3 text-xs text-[#806d75]">
        <Link href="/" className="hover:text-[#6f1d46]">Home</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#321b27]">Featured</span>
      </nav>
      <HeroBanner
        name="Featured Collection"
        image={
          featuredCategory?.bannerImage ||
          featuredCategory?.image ||
          products[0]?.images?.[0]
        }
        title={featuredCategory?.bannerTitle}
        description={featuredCategory?.bannerDescription}
        buttonText={featuredCategory?.bannerButtonText || "Shop Featured"}
        buttonLink={featuredCategory?.bannerButtonLink || "#featured-products"}
        position={featuredCategory?.bannerPosition}
        priority
      />

      <section id="featured-products" className="mx-auto max-w-7xl px-6 py-10">
        <p className="mb-8 text-center text-sm text-gray-500">
          {products.length} Featured Products
        </p>

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

    </main>
  );
}