"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
};

export default function FeaturedSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/products/featured", {
          cache: "no-store",
        });
        const data = await readJsonResponse<Product[]>(res, []);
        setProducts(data);
      } catch (error) {
        console.error("Featured components fetch exception log:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="bg-[#fdf8f8]/40 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        
        {/* Top Header Row Options Panel */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
              Premium Picks
            </span>
            <h2 className="mt-5 font-heading text-4xl sm:text-5xl text-[#2B1A22] tracking-tight">
              Featured Collection
            </h2>
            <p className="mt-4 max-w-xl text-base text-gray-500 leading-relaxed">
              Discover our handpicked luxury pieces chosen for elegance,
              craftsmanship and timeless style.
            </p>
          </div>

          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary bg-white shadow-sm transition duration-300 hover:bg-primary hover:text-white self-start md:self-auto hover:scale-105"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Dynamic Items Content Grid Layer */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-[30px] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-medium text-slate-500 tracking-wide">Hydrating featured collections...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full rounded-[30px] border border-dashed border-[#d8b7c7] bg-[#FCF8F6] px-6 py-16 text-center shadow-inner animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-[#2B1A22]">
                No Featured Products Live
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Our customized luxury seasonal selection updates are currently processing. Please check back shortly.
              </p>
            </div>
          ) : (
            products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                  ease: "easeOut"
                }}
              >
                <div className="group overflow-hidden rounded-[30px] bg-white shadow-md border border-slate-50/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full">
                  
                  {/* Visual Image Thumbnail Holder Container */}
                  <div className="relative h-100 w-full overflow-hidden bg-slate-50">
                    <Image
                      src={product.images?.[0] || "/images/placeholder-product.jpg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-80" />
                    <div className="absolute left-5 top-5 rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
                      Featured
                    </div>
                  </div>

                  {/* Descriptions details layout footer */}
                  <div className="p-6 flex flex-col grow justify-between">
                    <div>
                      <h3 className="font-heading text-xl text-[#2B1A22] line-clamp-1 group-hover:text-primary transition">
                        {product.name}
                      </h3>
                      <p className="mt-3 text-xl font-black text-primary">
                        Rs. {product.price ? product.price.toLocaleString() : "0"}
                      </p>
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:bg-[#561537] hover:shadow-xl group-hover:scale-[1.02]"
                    >
                      View Product
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}