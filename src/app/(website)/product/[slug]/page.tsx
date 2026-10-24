"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";
import { getCategoryDefinition } from "@/lib/category-catalog";

type DatabaseRef = {
  _id: string;
  title?: string;
  name?: string;
  slug?: string;
  routeGroup?: string;
};

type ProductType = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  onSale?: boolean;
  description?: string;
  shortDescription?: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  newArrival?: boolean;
  featured?: boolean;
  category?: DatabaseRef;
  collection?: DatabaseRef;
  collections?: DatabaseRef[];
};

type ProductTab = "description" | "specifications" | "reviews";

const colorSwatches: Record<string, string> = {
  black: "#171717",
  white: "#ffffff",
  brown: "#795548",
  beige: "#d6c3a5",
  navy: "#193655",
  blue: "#3478a5",
  red: "#dc2626",
  green: "#47745b",
  gray: "#9ca3af",
  grey: "#9ca3af",
};

function getImage(product: ProductType) {
  return product.images?.[0] || "/placeholder-product.svg";
}

function getPrice(product: ProductType) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { cart, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("description");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProductDetails() {
      if (!slug) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/products/${slug}`);
        const data = await readJsonResponse<{
          product: ProductType | null;
          related: ProductType[];
        }>(res, { product: null, related: [] });
        if (!active) return;

        const fetchedProduct = data.product;
        setProduct(fetchedProduct);
        setRelatedProducts(data.related || []);
        setActiveImage(fetchedProduct ? getImage(fetchedProduct) : "");
        setSelectedSize(fetchedProduct?.sizes?.[0] || "");
        setSelectedColor(fetchedProduct?.colors?.[0] || "");
        setQuantity(1);
        setActiveTab("description");
      } catch (error) {
        console.error("Failed to load product details:", error);
        if (active) {
          setProduct(null);
          setRelatedProducts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchProductDetails();

    return () => {
      active = false;
    };
  }, [slug]);

  const isWishlisted = product ? isInWishlist(product._id) : false;
  const currentPrice = product ? getPrice(product) : 0;
  const isOnSale = Boolean(product && currentPrice < product.price);
  const discountPercentage =
    product && isOnSale
      ? Math.round(((product.price - currentPrice) / product.price) * 100)
      : 0;
  const inStock = (product?.stock ?? 0) > 0;

  const handleAddToCart = (redirect = false) => {
    if (!product || !inStock || isAdding) return;

    if (product.sizes?.length && !product.sizes.includes(selectedSize)) {
      setCartError("Please select an available size.");
      return;
    }
    if (product.colors?.length && !product.colors.includes(selectedColor)) {
      setCartError("Please select an available color.");
      return;
    }
    const existingQuantity =
      cart.find(
        (item) =>
          item._id === product._id &&
          item.size === (selectedSize || undefined) &&
          item.color === (selectedColor || undefined)
      )?.quantity ?? 0;
    if (existingQuantity + quantity > (product.stock ?? 0)) {
      setCartError(`Only ${Math.max(0, (product.stock ?? 0) - existingQuantity)} more item(s) are available.`);
      return;
    }

    setCartError("");
    setIsAdding(true);
    try {
      addToCart({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        image: activeImage || getImage(product),
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        quantity,
      });
      if (redirect) router.push("/cart");
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#102f43]" size={36} />
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Loading product details
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="text-3xl font-bold text-[#173246]">Product Not Found</h1>
        <p className="mt-4 text-sm text-slate-500">
          This product may have been moved or removed.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#102f43] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c4d69]"
        >
          Back to Shop <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder-product.svg"];
  const categoryDefinition = getCategoryDefinition(product.category?.slug ?? "");

  return (
    <main className="min-h-screen bg-[#f8fafb] text-[#172b3a]">
      <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-[#102f43]">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          {categoryDefinition && (
            <>
              <Link
                href={`/shop/${categoryDefinition.routeGroup}/${categoryDefinition.slug}`}
                className="hover:text-[#102f43]"
              >
                {categoryDefinition.name}
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
            </>
          )}
          {(product.collections?.length
            ? product.collections
            : product.collection
              ? [product.collection]
              : []
          ).map((collection) => (
            <span key={collection._id} className="inline-flex items-center gap-2">
              <Link
                href={`/collections/${collection.slug}`}
                className="hover:text-[#102f43]"
              >
                {collection.title}
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
            </span>
          ))}
          <span className="truncate font-medium text-slate-700">{product.name}</span>
        </nav>

        <section className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="grid gap-3 sm:grid-cols-[58px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(image)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={activeImage === image}
                  className={`relative size-12 shrink-0 overflow-hidden rounded-md border bg-white sm:size-[58px] ${
                    activeImage === image
                      ? "border-[#2867b2] ring-1 ring-[#2867b2]/30"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    sizes="58px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative order-1 aspect-[1.05] overflow-hidden rounded-xl border border-slate-200 bg-white sm:order-2 sm:aspect-[1.08]">
              <Image
                src={activeImage || getImage(product)}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-3 sm:p-5"
              />
              {product.newArrival && (
                <span className="absolute left-3 top-3 rounded bg-emerald-600 px-2 py-1 text-[9px] font-bold uppercase text-white">
                  New
                </span>
              )}
              {isOnSale && (
                <span className="absolute right-3 top-3 rounded bg-red-600 px-2 py-1 text-[9px] font-bold uppercase text-white">
                  Sale
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  toggleWishlist({
                    _id: product._id,
                    name: product.name,
                    slug: product.slug,
                    image: activeImage || getImage(product),
                    price: currentPrice,
                  })
                }
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isWishlisted}
                className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:text-rose-600"
              >
                <Heart size={17} className={isWishlisted ? "fill-rose-500 text-rose-500" : ""} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {(product.collections?.length
                  ? product.collections
                  : product.collection
                    ? [product.collection]
                    : []
                ).map((collection) => (
                  <Link
                    key={collection._id}
                    href={`/collections/${collection.slug}`}
                    className="mr-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2867b2] hover:underline"
                  >
                    {collection.title}
                  </Link>
                ))}
                <h1 className="mt-1 text-2xl font-bold leading-tight text-[#173246] sm:text-[30px]">
                  {product.name}
                </h1>
              </div>
              {product.sku && (
                <span className="text-[10px] text-slate-400">SKU: {product.sku}</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-400" aria-label="Ratings are not available">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className="text-sm leading-none text-slate-300">★</span>
                ))}
              </div>
              <span className="text-[10px] text-slate-400">No reviews yet</span>
              <span className="text-slate-300">|</span>
              <span className={`text-[10px] font-medium ${inStock ? "text-emerald-700" : "text-red-600"}`}>
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-[#173246] sm:text-2xl">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {isOnSale && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  <span className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-600">
              {product.shortDescription || product.description || "Designed for everyday comfort and lasting style."}
            </p>

            {product.colors && product.colors.length > 0 && (
              <fieldset className="mt-4">
                <legend className="mb-2 text-[11px] font-semibold text-slate-700">
                  Color{selectedColor ? `: ${selectedColor}` : ""}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => {
                    const swatch = colorSwatches[color.toLowerCase()] || [
                      "#334155",
                      "#527a88",
                      "#c58a66",
                      "#66714b",
                    ][index % 4];

                    return (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`Select ${color}`}
                        aria-pressed={selectedColor === color}
                        className={`size-7 rounded-full border-2 ${
                          selectedColor === color
                            ? "border-[#102f43] ring-2 ring-[#102f43]/20 ring-offset-1"
                            : "border-white shadow-[0_0_0_1px_#cbd5e1]"
                        }`}
                        style={{ backgroundColor: swatch }}
                      />
                    );
                  })}
                </div>
              </fieldset>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <fieldset className="mt-4">
                <legend className="mb-2 text-[11px] font-semibold text-slate-700">
                  Size{selectedSize ? `: ${selectedSize}` : ""}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      className={`min-w-9 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                        selectedSize === size
                          ? "border-[#102f43] bg-[#102f43] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#102f43]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex h-9 items-center rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-full w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                >
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-xs font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(product.stock || 1, value + 1))
                  }
                  aria-label="Increase quantity"
                  disabled={!inStock || quantity >= (product.stock || 1)}
                  className="flex h-full w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Plus size={13} />
                </button>
              </div>

              {cartError && (
                <p role="alert" className="mt-3 text-xs font-medium text-red-600">
                  {cartError}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleAddToCart()}
                disabled={isAdding || !inStock}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#102f43] px-4 text-xs font-semibold text-white transition hover:bg-[#1c4d69] disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none sm:px-7"
              >
                {isAdding ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={isAdding || !inStock}
                className="min-h-10 flex-1 rounded-md border border-[#102f43] px-4 text-xs font-semibold text-[#102f43] transition hover:bg-[#102f43] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-7"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-4 text-[10px] sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <Truck size={17} className="shrink-0 text-[#284c63]" />
                <span><b className="block text-slate-700">Free Delivery</b><span className="text-slate-500">All over Pakistan</span></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="shrink-0 text-[#284c63]" />
                <span><b className="block text-slate-700">Cash on Delivery</b><span className="text-slate-500">Available</span></span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="shrink-0 text-[#284c63]" />
                <span><b className="block text-slate-700">Easy Returns</b><span className="text-slate-500">& Exchanges</span></span>
              </div>
              <div className="flex items-center gap-2">
                <UserRound size={16} className="shrink-0 text-[#284c63]" />
                <span><b className="block text-slate-700">Customer Support</b><span className="text-slate-500">Here to help</span></span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div role="tablist" aria-label="Product information" className="flex border-b border-slate-200">
              {([
                ["description", "Description"],
                ["specifications", "Specifications"],
                ["reviews", "Reviews (0)"],
              ] as const).map(([tab, label]) => (
                <button
                  type="button"
                  role="tab"
                  key={tab}
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-3 text-[11px] font-semibold transition sm:px-6 ${
                    activeTab === tab ? "text-[#102f43]" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                  {activeTab === tab && (
                    <span className="absolute inset-x-4 bottom-0 h-0.5 bg-[#102f43] sm:inset-x-6" />
                  )}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="min-h-36 p-4 text-xs leading-6 text-slate-600 sm:p-6">
              {activeTab === "description" && (
                <p className="whitespace-pre-line">
                  {product.description || product.shortDescription || "Product details will be available soon."}
                </p>
              )}
              {activeTab === "specifications" && (
                <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">Product</dt><dd className="text-right font-medium text-slate-700">{product.name}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">SKU</dt><dd className="text-right font-medium text-slate-700">{product.sku || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">Category</dt><dd className="text-right font-medium text-slate-700">{categoryDefinition?.name || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">Collections</dt><dd className="text-right font-medium text-slate-700">{product.collections?.map((collection) => collection.title).join(", ") || product.collection?.title || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">Available sizes</dt><dd className="text-right font-medium text-slate-700">{product.sizes?.join(", ") || "One size"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                    <dt className="text-slate-500">Available colors</dt><dd className="text-right font-medium text-slate-700">{product.colors?.join(", ") || "Standard"}</dd>
                  </div>
                </dl>
              )}
              {activeTab === "reviews" && (
                <div className="py-5 text-center">
                  <p className="font-semibold text-slate-700">No reviews yet</p>
                  <p className="mt-1 text-slate-500">Be the first to share your thoughts on this product.</p>
                </div>
              )}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <aside className="min-w-0 lg:col-span-2">
              <h2 className="mb-4 text-sm font-bold text-[#6f1d46]">You Might Also Like</h2>
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-none">
                {relatedProducts.map((item) => (
                  <div
                    key={item._id}
                    className="w-[68%] shrink-0 snap-start sm:w-[32%] lg:w-[23%] xl:w-[18.5%]"
                  >
                    <ProductCard
                      product={item as StoreProductCardData}
                    />
                  </div>
                ))}
              </div>
            </aside>
          )}
        </section>
      </div>
    </main>
  );
}
