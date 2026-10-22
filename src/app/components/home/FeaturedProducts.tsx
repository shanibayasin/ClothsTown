"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { readJsonResponse } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  discountPrice?: number;
  onSale?: boolean;
  newArrival?: boolean;
};

export default function FeaturedSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products/featured", { cache: "no-store" });
        if (!res.ok) throw new Error(`Featured products request failed (${res.status}).`);
        const data = await readJsonResponse<Product[]>(res, []);
        setProducts(data);
      } catch (error) {
        console.error("Featured products fetch error:", error);
        setError("Featured products could not be loaded. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <h2 className="text-[17px] font-bold tracking-tight text-[#102d40] sm:text-xl">
            Featured Products
          </h2>
          <Link
            href="/featured"
            className="group inline-flex items-center gap-1 text-[10px] font-medium text-[#536875] transition hover:text-[#102d40] sm:text-xs"
          >
            View All
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-lg border border-[#e7edf1] p-2.5 sm:p-3">
                <div className="aspect-square rounded-md bg-gray-100" />
                <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                <div className="mt-3 h-8 rounded-md bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p role="status" className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No featured products available right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.slice(0, 8).map((product, index) => {
              const discountPrice = product.discountPrice ?? 0;
              const onSale = discountPrice > 0 && discountPrice < product.price;
              const currentPrice = onSale ? discountPrice : product.price;
              const image = product.images?.[0] || "/placeholder.png";

              return (
                <motion.article
                  key={product._id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="group min-w-0 overflow-hidden rounded-lg border border-[#e7edf1] bg-white shadow-[0_1px_3px_rgba(16,45,64,0.04)] transition-shadow hover:shadow-[0_4px_14px_rgba(16,45,64,0.09)]"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative block aspect-square overflow-hidden bg-[#f3f4f5]"
                  >
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04] sm:p-3"
                    />
                    {(onSale || product.newArrival) && (
                      <span
                        className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[9px] font-bold leading-none text-white sm:left-3 sm:top-3 sm:text-[10px] ${
                          onSale ? "bg-[#df2638]" : "bg-[#27975a]"
                        }`}
                      >
                        {onSale ? "Sale" : "New"}
                      </span>
                    )}
                  </Link>

                  <div className="p-2.5 sm:p-3">
                    <Link
                      href={`/product/${product.slug}`}
                      className="block truncate text-[11px] font-semibold text-[#263238] hover:text-primary sm:text-[13px]"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 flex min-h-5 flex-wrap items-baseline gap-x-2 text-[11px] sm:text-[13px]">
                      <span className={`font-bold ${onSale ? "text-[#df2638]" : "text-[#172a33]"}`}>
                        Rs. {currentPrice.toLocaleString()}
                      </span>
                      {onSale && (
                        <span className="text-[9px] text-gray-400 line-through sm:text-[10px]">
                          Rs. {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div
                      aria-hidden="true"
                      className="mt-1 flex gap-px text-[#f3aa21]"
                    >
                      {Array.from({ length: 5 }, (_, star) => (
                        <Star key={star} size={13} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          _id: product._id,
                          name: product.name,
                          slug: product.slug,
                          image,
                          price: currentPrice,
                          quantity: 1,
                        })
                      }
                      className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#102d40] px-2 text-[10px] font-semibold text-white transition hover:bg-primary sm:h-[34px] sm:text-[11px]"
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
