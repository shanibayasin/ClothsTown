"use client";

import { useCart } from "@/context/CartContext";

interface Props {
  product: {
    _id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
  };
}

export default function AddToCartButton({
  product,
}: Props) {
  const { addToCart } = useCart();

  return (
    <button
      onClick={() =>
        addToCart({
          ...product,
          quantity: 1,
        })
      }
      className="flex-1 rounded-full bg-primary py-4 font-semibold text-white transition hover:bg-primary-dark"
    >
      Add to Cart
    </button>
  );
}