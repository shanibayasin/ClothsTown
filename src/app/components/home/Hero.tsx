"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Headset,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/api";
import HeroBanner from "@/app/components/shop/HeroBanner";

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
        className="aspect-[1.55/1] min-h-[220px] animate-pulse bg-[#f2e5e9] sm:aspect-[2.8/1] sm:min-h-[260px] lg:aspect-[4/1] lg:min-h-[320px]"
      />
    );
  }

  if (!slide) {
    return (
      <section aria-label="Featured collection" className="bg-white">
        <HeroBanner
          name="Discover Clothstown"
          subtitle="Style for every day"
          buttonText="Shop Now"
          buttonLink="/shop"
          fullBleed={false}
        />
      </section>
    );
  }

  return (
    <section aria-label="Featured collection" className="bg-white">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HeroBanner
              name={slide.title.replace(/\n/g, " ") || "Featured collection"}
              image={slide.image}
              title={slide.title}
              subtitle={slide.subtitle}
              description={slide.description}
              buttonText={slide.buttonText || "Shop Now"}
              buttonLink={slide.buttonLink || "/shop"}
              imagePosition="right"
              fullBleed={false}
              priority
              imageAlt={slide.title.replace(/\n/g, " ") || "Featured collection"}
              className="mb-0"
            />
          </motion.div>
        </AnimatePresence>
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-5 z-30 flex items-center gap-2.5 sm:bottom-6 sm:left-[5.4%]">
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
