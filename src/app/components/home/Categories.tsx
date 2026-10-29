"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { readJsonResponse } from "@/lib/api";
import CategoryTile from "@/app/components/category/CategoryTile";

const categoryGridClass =
  "grid grid-cols-2 gap-x-2 gap-y-4 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7";
const categoryCarouselClass =
  "scrollbar-none grid grid-flow-col grid-rows-1 gap-x-2 overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x auto-cols-[calc((100%-0.5rem)/2)] min-[480px]:auto-cols-[calc((100%-1rem)/3)] md:auto-cols-[calc((100%-1.5rem)/4)] lg:auto-cols-[calc((100%-2rem)/5)] xl:auto-cols-[calc((100%-3rem)/7)]";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  fallbackImage?: string;
  routeGroup?: string;
  parentCategory?: string | null;
}

function CategoryCarouselRow({
  categories,
  row,
}: {
  categories: Category[];
  row: number;
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    dragging: boolean;
  } | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    const carousel = scrollRef.current;
    if (!carousel) return;

    function updateScrollControls() {
      const currentCarousel = scrollRef.current;
      if (!currentCarousel) return;
      setCanScrollLeft(currentCarousel.scrollLeft > 1);
      setCanScrollRight(
        currentCarousel.scrollLeft + currentCarousel.clientWidth <
          currentCarousel.scrollWidth - 1
      );
    }

    updateScrollControls();
    const resizeObserver = new ResizeObserver(updateScrollControls);
    resizeObserver.observe(carousel);
    window.addEventListener("resize", updateScrollControls);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [categories]);

  function scrollCategories(direction: -1 | 1) {
    const carousel = scrollRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (!drag.dragging && Math.abs(distance) < 6) return;

    if (!drag.dragging) {
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.dragging) {
      didDragRef.current = true;
      setIsDragging(false);
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function preventClickAfterDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (!didDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollCategories(-1)}
          aria-label={`Scroll category row ${row} left`}
          className="absolute left-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7ded2] bg-white/95 text-[var(--brand-primary)] shadow-sm transition-colors hover:bg-[var(--section-background)]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollCategories(1)}
          aria-label={`Scroll category row ${row} right`}
          className="absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7ded2] bg-white/95 text-[var(--brand-primary)] shadow-sm transition-colors hover:bg-[var(--section-background)]"
        >
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      )}
      <motion.div
        ref={scrollRef}
        role="region"
        aria-label={`Category row ${row}`}
        tabIndex={0}
        className={`${categoryCarouselClass} ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
        onScroll={() => {
          const carousel = scrollRef.current;
          if (!carousel) return;
          setCanScrollLeft(carousel.scrollLeft > 1);
          setCanScrollRight(
            carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1
          );
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onClickCapture={preventClickAfterDrag}
      >
        {categories.map((category, index) => (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="min-w-0 snap-start"
          >
            <CategoryTile category={category} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Categories request failed (${res.status}).`);
        setCategories(await readJsonResponse<Category[]>(res, []));
      } catch (error) {
        console.error("Categories fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  function toggleExpanded() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
  }

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-5">
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <h2 className="text-[17px] font-bold tracking-tight text-[var(--brand-primary)] sm:text-xl">
            Shop by Category
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            {!loading && (
              <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-controls="home-category-grid"
                className="inline-flex min-h-9 items-center gap-1 text-[10px] font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-secondary-foreground)] sm:text-xs"
              >
                {expanded ? "Show Less" : "View All"}
                {expanded ? (
                  <ArrowUp size={13} aria-hidden="true" />
                ) : (
                  <ArrowDown size={13} aria-hidden="true" />
                )}
              </button>
            )}
            <Link
              href="/categories"
              className="inline-flex min-h-9 items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)] sm:text-xs"
            >
              All categories
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {loading ? (
          <div className={`${categoryCarouselClass} pointer-events-none`}>
            {Array.from({ length: 14 }, (_, index) => (
              <div
                key={index}
                className="flex min-w-0 animate-pulse snap-start flex-col items-center"
              >
                <div className="aspect-square w-full rounded-xl bg-gray-100" />
                <div className="mt-3 h-4 w-4/5 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            id="home-category-grid"
            layout
            transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}
            className={expanded ? categoryGridClass : "flex flex-col gap-y-4"}
          >
            {expanded ? (
              categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="min-w-0"
                >
                  <CategoryTile category={category} />
                </motion.div>
              ))
            ) : (
              <>
                <CategoryCarouselRow
                  categories={categories.filter((_, index) => index % 2 === 0)}
                  row={1}
                />
                <CategoryCarouselRow
                  categories={categories.filter((_, index) => index % 2 === 1)}
                  row={2}
                />
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}