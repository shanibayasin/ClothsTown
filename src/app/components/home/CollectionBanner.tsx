"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";

interface Collection {
  _id: string;
  slug: string;
  routeGroup?: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  status: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  routeGroup?: string;
  image: string;
  status: boolean;
}

interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  isMen: boolean;
}

export default function CollectionBanner() {
  const [cards, setCards] = useState<PromoCard[]>([]);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const [collectionsRes, categoriesRes] = await Promise.all([
          fetch("/api/collections", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);
        const [collections, categories] = await Promise.all([
          readJsonResponse<Collection[]>(collectionsRes, []),
          readJsonResponse<Category[]>(categoriesRes, []),
        ]);
        const activeCollections = collections.filter((item) => item.status);
        const womenCollection = activeCollections.find((item) =>
          /\b(?:women'?s?|female)\b/i.test(`${item.title} ${item.slug}`)
        );
        const menCollection = activeCollections.find((item) =>
          /\b(?:men'?s?|male)\b/i.test(`${item.title} ${item.slug}`)
        ) || activeCollections.find((item) => item !== womenCollection) ||
          (!womenCollection ? activeCollections[0] : undefined);
        const womenCategory = categories.find(
          (item) => item.status && item.routeGroup === "women"
        );
        const nextCards: PromoCard[] = [];

        if (menCollection) {
          nextCards.push({
            id: menCollection._id,
            title: "Men's Seasonal Edit",
            subtitle: "Up to 40% Off",
            image: menCollection.image,
            href: `/collections/${menCollection.slug}`,
            isMen: true,
          });
        }

        if (womenCollection) {
          nextCards.push({
            id: womenCollection._id,
            title: "Women's Fashion",
            subtitle: "Trendy Styles for You",
            image: womenCollection.image,
            href: `/collections/${womenCollection.slug}`,
            isMen: false,
          });
        } else if (womenCategory) {
          nextCards.push({
            id: womenCategory._id,
            title: "Women's Fashion",
            subtitle: "Trendy Styles for You",
            image: womenCategory.image,
            href: `/shop/${womenCategory.routeGroup}/${womenCategory.slug}`,
            isMen: false,
          });
        } else {
          nextCards.push({
            id: "women-shop",
            title: "Women's Fashion",
            subtitle: "Trendy Styles for You",
            image: "",
            href: "/shop",
            isMen: false,
          });
        }

        setCards(nextCards);
      } catch (error) {
        console.error("Collection banners fetch error:", error);
      }
    }

    fetchCollections();
  }, []);

  if (!cards.length) return null;

  return (
    <section className="bg-white px-4 py-5 sm:px-8 sm:py-7 lg:px-12">
      <div className="mx-auto grid max-w-[1150px] gap-4 lg:grid-cols-2 lg:gap-8">
        {cards.map((card, index) => {
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: index * 0.06 }}
            >
              <Link
                href={card.href}
                className={`group relative flex min-h-[174px] items-center overflow-hidden rounded-lg lg:aspect-[2.45/1] lg:min-h-0 ${
                  card.isMen ? "bg-[#dbe8ef]" : "bg-[#f2e4d8]"
                }`}
              >
                {card.image && (
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 639px) 100vw, 50vw"
                    className="object-cover object-[76%_center] transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <div
                  className={`absolute inset-0 ${
                    card.isMen
                      ? "bg-linear-to-r from-[#102633]/95 from-0% via-[#102633]/85 via-43% via-[#102633]/30 via-63% to-transparent to-80%"
                      : "bg-linear-to-r from-[#f5e9dd]/95 from-0% via-[#f5e9dd]/90 via-43% via-[#f5e9dd]/35 via-63% to-transparent to-80%"
                  }`}
                />
                <div
                  className={`relative z-10 w-[64%] px-5 py-6 sm:px-7 lg:px-9 ${
                    card.isMen ? "text-white" : "text-[#172a33]"
                  }`}
                >
                  <h2 className="max-w-[300px] text-[17px] font-bold leading-tight sm:text-[19px] lg:text-[23px]">
                    {card.title}
                  </h2>
                  {card.subtitle && (
                    <p className="mt-1 max-w-[300px] text-[16px] font-semibold leading-tight sm:text-[18px] lg:text-[23px]">
                      {card.subtitle}
                    </p>
                  )}
                  <span
                    className={`mt-4 inline-flex h-10 min-w-[132px] items-center justify-between gap-2 rounded-lg px-5 text-[10px] font-semibold transition-colors sm:mt-5 sm:text-[11px] lg:h-11 lg:min-w-[148px] lg:px-6 ${
                      card.isMen
                        ? "bg-white text-[#172a33] group-hover:bg-[#f3f4f5]"
                        : "bg-[#102d40] text-white group-hover:bg-primary"
                    }`}
                  >
                    Shop Now
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
