import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import Product from "@/models/Product";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";

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
    $or: [
      { collections: collection._id },
      { collection: collection._id },
    ],
    status: true,
  })
    .populate("category")
    .populate("collection")
    .populate("collections")
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