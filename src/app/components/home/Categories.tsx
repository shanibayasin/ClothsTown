"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories", {
        cache: "no-store",
      });
      const data = await readJsonResponse<any[]>(res, []);
      // Filters active entries systematically
      setCategories(data.filter((item: any) => item.status));
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <section className="bg-[#FCF8F6] py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading Section with Right-Aligned View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span className="text-sm uppercase tracking-[0.3em] font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
              Shop By Category
            </span>
            <h2 className="mt-5 font-heading text-4xl sm:text-5xl text-[#2B1A22] tracking-tight">
              Discover Our Categories
            </h2>
            <p className="mt-4 max-w-2xl text-base text-gray-500">
              Explore our premium modest fashion categories crafted with timeless elegance.
            </p>
          </div>

          <Link
            href="/categories"
            className="group inline-flex items-center gap-2 font-semibold text-primary hover:text-[#561537] transition duration-200 shrink-0 text-sm tracking-wider uppercase"
          >
            View All Categories 
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Categories Responsive 4-Column Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Displays only the top 4 featured categories on homepage view */}
          {categories.slice(0, 4).map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
            >
              <Link
                href={`/category/${category._id}`}
                className="group block overflow-hidden rounded-[30px] bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-slate-100"
              >
                {/* Optimized Image Layer with Layout Constraints */}
                <div className="relative h-105 overflow-hidden bg-[#FCF8F6]">
                  <Image
                    src={
                      category.image && category.image.includes("res.cloudinary.com")
                        ? category.image
                        : "/placeholder.png"
                    }
                    alt={category.name}
                    fill
                    // Fixes layout rendering bundle constraints
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  {/* Dark Radial Shaded Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                  {/* Absolute Category Title */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-heading text-2xl sm:text-3xl text-white tracking-wide">
                      {category.name}
                    </h3>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="flex items-center justify-between p-6 bg-white">
                  <div>
                    {/* 🌟 Updated text to match category context mapping */}
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-primary transition-colors duration-300">
                      View Category
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-all duration-300 group-hover:bg-[#4f1233] shadow-sm">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}