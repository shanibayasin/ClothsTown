"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";
import CategoryImage from "@/app/components/category/CategoryImage";
import {
  CATEGORY_CATALOG,
  getCategoryHref,
} from "@/lib/category-catalog";

interface Category {
  name: string;
  slug: string;
  image?: string;
  fallbackImage?: string;
  href?: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>(
    CATEGORY_CATALOG.map((category) => ({
      ...category,
      image: "",
      href: getCategoryHref(category),
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories", {
          cache: "no-store",
        });
        const data = await readJsonResponse<Category[]>(res, []);
        const categoriesBySlug = new Map(
          data.filter((category) => category.image).map((category) => [category.slug, category])
        );
        setCategories(
          CATEGORY_CATALOG.map((definition) => ({
            ...definition,
            image: categoriesBySlug.get(definition.slug)?.image ?? "",
            href: getCategoryHref(definition),
          }))
        );
      } catch (error) {
        console.error("Categories fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <h2 className="text-[17px] font-bold tracking-tight text-[#102d40] sm:text-xl">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[#536875] transition-colors hover:text-[#102d40] sm:text-xs"
          >
            View All
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8 lg:mx-auto lg:max-w-[1150px] lg:overflow-visible lg:px-0">
              <div className="flex w-max gap-4 sm:gap-6 lg:grid lg:w-full lg:grid-cols-5 lg:gap-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex w-[104px] shrink-0 animate-pulse flex-col items-center sm:w-[120px] lg:w-auto">
                  <div className="size-[76px] rounded-full bg-gray-100 min-[380px]:size-[84px] sm:size-[104px] lg:size-[128px]" />
                  <div className="mt-3 h-3 w-4/5 rounded bg-gray-100" />
                  <div className="mt-2 h-2.5 w-14 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8 lg:mx-auto lg:max-w-[1150px] lg:overflow-visible lg:px-0">
            <div className="flex w-max gap-4 sm:gap-6 lg:grid lg:w-full lg:grid-cols-5 lg:gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="w-max min-w-[104px] shrink-0 sm:min-w-[120px] lg:w-auto lg:min-w-0"
                >
                  <Link
                    href={category.href ?? `/shop/${category.slug}`}
                    className="group flex w-full flex-col items-center text-center text-[#102d40]"
                  >
                    <span className="relative block size-[76px] shrink-0 overflow-hidden rounded-xl bg-[#f2f3f4] min-[380px]:size-[84px] sm:size-[104px] lg:size-[128px]">
                      <CategoryImage
                        src={category.image}
                        fallbackSrc={category.fallbackImage}
                        alt={category.name}
                        sizes="(max-width: 379px) 76px, (max-width: 639px) 84px, (max-width: 1023px) 104px, 128px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        fallbackClassName="text-[10px] text-gray-500"
                      />
                    </span>
                    <span className="mt-2 whitespace-nowrap text-[10px] font-semibold leading-4 sm:text-xs">
                      {category.name}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[9px] text-[#536875] transition-colors group-hover:text-[#102d40] sm:text-[10px]">
                      Shop Now
                      <ArrowRight
                        size={11}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}