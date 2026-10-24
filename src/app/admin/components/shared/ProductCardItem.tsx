"use client";

import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  images: string[];
}

interface ProductCardItemProps {
  product: Product;
}

export default function ProductCardItem({ product }: ProductCardItemProps) {
  const imageUrl =
    product.images?.[0] && product.images[0].includes("res.cloudinary.com")
      ? product.images[0]
      : "/placeholder-product.svg";

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="relative h-56">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-800">{product.name}</h3>
        <p className="mt-2 text-sm text-gray-500">
          Rs. {product.discountPrice || product.price}
        </p>
      </div>
    </div>
  );
}
