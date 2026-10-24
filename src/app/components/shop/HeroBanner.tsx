"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export interface HeroBannerProps {
  name: string;
  image?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  position?: "left" | "center" | "right";
  imagePosition?: "left" | "center" | "right";
  headingLevel?: "h1" | "h2";
  fullBleed?: boolean;
  priority?: boolean;
  imageAlt?: string;
  className?: string;
}

export default function HeroBanner({
  name,
  image,
  title,
  subtitle,
  description,
  buttonText,
  buttonLink,
  position = "left",
  imagePosition = "center",
  headingLevel = "h1",
  fullBleed = true,
  priority = false,
  imageAlt,
  className,
}: HeroBannerProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image && !imageFailed);
  const Heading = headingLevel;
  const bannerTitle = title?.trim() || name;
  const bannerSubtitle = subtitle?.trim();
  const bannerDescription = description?.trim();
  const bannerButtonText = buttonText?.trim();
  const bannerButtonLink = buttonLink?.trim();
  const alignment = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[position];
  const overlay = {
    left: "bg-gradient-to-r from-[#fffaf6]/95 via-[#fffaf6]/75 to-transparent",
    center: "bg-[#fffaf6]/55",
    right: "bg-gradient-to-l from-[#fffaf6]/95 via-[#fffaf6]/75 to-transparent",
  }[position];
  const objectPosition = {
    left: "object-left",
    center: "object-center",
    right: "object-right",
  }[imagePosition];

  return (
    <header
      className={`relative isolate mb-7 aspect-[1.55/1] min-h-[220px] max-h-[500px] overflow-hidden bg-gradient-to-r from-[#f2e5e9] via-[#fbf7f3] to-[#efe5da] sm:aspect-[2.8/1] sm:min-h-[260px] lg:aspect-[4/1] lg:min-h-[320px] ${
        fullBleed ? "relative left-1/2 w-screen -translate-x-1/2" : "w-full"
      } ${className ?? ""}`}
    >
      {showImage && image && (
        <>
          <Image
            src={image}
            alt={imageAlt ?? ""}
            fill
            priority={priority}
            unoptimized
            sizes="100vw"
            className={`object-cover ${objectPosition}`}
            onError={() => setImageFailed(true)}
          />
          <div aria-hidden="true" className={`absolute inset-0 ${overlay}`} />
        </>
      )}
      <div
        className={`relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-6 py-7 sm:px-10 lg:px-16 ${alignment} ${
          showImage ? "text-[#321b27]" : "text-[#321b27]"
        }`}
      >
        {bannerSubtitle && (
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6f1d46] sm:text-xs sm:tracking-[0.24em]">
            {bannerSubtitle}
          </p>
        )}
        <Heading className="mt-2 max-w-[min(56vw,760px)] whitespace-pre-line text-[clamp(1.75rem,4.8vw,4.5rem)] font-semibold leading-[1.04] tracking-tight text-[#321b27]">
          {bannerTitle}
        </Heading>
        {bannerDescription && (
          <p className="mt-3 max-w-[min(48vw,620px)] whitespace-pre-line text-xs leading-relaxed text-[#594650] sm:text-sm lg:text-base">
            {bannerDescription}
          </p>
        )}
        {bannerButtonText && bannerButtonLink && (
          <Link
            href={bannerButtonLink}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#6f1d46] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#541536] sm:mt-6 sm:px-6 sm:text-sm"
          >
            {bannerButtonText}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
