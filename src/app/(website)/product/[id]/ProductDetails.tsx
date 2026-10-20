"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import AddToCartButton from "@/components/product/AddToCartButton";

interface ProductDetailsProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    price: number;
    discountPrice?: number;
    [key: string]: any;
  };
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const isFavorite = isInWishlist(product._id);

  const handleWishlistToggle = () => {
    if (isFavorite) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] || "/images/placeholder-product.jpg",
        price: product.discountPrice && product.discountPrice > 0 
          ? product.discountPrice 
          : product.price,
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-3xl max-w-md border border-gray-100 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
      <p className="text-sm text-gray-500 mt-1">Slug: {product.slug}</p>
      
      {/* Dynamic Interface Checkout Panel Row */}
      <div className="mt-6 flex items-center gap-4 w-full">
        
        {/* Dynamic Cart Integration Engine Component */}
        <div className="flex-1">
          <AddToCartButton
            product={{
              _id: product._id.toString(),
              name: product.name,
              slug: product.slug,
              image: product.images?.[0] || "",
              price: product.discountPrice || product.price,
            }}
          />
        </div>

        {/* Toggle Wishlist Action Button */}
        <button
          type="button"
          title={isFavorite ? "Remove from Wishlist" : "Add to Wishlist"}
          onClick={handleWishlistToggle}
          className={`rounded-full border p-4 transition duration-300 flex items-center justify-center shrink-0 ${
            isFavorite
              ? "border-pink-300 bg-pink-50 text-pink-600 shadow-sm"
              : "border-gray-200 bg-white text-gray-400 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600"
          }`}
        >
          <Heart
            size={22}
            className={`transition-all duration-300 ${
              isFavorite ? "fill-pink-600 scale-110" : "scale-100"
            }`}
          />
        </button>

      </div>
    </div>
  );
}