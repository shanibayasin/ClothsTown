"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { useWishlist, type WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/app/components/product/ProductCard";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  const moveToCart = (item: WishlistItem) => {
    if (item.sizes?.length || item.colors?.length) {
      router.push(`/product/${item.slug}`);
      return;
    }

    addToCart({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      size: "",
      color: "",
      quantity: 1,
    });

    removeFromWishlist(item._id);
  };

  if (wishlist.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--page-background)] flex items-center justify-center px-6">
        <div className="text-center">
          <Heart size={70} className="mx-auto text-[var(--brand-primary)]" />

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Your Wishlist is Empty
          </h1>

          <p className="mt-3 text-gray-500">
            Save your favorite styles here.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-xl bg-[var(--brand-primary)] px-8 py-4 font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--page-background)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>

          <p className="mt-2 text-gray-500">
            {wishlist.length} saved {wishlist.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              isWishlisted
              onToggleWishlist={() => removeFromWishlist(item._id)}
              onAddToCart={() => moveToCart(item)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}