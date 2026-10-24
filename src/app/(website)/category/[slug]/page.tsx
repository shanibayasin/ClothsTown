import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";

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
      <section className="bg-white py-24 text-center">
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
    <section className="mx-auto max-w-7xl bg-white px-6 py-16">

      {/* Header */}

      <div className="mb-12 text-center">

        <h1 className="text-5xl font-bold text-[#102d40]">
          {category.name}
        </h1>

        <p className="mt-4 text-[#536875]">
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