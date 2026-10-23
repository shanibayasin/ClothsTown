import Image from "next/image";
import Link from "next/link";

export interface StoreProductCardData {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  brand?: string;
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
    <article className="group min-w-0 overflow-hidden rounded-lg bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,41,59,0.12)]">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[1/1.08] overflow-hidden rounded-md bg-[#f3efec]"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
        {onSale && (
          <span className="absolute left-2 top-2 rounded-sm bg-[#d94d68] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-2.5 sm:top-2.5">
            {discountPercent}% OFF
          </span>
        )}
        {(product.newArrival || product.isNewArrival) && (
          <span className={`absolute top-2 rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:top-2.5 ${
            onSale ? "left-2 top-8 sm:left-2.5 sm:top-9" : "left-2 sm:left-2.5"
          } bg-[#7fa6a0]`}>
            New
          </span>
        )}
      </Link>
      <div className="px-1.5 pb-2 pt-2 sm:px-2 sm:pb-2.5 sm:pt-2.5">
        <Link
          href={`/product/${product.slug}`}
          className="block truncate text-[11px] font-semibold leading-4 text-[#39312f] hover:text-primary sm:text-xs"
        >
          {product.name}
        </Link>
        {product.brand && (
          <p className="mt-0.5 truncate text-[9px] text-[#817975] sm:text-[10px]">
            {product.brand}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xs font-bold ${onSale ? "text-[#a6384e]" : "text-[#332c2a]"} sm:text-sm`}>
            Rs. {(onSale ? discountPrice : product.price).toLocaleString()}
          </span>
          {onSale && (
            <span className="text-[10px] text-[#a7a09c] line-through">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>
        <p className={`mt-1 text-[9px] ${product.stock ? "text-[#678277]" : "text-[#b74453]"}`}>
          {product.stock ? `${product.stock} available` : "Out of stock"}
        </p>
      </div>
    </article>
  );
}
