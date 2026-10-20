"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  newArrival: boolean;
  status: boolean;
};

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await readJsonResponse<Product[] | { products: Product[] }>(res, []);

        const productsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : [];

        const arrivals = productsData.filter(
          (item: Product) => item.newArrival && item.status
        );

        setProducts(arrivals);
      } catch (error) {
        console.error("Failed to load new arrivals:", error);
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="bg-[#FCF8F6] py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-sm uppercase tracking-[0.3em] text-[#6F1D46]">
            Just Landed
          </span>

          <h2 className="mt-5 font-heading text-5xl text-[#2B1A22]">
            New Arrivals
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-500">
            Discover the latest additions to our luxury modest fashion
            collection.
          </p>
        </motion.div>

        {/* Products */}

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

          {products.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-[#d8b7c7] bg-white/70 px-6 py-10 text-center text-gray-600 sm:py-14">
              No new arrivals available right now.
            </div>
          ) : (
            products.map((product, index) => (

            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
            >
              <div className="group overflow-hidden rounded-4xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">

                {/* Image */}

                <div className="relative h-70 overflow-hidden sm:h-105">

                  <Image
                    src={
                      product.images?.[0] ||
                      "/images/placeholder-product.jpg"
                    }
                    alt={product.name}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}

                  <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />

                  {/* Badge */}

                  <div className="absolute left-5 top-5 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
                    New Arrival
                  </div>

                </div>

                {/* Content */}

                <div className="p-6">

                  <h3 className="font-heading text-2xl text-[#2B1A22]">
                    {product.name}
                  </h3>

                  <p className="mt-4 text-2xl font-bold text-[#6F1D46]">
                    Rs. {product.price}
                  </p>

                  <Link
                    href={`/product/${product.slug}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-medium text-white transition-all duration-300 hover:bg-[#4E1232]"
                  >
                    View Product
                    <ArrowRight size={18} />
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