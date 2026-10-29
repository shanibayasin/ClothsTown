import Link from "next/link";
import CategoryImage from "@/app/components/category/CategoryImage";
import { getCategoryHref } from "@/lib/category-catalog";

interface CategoryTileProps {
  category: {
    _id: string;
    name: string;
    slug: string;
    image?: string | null;
    fallbackImage?: string | null;
    routeGroup?: string;
    parentCategory?: unknown;
  };
  mobileImageLabel?: boolean;
}

export default function CategoryTile({ category, mobileImageLabel = false }: CategoryTileProps) {
  return (
    <Link
      href={getCategoryHref(category)}
      className="group flex min-w-0 flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-primary)]"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[#f3eee8]">
        <CategoryImage
          src={category.image}
          fallbackSrc={category.fallbackImage}
          alt={category.name}
          sizes="(max-width: 479px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 20vw, 14vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fallbackClassName="text-xs text-[var(--text-secondary)]"
        />
        {mobileImageLabel && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2.5 pt-8 text-[10px] font-extrabold uppercase leading-tight text-white sm:hidden">
            {category.name}
          </span>
        )}
      </span>
      <span className={`mt-2 line-clamp-2 px-1 text-[11px] font-extrabold uppercase leading-4 text-[#111] min-[480px]:text-xs sm:mt-2.5 sm:text-sm xl:text-base ${mobileImageLabel ? "hidden sm:block" : ""}`}>
        {category.name}
      </span>
    </Link>
  );
}
