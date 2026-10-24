import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import HeroBanner from "@/app/components/shop/HeroBanner";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";
import { getCategoryDefinition } from "@/lib/category-catalog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({
  params,
}: Props) {
  const { slug } = await params;
  const definition = getCategoryDefinition(slug.toLowerCase());
  if (!definition) notFound();

  await connectDB();
  const databaseCategory = await Category.findOne({
    slug: definition.slug,
    status: true,
  }).lean();
  const category = {
    ...definition,
    ...databaseCategory,
    name: definition.name,
    slug: definition.slug,
  };
  const productDocuments = databaseCategory
    ? await Product.find({
        category: databaseCategory._id,
        status: true,
      })
        .populate("category")
        .lean()
    : [];
  const products: StoreProductCardData[] = productDocuments.map((product) =>
    JSON.parse(JSON.stringify(product)) as StoreProductCardData
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl bg-white px-6 py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[#6d5961]">
        <Link href="/" className="hover:text-[#6f1d46]">Home</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#321b27]">{category.name}</span>
      </nav>
      <HeroBanner
        name={category.name}
        image={
          category.bannerImage ||
          category.image ||
          products[0]?.images?.[0] ||
          products[0]?.image
        }
        title={category.bannerTitle}
        description={category.bannerDescription}
        buttonText={category.bannerButtonText || `Shop ${category.name}`}
        buttonLink={
          category.bannerButtonLink ||
          `/shop/${category.routeGroup}/${category.slug}`
        }
        position={category.bannerPosition}
        priority
      />
      <div className="mb-8 text-center text-sm text-[#806d75]">
        {products.length} Products Available
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
              key={product._id}
              product={product}
            />
          ))}

        </div>

      )}

    </main>
  );
}