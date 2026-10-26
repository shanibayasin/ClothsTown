"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ProductImageProps = Omit<ImageProps, "src" | "onError" | "onLoad"> & {
  src?: string | null;
  onImageError?: () => void;
};

export default function ProductImage({
  src,
  alt,
  className,
  unoptimized,
  onImageError,
  ...imageProps
}: ProductImageProps) {
  const requestedSrc = src?.trim() || null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const imageFailed = requestedSrc === null || failedSrc === requestedSrc;
  const imageLoaded = loadedSrc === requestedSrc;

  return (
    <>
      {requestedSrc && !imageLoaded && !imageFailed && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse bg-neutral-200/60"
        />
      )}
      {imageFailed || !requestedSrc ? (
        <span aria-hidden="true" className="absolute inset-0 bg-neutral-100" />
      ) : (
        <Image
          {...imageProps}
          key={requestedSrc}
          src={requestedSrc}
          alt={alt}
          className={`${className ?? ""} ${imageLoaded ? "" : "opacity-0"}`.trim()}
          unoptimized={unoptimized ?? true}
          onLoad={() => setLoadedSrc(requestedSrc)}
          onError={() => {
            setFailedSrc(requestedSrc);
            onImageError?.();
          }}
        />
      )}
    </>
  );
}
