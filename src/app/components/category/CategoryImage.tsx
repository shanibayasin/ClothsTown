"use client";

import Image from "next/image";
import { useState } from "react";

interface CategoryImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  fallbackClassName?: string;
}

export default function CategoryImage({
  src,
  fallbackSrc,
  alt,
  sizes = "100vw",
  className = "object-cover",
  fallbackClassName = "text-xs text-[#71808a]",
}: CategoryImageProps) {
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);
  const [fallbackImageFailed, setFallbackImageFailed] = useState(false);
  const usableFallback =
    fallbackSrc && fallbackSrc !== src && !fallbackImageFailed
      ? fallbackSrc
      : null;
  const imageSrc =
    src && !primaryImageFailed
      ? src
      : usableFallback;

  if (!imageSrc) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`absolute inset-0 flex items-center justify-center overflow-hidden bg-[#f3eee8] px-3 text-center ${fallbackClassName}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(111,29,70,0.08),_transparent_68%)]"
        />
        <span className="relative max-w-full font-medium uppercase tracking-[0.12em] text-[#765d68]">
          {alt}
        </span>
      </span>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => {
        if (imageSrc === fallbackSrc) {
          setFallbackImageFailed(true);
        } else {
          setPrimaryImageFailed(true);
        }
      }}
    />
  );
}
