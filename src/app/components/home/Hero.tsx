"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function Hero() {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failedImageId, setFailedImageId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBanners() {
      try {
        const response = await fetch("/api/banners/public");
        setSlides((await readJsonResponse<Banner[]>(response, [])).slice(0, 3));
      } catch (error) {
        console.error("Hero content fetch error log:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBanners();
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;

    const intervalId = window.setInterval(() => {
      setCurrent((index) => (index + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  function showSlide(index: number) {
    if (slides.length < 2) return;
    setCurrent((index + slides.length) % slides.length);
  }

  if (loading) {
    return (
      <div
        aria-label="Loading featured collection"
        aria-busy="true"
        className="w-full bg-[#F8F5EF]"
      >
        <div className="aspect-[1.2/1] animate-pulse bg-[#F1ECE4] md:aspect-[2.4/1] lg:aspect-[3/1]" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];
  if (!slide) return null;

  return (
    <section
      aria-label="Featured collection"
      aria-roledescription="carousel"
      className="relative isolate w-full overflow-hidden bg-[#F8F5EF] text-[#0F2D39]"
    >
      <div className="relative aspect-[1.2/1] w-full overflow-hidden bg-[#F8F5EF] md:aspect-[2.4/1] lg:aspect-[3/1]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0 bg-[#F8F5EF]"
          >
            {failedImageId === slide._id ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(135deg,#F8F5EF_0%,#E9DFD3_50%,#F8F5EF_100%)]"
              />
            ) : (
              <Image
                src={slide.image}
                alt=""
                fill
                preload={current === 0}
                unoptimized
                sizes="100vw"
                onError={() => {
                  console.error("Hero banner image failed to load:", slide.image);
                  setFailedImageId(slide._id);
                }}
                className="object-cover object-[66%_center] md:object-center"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0F2D39]/80 via-[#0F2D39]/55 to-[#0F2D39]/10 md:hidden"
        />

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => showSlide(current - 1)}
              aria-label="Previous featured collection"
              className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0F2D39] shadow-[0_2px_12px_rgba(15,45,57,.16)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B65] sm:left-7 sm:size-[54px]"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => showSlide(current + 1)}
              aria-label="Next featured collection"
              className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0F2D39] shadow-[0_2px_12px_rgba(15,45,57,.16)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B65] sm:right-7 sm:size-[54px]"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <div
              role="group"
              aria-label="Choose a featured collection"
              className="absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-2 sm:bottom-4 sm:gap-3"
            >
              {slides.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => showSlide(index)}
                  aria-label={`Show banner ${index + 1}: ${item.title}`}
                  aria-current={current === index ? "true" : undefined}
                  className="group flex h-6 items-center py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B65]"
                >
                  <span
                    aria-hidden="true"
                    className={`h-1 rounded-full transition-all duration-300 ${
                      current === index
                        ? "w-9 bg-[#0F2D39] sm:w-12"
                        : "w-6 bg-[#D1D5DB] group-hover:bg-[#C18B65] sm:w-7"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-0 z-10 flex items-center px-5 py-5 text-left md:inset-y-0 md:left-0 md:flex md:w-[54%] md:items-center md:bg-transparent md:py-0 md:pl-[6vw] md:pr-4 lg:left-[43%] lg:w-[30%] lg:pl-0">
        <div className="w-[72%] max-w-[620px] md:mx-0 md:w-full">
          {slide.subtitle.trim() && (
            <>
              <p className="whitespace-pre-line text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-[#F8F5EF] sm:text-sm md:tracking-[0.22em] md:text-[#C18B65]">
                {slide.subtitle}
              </p>
              <span
                aria-hidden="true"
                className="mt-2 block h-[2px] w-8 bg-[#C18B65] md:mt-3 md:w-12"
              />
            </>
          )}
          {slide.title.trim() && (
            <h1 className="mt-2 whitespace-pre-line font-heading text-[clamp(1.65rem,7.5vw,2.4rem)] font-medium uppercase leading-[0.94] tracking-[-0.04em] text-[#F8F5EF] [text-wrap:balance] md:mt-0 md:text-[clamp(2.5rem,5.4vw,6.5rem)] md:text-[#0F2D39] lg:text-[clamp(2rem,4.2vw,5.25rem)]">
              {slide.title}
            </h1>
          )}
          {slide.description.trim() && (
            <p className="mt-2 max-w-[560px] whitespace-pre-line text-[11px] leading-snug text-[#F8F5EF]/95 sm:text-sm md:mt-4 md:leading-relaxed md:text-[#0F2D39] lg:text-base">
              {slide.description}
            </p>
          )}
          {slide.buttonText.trim() && slide.buttonLink.trim() && (
            <Link
              href={slide.buttonLink}
              className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-[#0F2D39] px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#F8F5EF] transition-colors hover:bg-[#C18B65] hover:text-[#0F2D39] sm:mt-6 sm:min-h-12 sm:gap-3 sm:px-8 sm:text-sm"
            >
              {slide.buttonText}
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
