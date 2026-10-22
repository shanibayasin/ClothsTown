import Image from "next/image";
import Link from "next/link";

export interface StoreProductCardData {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  stock?: number;
  newArrival?: boolean;
  isNewArrival?: boolean;
}

export default function ProductCard({ product }: { product: StoreProductCardData }) {
  const discountPrice = product.discountPrice ?? 0;
  const onSale = discountPrice > 0 && discountPrice < product.price;
  const image = product.images?.[0] || "/images/placeholder-product.jpg";
  const discountPercent = onSale
    ? Math.round(((product.price - discountPrice) / product.price) * 100)
    : 0;

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/4.5] overflow-hidden bg-slate-50"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {onSale && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
            {discountPercent}% OFF
          </span>
        )}
        {(product.newArrival || product.isNewArrival) && (
          <span className="absolute right-2 top-2 rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">
            New
          </span>
        )}
      </Link>
      <div className="p-3">
        <Link
          href={`/product/${product.slug}`}
          className="block truncate text-sm font-semibold text-slate-800 hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className={`text-sm font-bold ${onSale ? "text-red-700" : "text-slate-900"}`}>
            Rs. {(onSale ? discountPrice : product.price).toLocaleString()}
          </span>
          {onSale && (
            <span className="text-xs text-slate-400 line-through">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>
        <p className={`mt-2 text-[11px] ${product.stock ? "text-emerald-700" : "text-red-600"}`}>
          {product.stock ? `${product.stock} available` : "Out of stock"}
        </p>
      </div>
    </article>
  );
}
