import Image from "next/image";

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

  return (
    <header className="relative isolate mb-6 flex aspect-[3.2/1] min-h-[170px] max-h-[460px] overflow-hidden rounded-xl bg-[#f3eee8] px-5 py-6 sm:px-10 sm:py-10">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 1440px"
            className="object-cover"
          />
          <div aria-hidden="true" className={`absolute inset-0 ${overlay}`} />
        </>
      )}
      <div
        className={`relative z-10 flex w-full flex-col justify-center ${contentAlignment} ${
          image ? "text-white" : "text-[#173246]"
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs ${
          image ? "text-white/80" : "text-[#7b654b]"
        }`}>
          ClothesTown collection
        </p>
        <h1 className={`mt-2 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl ${textAlignment}`}>
          {bannerTitle}
        </h1>
        {bannerDescription ? (
          <p className={`mt-2 max-w-2xl text-sm sm:text-base ${
            image ? "text-white/90" : "text-slate-600"
          }`}>
            {bannerDescription}
          </p>
        ) : (
          <p className={`mt-2 text-sm ${image ? "text-white/90" : "text-slate-600"}`}>
            Explore {name} products
          </p>
        )}
      </div>
    </header>
  );
}
