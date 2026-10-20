"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { readJsonResponse } from "@/lib/api";

interface Collection {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  status: boolean;
}

export default function CollectionBanner() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
  }, []);

  async function fetchCollection() {
    try {
      const res = await fetch("/api/collections", {
        cache: "no-store",
      });

      const data = await readJsonResponse<Collection[]>(res, []);

      const active = data.find(
        (item: Collection) => item.status === true
      );

      setCollection(active || null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;
  if (!collection) return null;

  return (
    <section className="relative w-full flex justify-center items-center bg-background py-16 lg:py-24 font-body overflow-hidden">
      {/* Brand Radial Background Ambiance */}
      <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-section opacity-70 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-border/20 opacity-50 blur-3xl pointer-events-none" />

      {/* Main Layout Container */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 box-border flex justify-center">
        
        {/* Changed layout orientation so everything lines up perfectly under each other or in a balanced row */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-5xl">
          
          {/* Left Content Column - FIXED: Added items-center and text-center */}
          <div className="w-full lg:w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 order-2 lg:order-1">
            <div className="flex flex-col items-center lg:items-start space-y-2">
              <p className="text-xs font-bold uppercase tracking-[5px] text-secondary">
                {collection.subtitle}
              </p>
              <div className="h-0.5 w-12 bg-primary/40 rounded-full" />
            </div>

            {/* FIXED HEADING: Centered cleanly */}
            <h2 className="font-heading text-4xl font-bold tracking-tight text-[#4b1532] sm:text-5xl leading-[1.2] w-full wrap-break-word">
              {collection.title}
            </h2>

            <p className="text-base leading-relaxed text-text max-w-xl mx-auto lg:mx-0">
              {collection.description}
            </p>

            {/* Centered CTA Button */}
            <div className="pt-2">
              <Link
                href={`/collections/${collection.slug}`}
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-xs font-semibold tracking-wider text-white shadow-lg transition-all duration-300 hover:bg-[#4b1532] hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>{collection.buttonText || "Explore Collection"}</span>
                <ArrowRight 
                  size={14} 
                  className="transition-transform duration-300 transform group-hover:translate-x-1.5" 
                  style={{ color: "#ffffff" }}
                />
              </Link>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="w-full lg:w-[50%] flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="group relative h-80 sm:h-112.5 lg:h-125 w-full max-w-112.5 overflow-hidden rounded-4xl border border-border/30 bg-section shadow-[0_20px_50px_rgba(111,29,70,0.06)]">
              
              <div className="absolute inset-4 z-10 rounded-3xl border border-white/20 pointer-events-none" />

              <Image
                src={collection.image}
                alt={collection.title}
                fill
                priority
                sizes="(max-w-1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-linear-to-t from-[#4b1532]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}