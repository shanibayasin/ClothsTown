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
        <div className="aspect-[16/9] animate-pulse bg-[#F1ECE4] md:aspect-[2.4/1] lg:aspect-[3/1]" />
        <div className="space-y-3 px-6 py-8 md:hidden">
          <div className="mx-auto h-3 w-36 animate-pulse rounded bg-[#E5DED4]" />
          <div className="mx-auto h-9 w-3/4 animate-pulse rounded bg-[#E5DED4]" />
          <div className="mx-auto h-4 w-full max-w-md animate-pulse rounded bg-[#E5DED4]" />
          <div className="mx-auto h-11 w-36 animate-pulse rounded-full bg-[#E5DED4]" />
        </div>
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
      className="relative isolate flex w-full flex-col overflow-hidden bg-[#F8F5EF] text-[#0F2D39] md:block"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F8F5EF] md:aspect-[2.4/1] lg:aspect-[3/1]">
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
                className="object-contain md:object-cover md:object-center"
              />
            )}
          </motion.div>
        </AnimatePresence>

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

      <div className="relative z-10 w-full bg-[#F8F5EF] px-6 py-8 text-center md:absolute md:inset-y-0 md:left-0 md:flex md:w-[54%] md:items-center md:bg-transparent md:py-0 md:pl-[6vw] md:pr-4 md:text-left lg:left-[43%] lg:w-[30%] lg:pl-0">
        <div className="mx-auto w-full max-w-[620px] md:mx-0">
          {slide.subtitle.trim() && (
            <>
              <p className="whitespace-pre-line text-xs font-semibold uppercase leading-tight tracking-[0.22em] text-[#C18B65] sm:text-sm">
                {slide.subtitle}
              </p>
              <span
                aria-hidden="true"
                className="mx-auto mt-3 block h-[2px] w-12 bg-[#C18B65] md:mx-0"
              />
            </>
          )}
          {slide.title.trim() && (
            <h1 className="whitespace-pre-line font-heading text-[clamp(2.5rem,5.4vw,6.5rem)] font-medium uppercase leading-[0.92] tracking-[-0.04em] text-[#0F2D39] [text-wrap:balance] lg:text-[clamp(2rem,4.2vw,5.25rem)]">
              {slide.title}
            </h1>
          )}
          {slide.description.trim() && (
            <p className="mx-auto mt-4 max-w-[560px] whitespace-pre-line text-sm leading-relaxed md:mx-0 lg:text-base">
              {slide.description}
            </p>
          )}
          {slide.buttonText.trim() && slide.buttonLink.trim() && (
            <Link
              href={slide.buttonLink}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-[#0F2D39] px-7 py-2 text-xs font-semibold uppercase tracking-wide text-[#F8F5EF] transition-colors hover:bg-[#C18B65] hover:text-[#0F2D39] sm:min-h-12 sm:px-8 sm:text-sm"
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
