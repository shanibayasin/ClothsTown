"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = (item: any) => {
    addToCart({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      size: item.size || "",
      color: item.color || "",
      quantity: 1,
    });

    removeFromWishlist(item._id);
  };

  if (wishlist.length === 0) {
    return (
      <main className="min-h-screen bg-[#fdf8fa] flex items-center justify-center px-6">
        <div className="text-center">
          <Heart size={70} className="mx-auto text-[#6f1d46]" />

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Your Wishlist is Empty
          </h1>

          <p className="mt-3 text-gray-500">
            Save your favorite abayas here.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-xl bg-[#6f1d46] px-8 py-4 text-white font-semibold hover:bg-[#5a1738] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8fa] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>

          <p className="mt-2 text-gray-500">
            {wishlist.length} saved {wishlist.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Dynamic Product Grid Display */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((item: any) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
            >
              {/* Product Image Wrapper */}
              <div>
                <Link href={`/product/${item.slug}`}>
                  <div className="relative h-[360px] w-full bg-gray-100 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 hover:scale-105"
                      priority
                    />
                  </div>
                </Link>

                {/* Card Context Descriptions */}
                <div className="p-5">
                  <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
                    {item.name}
                  </h3>

                  <p className="mt-3 text-xl font-bold text-[#6f1d46]">
                    Rs. {item.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Functional Interaction Buttons */}
              <div className="p-5 pt-0">
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => moveToCart(item)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6f1d46] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5a1738]"
                  >
                    <ShoppingBag size={18} />
                    Add to Cart
                  </button>

                  <button
                    onClick={() => removeFromWishlist(item._id)}
                    aria-label="Remove item from wishlist"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}