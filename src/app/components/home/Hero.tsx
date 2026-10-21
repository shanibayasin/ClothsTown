"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headset,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/api";

type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
};

const benefits = [
  { Icon: Truck, title: "Free Delivery", detail: "All Over Pakistan" },
  { Icon: ShieldCheck, title: "Cash on Delivery", detail: "Available" },
  { Icon: RefreshCw, title: "Easy Returns", detail: "& Exchanges" },
  { Icon: Headset, title: "24/7 Support", detail: "We are here to help" },
];

export default function Hero() {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners/public");
        const data = await readJsonResponse<Banner[]>(res, []);
        setSlides(data);
      } catch (error) {
        console.error("Hero content fetch error log:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBanners();
  }, []);

  const nextSlide = () => {
    if (slides.length > 1) setCurrent((previous) => (previous + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length > 1) {
      setCurrent((previous) => (previous === 0 ? slides.length - 1 : previous - 1));
    }
  };

  const slide = slides[current];

  if (loading) {
    return (
      <div
        aria-label="Loading featured collection"
        className="h-[clamp(390px,105vw,500px)] animate-pulse bg-[#eaf1f6] sm:h-[clamp(390px,50vw,560px)] lg:h-[clamp(500px,42.7vw,620px)]"
      />
    );
  }

  if (!slide) return null;

  return (
    <section aria-label="Featured collection" className="bg-white">
      <div className="relative isolate h-[clamp(390px,105vw,500px)] overflow-hidden bg-[#dceaf4] sm:h-[clamp(390px,50vw,560px)] lg:h-[clamp(500px,42.7vw,620px)]">
        {slide.image && (
          <AnimatePresence mode="wait">
            <motion.div
              key={slide._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-0"
            >
              <Image
                src={slide.image}
                alt={slide.title.replace(/\n/g, " ") || "Featured collection"}
                fill
                priority
                sizes="100vw"
                quality={100}
                className="object-cover object-[70%_center] sm:object-[68%_center]"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
        )}
        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-r from-[#e3eff8]/95 via-[#e3eff8]/75 to-transparent via-45% to-75% sm:via-[#e3eff8]/55 sm:via-40% sm:to-65% lg:via-[#e3eff8]/40 lg:via-38% lg:to-60%" />
        <div className="relative z-20 mx-auto flex h-full max-w-[1440px] items-center px-4 sm:px-8 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[470px] pb-12 sm:pb-8"
            >
              <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em] text-[#102d40] sm:text-[10px] sm:tracking-[0.24em] lg:text-[11px]">
                {slide.subtitle}
              </p>
              <h1 className="whitespace-pre-line text-[32px] font-extrabold leading-[1.02] tracking-tight text-[#102d40] sm:text-[40px] lg:text-[52px]">
                {slide.title}
              </h1>
              {slide.description && (
                <p className="mt-3 max-w-[340px] whitespace-pre-line text-[10px] leading-[1.5] text-[#243d4d] sm:mt-4 sm:text-xs sm:leading-[1.55]">
                  {slide.description}
                </p>
              )}
              <Link
                href={slide.buttonLink || "/shop"}
                className="mt-4 inline-flex h-8 items-center gap-2 rounded-full bg-[#102d40] px-4 text-[10px] font-semibold text-white transition hover:bg-primary sm:mt-5 sm:h-9 sm:px-5 sm:text-[11px]"
              >
                {slide.buttonText || "Shop Now"}
                <ArrowRight size={13} />
              </Link>

            </motion.div>
          </AnimatePresence>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-5 z-30 flex items-center gap-2.5 sm:bottom-6 sm:left-[5.4%]">
            <div className="flex items-center gap-2.5" aria-label="Featured collection slides">
              {slides.map((item, index) => (
                <button
                  key={item._id}
                  onClick={() => setCurrent(index)}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={current === index}
                  className={`size-[9px] rounded-full transition-colors ${
                    current === index
                      ? "bg-white"
                      : "bg-[#102d40] hover:bg-[#102d40]/70"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={prevSlide}
              aria-label="Previous featured collection"
              className="ml-12 flex size-[29px] items-center justify-center rounded-full bg-white text-[#102d40] shadow-sm transition hover:bg-white/85"
            >
              <ChevronLeft size={17} strokeWidth={2} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next featured collection"
              className="flex size-[29px] items-center justify-center rounded-full bg-white text-[#102d40] shadow-sm transition hover:bg-white/85"
            >
              <ChevronRight size={17} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-[#e8edf1] bg-[#f8fafc]">
        <div className="mx-auto grid min-h-[88px] max-w-[1440px] grid-cols-2 items-center px-4 sm:min-h-[96px] sm:grid-cols-4 sm:px-8 lg:min-h-[110px] lg:px-16">
          {benefits.map(({ Icon, title, detail }, index) => (
            <div
              key={title}
              className={`flex items-center justify-center gap-3 py-4 text-[#102d40] sm:justify-start sm:px-4 lg:gap-4 lg:px-6 ${
                index > 0 ? "sm:border-l sm:border-[#dfe6eb]" : ""
              }`}
            >
              <Icon size={32} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
              <span className="text-[9px] leading-tight sm:text-[11px]">
                <span className="block font-bold">{title}</span>
                <span className="mt-0.5 block text-[#536875]">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
