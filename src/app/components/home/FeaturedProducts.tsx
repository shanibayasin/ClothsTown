"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";
import ProductCard from "@/app/components/product/ProductCard";

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
          <h2 className="text-[17px] font-bold tracking-tight text-[var(--brand-primary)] sm:text-xl">
            Featured Products
          </h2>
          <Link
            href="/featured"
            className="group inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--brand-primary)] sm:text-xs"
          >
            View All
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:gap-5 lg:px-12">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="w-[68%] shrink-0 snap-start animate-pulse sm:w-[32%] lg:w-[23%] xl:w-[18.5%]">
                <div className="aspect-[3/4] rounded-md bg-[var(--section-background)]" />
                <div className="mt-2 h-3 w-3/4 rounded bg-[var(--section-background)]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[var(--section-background)]" />
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
          <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:gap-5 lg:px-12">
            {products.slice(0, 8).map((product, index) => {
              return (
                <motion.article
                  key={product._id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="w-[68%] shrink-0 snap-start sm:w-[32%] lg:w-[23%] xl:w-[18.5%]"
                >
                  <ProductCard product={product} />
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
