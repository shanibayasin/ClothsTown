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

  function categoryVisibilityClass(index: number) {
    if (index < 4) return "";
    if (index < 6) return "hidden sm:block";
    if (index < 10) return "hidden lg:block";
    return "hidden";
  }

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
          <h2 className="text-[17px] font-bold tracking-tight text-[var(--brand-primary)] sm:text-xl">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="inline-flex min-h-9 items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)] sm:text-xs"
          >
            All categories
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="mx-auto max-w-[1150px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 lg:gap-x-3">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className={`flex animate-pulse flex-col items-center ${categoryVisibilityClass(index)}`}
                >
                  <div className="size-[76px] rounded-xl bg-gray-100 min-[380px]:size-[84px] sm:size-[104px] lg:size-[128px]" />
                  <div className="mt-3 h-3 w-4/5 rounded bg-gray-100" />
                  <div className="mt-2 h-2.5 w-14 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1150px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 lg:gap-x-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={`min-w-0 ${categoryVisibilityClass(index)}`}
                >
                  <Link
                    href={category.href ?? `/shop/${category.slug}`}
                    className="group flex w-full flex-col items-center text-center text-[var(--brand-primary)]"
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
                    <span className="mt-2 max-w-full text-center text-[10px] font-semibold leading-4 sm:text-xs">
                      {category.name}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[9px] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--brand-primary)] sm:text-[10px]">
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