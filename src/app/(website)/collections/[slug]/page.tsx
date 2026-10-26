import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import Product from "@/models/Product";
import { getActiveProductFilter } from "@/lib/products";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";
import HeroBanner from "@/app/components/shop/HeroBanner";

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

  const collection = await Collection.findOne({
    slug: normalizedSlug,
    status: true,
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

  const products = await Product.find(
    getActiveProductFilter({
      $or: [
        { collections: collection._id },
        { collection: collection._id },
      ],
    })
  )
    .populate("category")
    .populate("collection")
    .populate("collections")
    .lean();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[#806d75]">
        <Link href="/" className="hover:text-[var(--brand-primary)]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/collections" className="hover:text-[var(--brand-primary)]">Collections</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[var(--brand-primary)]">{collection.title}</span>
      </nav>
      <HeroBanner
        name={collection.title}
        image={collection.image}
        title={collection.title}
        subtitle={collection.subtitle}
        description={collection.description}
        buttonText={collection.buttonText || "Shop Collection"}
        buttonLink={collection.buttonLink || "#collection-products"}
        priority
      />
      <section id="collection-products" className="py-8">
        <p className="mb-8 text-center text-sm text-gray-500">
          {products.length} Products Available
        </p>

      {products.length === 0 ? (

        <div className="rounded-2xl border py-20 text-center">

          <h2 className="text-3xl font-bold">
            No Products Found
          </h2>

        </div>

      ) : (

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

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