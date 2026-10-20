"use client";

import { useEffect, useState } from "react";
import ProductCardItem from "./ProductCardItem";

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  images: string[];
}

export default function FeaturedProductsList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      const productsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : [];

      const featured = productsData.filter(
        (item: any) => item.featured && item.status
      );

      setProducts(featured);
    } catch (error) {
      console.error("Failed to load featured products:", error);
      setProducts([]);
    }
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-[#6f1d46]">
            Featured Products
          </h2>
          <p className="mt-3 text-gray-500">
            Handpicked styles for every occasion.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCardItem key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
