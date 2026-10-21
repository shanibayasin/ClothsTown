"use client";

import Image from "next/image";
import { useState } from "react";

interface CategoryImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  fallbackClassName?: string;
}

export default function CategoryImage({
  src,
  alt,
  sizes = "100vw",
  className = "object-cover",
  fallbackClassName = "text-xs text-[#71808a]",
}: CategoryImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`absolute inset-0 flex items-center justify-center bg-[#eceff1] px-3 text-center ${fallbackClassName}`}
      >
        {alt}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
