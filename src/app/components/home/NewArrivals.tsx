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
  newArrival: boolean;
  status: boolean;
};

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products?newArrival=true&limit=8", { cache: "no-store" });
        if (!res.ok) throw new Error(`New arrivals request failed (${res.status}).`);
        const data = await readJsonResponse<Product[] | { products: Product[] }>(res, []);
        const productsData = Array.isArray(data) ? data : data.products ?? [];
        setProducts(productsData.slice(0, 8));
      } catch (error) {
        console.error("Failed to load new arrivals:", error);
        setError("New arrivals could not be loaded. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="bg-white py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[#172a33] sm:text-xl">
            New Arrivals
          </h2>
          <Link
            href="/new-arrivals"
            className="group inline-flex items-center gap-1 text-[11px] font-semibold text-[#172a33] transition hover:text-primary sm:text-xs"
          >
            View All
            <ArrowRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[1.2] rounded-sm bg-gray-100" />
                <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                <div className="mt-2 h-7 rounded-sm bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p role="status" className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No new arrivals available right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
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
                  className="group min-w-0 overflow-hidden rounded-sm bg-white"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative block aspect-[1.2] overflow-hidden bg-[#f3f3f3]"
                  >
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[8px] font-bold leading-none text-white ${
                        onSale ? "bg-[#df2638]" : "bg-[#27975a]"
                      }`}
                    >
                      {onSale ? "Sale" : "New"}
                    </span>
                  </Link>

                  <div className="px-1.5 pb-1.5 pt-1.5 sm:px-2">
                    <Link
                      href={`/product/${product.slug}`}
                      className="block truncate text-[10px] font-semibold text-[#263238] hover:text-primary sm:text-[11px]"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-[9px] sm:text-[10px]">
                      <span className="font-bold text-[#c52232]">
                        Rs. {currentPrice.toLocaleString()}
                      </span>
                      {onSale && (
                        <span className="text-[8px] text-gray-400 line-through">
                          Rs. {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div aria-hidden="true" className="mt-0.5 flex gap-px text-[#f3aa21]">
                      {Array.from({ length: 5 }, (_, star) => (
                        <Star
                          key={star}
                          size={9}
                          fill="currentColor"
                          strokeWidth={0}
                        />
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
                      className="mt-1.5 flex h-7 w-full items-center justify-center gap-1 rounded-sm bg-[#122630] px-1 text-[9px] font-semibold text-white transition hover:bg-primary sm:text-[10px]"
                    >
                      <ShoppingCart size={11} />
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
