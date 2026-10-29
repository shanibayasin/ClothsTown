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
    left: "bg-gradient-to-r from-[var(--page-background)]/95 via-[var(--page-background)]/75 to-transparent",
    center: "bg-[var(--page-background)]/55",
    right: "bg-gradient-to-l from-[var(--page-background)]/95 via-[var(--page-background)]/75 to-transparent",
  }[position];
  const mobileOverlay = {
    left: "bg-gradient-to-r from-[#0F2D39]/80 via-[#0F2D39]/55 to-[#0F2D39]/10",
    center: "bg-[#0F2D39]/55",
    right: "bg-gradient-to-l from-[#0F2D39]/80 via-[#0F2D39]/55 to-[#0F2D39]/10",
  }[position];
  const mobileTextColor = showImage ? "text-[#F8F5EF]" : "text-[var(--brand-primary)]";
  const objectPosition = {
    left: "object-left",
    center: "object-center",
    right: "object-right",
  }[imagePosition];

  return (
    <header
      className={`relative isolate mb-7 aspect-[1.2/1] min-h-[280px] max-h-[600px] overflow-hidden bg-gradient-to-r from-[var(--section-background)] via-[var(--page-background)] to-[var(--brand-secondary)] md:aspect-[2.4/1] lg:aspect-[3.2/1] ${
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
          <div
            aria-hidden="true"
            className={`absolute inset-0 md:hidden ${mobileOverlay}`}
          />
          <div aria-hidden="true" className={`absolute inset-0 hidden md:block ${overlay}`} />
        </>
      )}
      <div
        className={`relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-5 py-6 sm:px-10 sm:py-7 lg:px-16 ${alignment} ${mobileTextColor} md:text-[var(--brand-primary)]`}
      >
        {bannerSubtitle && (
          <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.24em] ${showImage ? "text-[#F8F5EF] md:text-[var(--brand-primary)]" : "text-[var(--brand-primary)]"}`}>
            {bannerSubtitle}
          </p>
        )}
        <Heading className={`mt-2 max-w-[min(72vw,760px)] whitespace-pre-line text-[clamp(1.6rem,7vw,2.5rem)] font-semibold leading-[1.04] tracking-tight sm:max-w-[min(56vw,760px)] sm:text-[clamp(1.75rem,4.8vw,4.5rem)] ${showImage ? "text-[#F8F5EF] md:text-[var(--brand-primary)]" : "text-[var(--brand-primary)]"}`}>
          {bannerTitle}
        </Heading>
        {bannerDescription && (
          <p className={`mt-2 max-w-[min(70vw,620px)] whitespace-pre-line text-[11px] leading-snug sm:mt-3 sm:max-w-[min(48vw,620px)] sm:text-sm sm:leading-relaxed lg:text-base ${showImage ? "text-[#F8F5EF]/95 md:text-[var(--text-secondary)]" : "text-[var(--text-secondary)]"}`}>
            {bannerDescription}
          </p>
        )}
        {bannerButtonText && bannerButtonLink && (
          <Link
            href={bannerButtonLink}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-sm bg-[var(--brand-primary)] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] sm:mt-6 sm:min-h-10 sm:px-6 sm:text-sm"
          >
            {bannerButtonText}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
