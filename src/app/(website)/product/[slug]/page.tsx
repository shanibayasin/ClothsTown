"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Heart, ShoppingBag, Loader2, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";

type DatabaseRef = {
  _id: string;
  title?: string;
  name?: string;
  slug?: string;
};

type ProductType = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  description: string;
  images: string[];
  newArrival?: boolean;
  featured?: boolean;
  category?: DatabaseRef;
  collection?: DatabaseRef;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [routerReady, setRouterReady] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, wishlist } = useWishlist();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [activeImage, setActiveImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setRouterReady(true);
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window === "undefined") return;

    if (!routerReady) {
      window.location.assign(path);
      return;
    }

    router.push(path);
  };

  // Check if item exists in wishlist
  const isWishlisted = wishlist?.some((item: any) => item._id === product?._id);

  useEffect(() => {
    async function fetchProductDetails() {
      if (!slug) return;
      try {
        setLoading(true);
        // Client side fetch layer hitting the database endpoints
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) {
          setProduct(null);
          setRelatedProducts([]);
          setActiveImage("");
          return;
        }

        const data = await readJsonResponse<{ product: ProductType | null; related: ProductType[] }>(res, { product: null, related: [] });
        const fetchedProduct = data?.product || null;
        setProduct(fetchedProduct);
        setRelatedProducts(data?.related || []);
        if (fetchedProduct?.images && fetchedProduct.images.length > 0) {
          setActiveImage(fetchedProduct.images[0]);
        } else {
          setActiveImage("");
        }
      } catch (error) {
        console.error("Error loading product layout stack:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProductDetails();
  }, [slug]);

  const handleAddToCart = async (redirect: boolean = false) => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.discountPrice || product.price,
        image: product.images[0],
        quantity: 1
      });
      if (redirect) {
        navigateTo("/cart");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <section className="py-32 text-center max-w-xl mx-auto px-6">
        <h1 className="font-heading text-4xl text-[#2B1A22]">Product Not Found</h1>
        <p className="mt-4 text-gray-500">The product you are looking for might have been moved or removed.</p>
        <Link href="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary-dark transition shadow-md">
          Back to Shop <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      {/* Premium Breadcrumb */}
      <div className="mb-12 flex flex-wrap items-center gap-2 text-xs uppercase font-semibold tracking-widest text-gray-400">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        {product.collection && (
          <>
            <Link href={`/collections/${product.collection.slug}`} className="hover:text-primary transition-colors">
              {product.collection.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-primary line-clamp-1 max-w-50">{product.name}</span>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        {/* Left Aspect: Product Media Gallery Engine */}
        <div className="space-y-4 sticky top-28">
          <div className="relative overflow-hidden rounded-4xl bg-[#FCF8F6] border border-slate-100 shadow-sm aspect-3/4">
            <Image
              src={activeImage || "/images/placeholder-product.jpg"}
              alt={product.name}
              fill
              priority
              className="object-cover transition duration-500 hover:scale-105"
            />

            {product.newArrival && (
              <span className="absolute left-6 top-6 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
                New Arrival
              </span>
            )}

            {product.featured && (
              <span className="absolute right-6 top-6 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
                Featured
              </span>
            )}
          </div>

          {/* Dynamic Map Thumbnails Panel */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(image)}
                  className={`relative overflow-hidden rounded-2xl aspect-square border bg-white transition duration-300 ${
                    activeImage === image ? "border-primary ring-2 ring-primary/10 scale-[0.98]" : "border-slate-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Aspect: Product Information Configuration Details */}
        <div className="flex flex-col">
          {product.collection && (
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary bg-primary/5 w-fit px-4 py-1.5 rounded-full">
              {product.collection.title}
            </span>
          )}

          <h1 className="mt-5 font-heading text-4xl sm:text-5xl text-[#2B1A22] leading-tight tracking-tight">
            {product.name}
          </h1>

          {/* Luxury Pricing UI Block */}
          <div className="mt-6 flex items-center gap-4 border-b border-slate-100 pb-6 w-full">
            {product.discountPrice ? (
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">
                  Rs. {product.discountPrice.toLocaleString()}
                </span>
                <span className="text-xl text-gray-400 line-through font-medium">
                  Rs. {product.price.toLocaleString()}
                </span>
                <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-1 rounded-md">
                  SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary">
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Description Block */}
          <p className="mt-6 text-base leading-8 text-gray-600 font-normal">
            {product.description}
          </p>

          {/* Meta Badges Layer */}
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle size={14} /> In Stock
            </span>
            {product.category && (
              <span className="rounded-full bg-[#FCF8F6] px-4 py-1.5 text-xs font-semibold text-primary border border-[#f0dce5]">
                {product.category.name}
              </span>
            )}
          </div>

          {/* Core Checkout Actions Block */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={isAdding}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-white shadow-md transition duration-300 hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {isAdding ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
              Add to Cart
            </button>

            <button
              onClick={() => handleAddToCart(true)}
              className="flex-1 rounded-full border border-primary py-4 text-sm font-semibold text-primary bg-white transition duration-300 hover:bg-primary hover:text-white hover:scale-[1.01]"
            >
              Buy It Now
            </button>
          </div>

          {/* Wishlist CTA Sync Layer */}
          <button
            onClick={() =>
              addToWishlist({
                _id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.images[0] || "/images/placeholder-product.jpg",
                price: product.discountPrice || product.price,
              })
            }
            className={`mt-4 inline-flex items-center justify-center gap-2 rounded-full border py-4 text-sm font-semibold transition duration-300 ${
              isWishlisted 
                ? "bg-rose-50 text-rose-600 border-rose-200" 
                : "border-slate-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Heart size={18} className={isWishlisted ? "fill-rose-600 text-rose-600" : ""} />
            {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
          </button>

          {/* Spec Extra Details Panel */}
          <div className="mt-10 space-y-4 border-t border-slate-100 pt-8 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl">
              <span>SKU</span>
              <span className="text-gray-900 font-bold">{product.sku || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl">
              <span>Category</span>
              <span className="text-gray-900 font-bold">{product.category?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl">
              <span>Collection</span>
              <span className="text-gray-900 font-bold">{product.collection?.title || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Grid Block */}
      {relatedProducts.length > 0 && (
        <div className="mt-28 border-t border-slate-100 pt-20">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
              You May Also Like
            </span>
            <h2 className="mt-5 font-heading text-3xl sm:text-4xl text-[#2B1A22] tracking-tight">
              Related Products
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <div
                key={item._id}
                className="group overflow-hidden rounded-[30px] bg-white shadow-md border border-slate-50/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative h-95 w-full overflow-hidden bg-slate-50">
                  <Image
                    src={item.images?.[0] || "/images/placeholder-product.jpg"}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  {item.featured && (
                    <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                      Featured
                    </span>
                  )}
                </div>

                {/* Content Details Grid */}
                <div className="p-5 flex flex-col grow justify-between">
                  <div>
                    <h3 className="font-heading text-lg text-[#2B1A22] line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    
                    <div className="mt-3">
                      {item.discountPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-primary">
                            Rs. {item.discountPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-400 line-through font-medium">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-primary">
                          Rs. {item.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/product/${item.slug}`}
                    className="mt-5 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-white transition duration-300 hover:bg-primary-dark shadow-sm"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}