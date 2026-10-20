"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
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

  // Load dynamic public visibility banner configurations
  useEffect(() => {
    async function loadBanners() {
      try {
        setLoading(true);
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

  const nextSlide = useCallback(() => {
    if (!slides.length) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides]);

  const prevSlide = () => {
    if (!slides.length) return;
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Automated layout slider interval cycle loop
  useEffect(() => {
    if (!slides.length) return;
    const slider = setInterval(nextSlide, 5000);
    return () => clearInterval(slider);
  }, [current, nextSlide, slides.length]);

  const slide = slides.length > 0 ? slides[current] : null;

  // Render a clean luxury loading state to preserve smooth layout shifts
  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-[#fdf8f8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Structural boundary safeguard if no active layers exist in database
  if (!slide) return null;

  return (
    <section className="relative overflow-hidden bg-[#fdf8f8] min-h-screen">
      {/* Background Glow */}
      <div className="absolute -left-62.5 top-20 h-125 w-125 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -right-45 bottom-0 h-112.5 w-112.5 rounded-full bg-[#d4af37]/10 blur-[120px]" />

      {/* Watermark Branding */}
      <h1 className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 select-none whitespace-nowrap text-[180px] font-black uppercase tracking-[0.25em] text-primary/5">
        VELORAÉ
      </h1>

      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid w-full items-center gap-16 lg:grid-cols-2"
          >
            {/* LEFT CONTENT CONTAINER */}
            <motion.div
              variants={{
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -30 }
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="z-10"
            >
              {slide.subtitle && (
                <span className="inline-flex rounded-full border border-primary/20 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary shadow">
                  {slide.subtitle}
                </span>
              )}

              <h1 className="mt-8 whitespace-pre-line font-heading text-5xl leading-none text-[#2c1d24] sm:text-6xl xl:text-7xl">
                {slide.title}
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-gray-600">
                {slide.description}
              </p>

              {/* Dynamic Call-To-Action Routing Links */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <Link
                  href={slide.buttonLink || "/shop"}
                  className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-white shadow-xl shadow-primary/20 transition duration-300 hover:scale-105 hover:bg-[#561537]"
                >
                  {slide.buttonText || "Shop Collection"}
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href={slide.buttonLink || "/collections"}
                  className="font-medium text-primary transition hover:underline"
                >
                  Discover More →
                </Link>
              </div>

              {/* Brand Authority Analytics Statistics */}
              <div className="mt-16 grid max-w-md grid-cols-3 gap-8">
                <div>
                  <h2 className="text-3xl font-bold text-primary">12+</h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">Collections</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-primary">5K+</h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">Customers</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-primary">98%</h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">Satisfaction</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT IMAGE CONTAINER LAYER */}
            <motion.div
              variants={{
                initial: { opacity: 0, x: 40 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -40 }
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute h-130 w-130 rounded-full bg-[#d4af37]/20 blur-[100px]" />
              <div className="absolute h-160 w-115 rounded-[50px] border border-primary/10 hidden sm:block" />

              <div className="relative z-10 w-full overflow-hidden rounded-[50px] bg-white shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
                <Image
                  src={slide.image || "/images/placeholder-banner.jpg"}
                  alt={slide.title ? slide.title.replace("\n", " ") : "Luxury Wear"}
                  width={550}
                  height={760}
                  priority
                  className="h-125 md:h-162.5 lg:h-175 w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              {/* Floating Highlight Layer badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -left-4 top-24 rounded-2xl bg-white p-5 shadow-xl hidden sm:block"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">New</p>
                <h3 className="mt-2 text-xl font-semibold text-primary">Spring</h3>
                <p className="text-sm text-gray-500">Collection</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Slider Dot Navigations controls */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-6 z-20">
        <button
          onClick={prevSlide}
          aria-label="Previous homepage visual slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-white shadow transition duration-300 hover:bg-primary hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-3">
          {slides.map((slideItem, index) => (
            <button
              key={slideItem._id}
              onClick={() => setCurrent(index)}
              aria-label={`Maps to slide indexing ${index + 1}`}
              className={`transition-all duration-300 ${
                current === index ? "h-2.5 w-10 rounded-full bg-primary" : "h-2.5 w-2.5 rounded-full bg-[#d7c8cf]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          aria-label="Next homepage visual slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-white shadow transition duration-300 hover:bg-primary hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Interactive Micro Scroll Tracking Layer */}
      <div className="absolute bottom-10 right-10 hidden xl:flex flex-col items-center z-20">
        <span className="mb-3 rotate-90 text-[11px] uppercase tracking-[0.3em] text-gray-400">
          Scroll
        </span>
        <div className="h-16 w-0.5 rounded-full bg-gray-300 overflow-hidden">
          <motion.div
            animate={{ y: [-32, 64, -32] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-8 w-full rounded-full bg-primary"
          />
        </div>
      </div>
    </section>
  );
}