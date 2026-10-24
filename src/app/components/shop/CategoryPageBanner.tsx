"use client";

import Image from "next/image";
import { useState } from "react";

export default function CategoryPageBanner({
  name,
  image,
  title,
  description,
  position = "left",
}: {
  name: string;
  image?: string | null;
  title?: string | null;
  description?: string | null;
  position?: "left" | "center" | "right";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const contentAlignment = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[position];
  const textAlignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[position];
  const overlay = {
    left: "bg-gradient-to-r from-black/60 via-black/30 to-black/5",
    center: "bg-black/35",
    right: "bg-gradient-to-l from-black/60 via-black/30 to-black/5",
  }[position];
  const bannerTitle = title?.trim() || name;
  const bannerDescription = description?.trim();
  const showImage = Boolean(image && !imageFailed);

  return (
    <header className="relative isolate mb-6 flex aspect-[3.2/1] min-h-[170px] max-h-[460px] overflow-hidden rounded-xl bg-[#f3f4f5] px-5 py-6 sm:px-10 sm:py-10">
      {showImage && image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 1440px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
          <div aria-hidden="true" className={`absolute inset-0 ${overlay}`} />
        </>
      )}
      <div
        className={`relative z-10 flex w-full flex-col justify-center ${contentAlignment} ${
          showImage ? "text-white" : "text-[#102d40]"
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs ${
          showImage ? "text-white/80" : "text-[#536875]"
        }`}>
          ClothesTown collection
        </p>
        <h1 className={`mt-2 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl ${textAlignment}`}>
          {bannerTitle}
        </h1>
        {bannerDescription ? (
          <p className={`mt-2 max-w-2xl text-sm sm:text-base ${
            showImage ? "text-white/90" : "text-[#536875]"
          }`}>
            {bannerDescription}
          </p>
        ) : (
          <p className={`mt-2 text-sm ${showImage ? "text-white/90" : "text-[#536875]"}`}>
            Explore {name} products
          </p>
        )}
      </div>
    </header>
  );
}
