"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductImage from "./ProductImage";

export interface StoreProductCardData {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  image?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  onSale?: boolean;
  stock?: number;
  featured?: boolean;
  newArrival?: boolean;
  isNewArrival?: boolean;
  category?: { name?: string; slug?: string } | string | null;
  sizes?: string[];
  colors?: string[];
  shortDescription?: string;
}

interface ProductCardProps {
  product: StoreProductCardData;
  layout?: "grid" | "list";
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onAddToCart?: () => void;
}

function colorHex(color: string) {
  const normalized = color.trim().toLowerCase();
  if (/^#(?:[0-9a-f]{3}){1,2}$/i.test(normalized)) return normalized;
  const colors: Record<string, string> = {
    beige: "#cdbb9d",
    black: "#202020",
    blue: "#527eaa",
    brown: "#805640",
    gray: "#92999d",
    green: "#526d57",
    navy: "#19364e",
    red: "#a13e42",
    white: "#f8f7f4",
  };
  return colors[normalized] ?? "#9aa3a9";
}

export default function ProductCard({
  product,
  layout = "grid",
  selectedColor,
  onSelectColor,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const discountPrice = product.discountPrice ?? 0;
  const hasDiscount = discountPrice > 0 && discountPrice < product.price;
  const onSale = hasDiscount;
  const currentPrice = hasDiscount ? discountPrice : product.price;
  const sourceImage = product.images?.find(Boolean) || product.image || "";
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = failedImage === sourceImage ? "" : sourceImage;
  const wished = isWishlisted ?? wishlist.isInWishlist(product._id);
  const outOfStock = typeof product.stock !== "number" || product.stock <= 0;
  const requiresVariant = Boolean(product.sizes?.length || product.colors?.length);
  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name ?? ""
      : "";

  function handleAddToCart() {
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    if (requiresVariant) {
      router.push(`/product/${product.slug}`);
      return;
    }

    addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image,
      price: currentPrice,
      quantity: 1,
    });
  }

  function handleToggleWishlist() {
    if (onToggleWishlist) {
      onToggleWishlist();
      return;
    }

    wishlist.toggleWishlist({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image,
      price: currentPrice,
      sizes: product.sizes ?? [],
      colors: product.colors ?? [],
    });
  }

  return (
    <article
      className={`group min-w-0 ${
        layout === "list"
          ? "grid grid-cols-[38%_1fr] gap-4 border-b border-[var(--border-color)] bg-white pb-4 sm:grid-cols-[220px_1fr] sm:gap-6"
          : "overflow-hidden rounded-md bg-white"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-[var(--section-background)]">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0"
        >
          <ProductImage
            src={image}
            alt={product.name}
            fill
            onImageError={() => setFailedImage(sourceImage)}
            sizes={
              layout === "list"
                ? "(max-width: 640px) 38vw, 220px"
                : "(max-width: 639px) 68vw, (max-width: 1023px) 32vw, 25vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />
        </Link>

        {(onSale || product.newArrival || product.isNewArrival || product.featured) && (
          <span className="absolute left-2 top-2 rounded-sm bg-[var(--brand-primary)] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
            {onSale ? "Sale" : product.newArrival || product.isNewArrival ? "New" : "Featured"}
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wished}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-[var(--brand-primary)] shadow-sm transition hover:scale-105"
        >
          <Heart
            size={16}
            aria-hidden="true"
            className={wished ? "fill-[var(--brand-primary)] text-[var(--brand-primary)]" : ""}
          />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          aria-label={outOfStock
            ? `${product.name} is out of stock`
            : requiresVariant
              ? `Choose size or color for ${product.name}`
              : `Add ${product.name} to cart`}
          className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-white text-[var(--brand-primary)] shadow-md transition hover:scale-105 hover:bg-[var(--brand-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag size={17} aria-hidden="true" />
        </button>
      </div>

      <div className={`min-w-0 pt-2 ${layout === "list" ? "pr-1" : ""}`}>
        <Link
          href={`/product/${product.slug}`}
          className="block truncate text-[11px] font-medium leading-4 text-[var(--text-primary)] hover:text-[var(--brand-primary)] sm:text-xs"
        >
          {product.name}
        </Link>
        {layout === "list" && categoryName && (
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {categoryName}
            {product.sizes?.length ? ` · ${product.sizes.join(", ")}` : ""}
          </p>
        )}
        {layout === "list" && product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
            {product.shortDescription}
          </p>
        )}
        {product.colors && product.colors.length > 0 && onSelectColor && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Select ${color}`}
                aria-pressed={selectedColor === color}
                onClick={() => onSelectColor(color)}
                className={`flex size-5 items-center justify-center rounded-full border ${
                  selectedColor === color
                    ? "border-[var(--brand-primary)]"
                    : "border-transparent"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: colorHex(color) }}
                />
              </button>
            ))}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[11px] font-semibold text-[var(--text-primary)] sm:text-xs">
            Rs. {currentPrice.toLocaleString()}
          </span>
          {onSale && (
            <span className="text-[10px] text-muted line-through">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
