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
        setSlides(await readJsonResponse<Banner[]>(response, []));
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
        className="aspect-[1/1.08] min-h-[390px] animate-pulse bg-[#F8F5EF] sm:aspect-[2.1/1] sm:min-h-[310px] lg:aspect-[3.15/1] lg:min-h-[420px]"
      />
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];
  if (!slide) return null;

  return (
    <section
      aria-label="Featured collection"
      aria-roledescription="carousel"
      className="relative isolate aspect-[1/1.08] min-h-[390px] overflow-hidden bg-[#F8F5EF] text-[#0F2D39] sm:aspect-[2.1/1] sm:min-h-[310px] lg:aspect-[3.15/1] lg:min-h-[420px]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
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
              priority={current === 0}
              unoptimized
              sizes="100vw"
              onError={() => {
                console.error("Hero banner image failed to load:", slide.image);
                setFailedImageId(slide._id);
              }}
              className="object-cover object-[34%_center] sm:object-center"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,245,239,0)_18%,rgba(248,245,239,.08)_38%,rgba(248,245,239,.68)_62%,rgba(248,245,239,.92)_100%)] max-sm:bg-[linear-gradient(0deg,rgba(248,245,239,.97)_0%,rgba(248,245,239,.84)_35%,rgba(248,245,239,0)_76%)]"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto grid h-full max-w-[1920px] grid-cols-1 items-end px-6 pb-16 pt-6 sm:grid-cols-[1fr_0.92fr] sm:items-center sm:px-10 sm:pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-[5.5%]">
        <div aria-hidden="true" className="hidden sm:block" />
        <div className="ml-auto w-full max-w-[680px] text-center text-[#0F2D39] sm:text-center">
          {slide.subtitle.trim() && (
            <p className="mb-1 whitespace-pre-line text-[clamp(.65rem,1.35vw,1.35rem)] font-medium uppercase leading-tight tracking-[0.22em] text-[#C18B65] sm:mb-2">
              {slide.subtitle}
            </p>
          )}
          {slide.title.trim() && (
            <h1 className="whitespace-pre-line font-heading text-[clamp(2rem,5.3vw,6.5rem)] font-medium uppercase leading-[0.92] tracking-[-0.04em] text-[#0F2D39] [text-wrap:balance]">
              {slide.title}
            </h1>
          )}
          {slide.description.trim() && (
            <p className="mx-auto mt-2 max-w-[600px] whitespace-pre-line text-[clamp(.7rem,1.35vw,1.35rem)] leading-[1.35] tracking-[0.07em] sm:mt-4">
              {slide.description}
            </p>
          )}
          {slide.buttonText.trim() && slide.buttonLink.trim() && (
            <Link
              href={slide.buttonLink}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-3 rounded-full bg-[#0F2D39] px-6 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#F8F5EF] transition-colors hover:bg-[#C18B65] hover:text-[#0F2D39] sm:mt-6 sm:min-h-12 sm:px-8 sm:text-sm"
            >
              {slide.buttonText}
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => showSlide(current - 1)}
            aria-label="Previous featured collection"
            className="absolute left-4 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F2D39] shadow-[0_2px_12px_rgba(15,45,57,.16)] transition-colors hover:bg-[#F8F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B65] sm:left-7 sm:size-[54px]"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => showSlide(current + 1)}
            aria-label="Next featured collection"
            className="absolute right-4 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F2D39] shadow-[0_2px_12px_rgba(15,45,57,.16)] transition-colors hover:bg-[#F8F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B65] sm:right-7 sm:size-[54px]"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <div
            role="group"
            aria-label="Choose a featured collection"
            className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-3 sm:bottom-6"
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
    </section>
  );
}
