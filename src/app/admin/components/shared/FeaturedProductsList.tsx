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

function isFeaturedProduct(value: unknown): value is Product & { featured: true; status: true } {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Partial<Product> & { featured?: unknown; status?: unknown };
  return (
    typeof product._id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    typeof product.discountPrice === "number" &&
    Array.isArray(product.images) &&
    product.featured === true &&
    product.status === true
  );
}

export default function FeaturedProductsList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data: unknown = await response.json();
        const productsData = Array.isArray(data)
          ? data
          : typeof data === "object" && data !== null && "products" in data && Array.isArray(data.products)
            ? data.products
            : [];

        if (active) setProducts(productsData.filter(isFeaturedProduct));
      } catch (error) {
        console.error("Failed to load featured products:", error);
        if (active) setProducts([]);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-[var(--brand-primary)]">
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
