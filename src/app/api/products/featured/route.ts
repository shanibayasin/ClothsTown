import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  getActiveProductFilter,
  getFeaturedProductFilter,
  normalizeProductAliases,
} from "@/lib/products";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find(
      getActiveProductFilter(getFeaturedProductFilter())
    )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json(products.map(normalizeProductAliases));
  } catch (error) {
    console.error(error);

    return NextResponse.json([], {
      status: 500,
    });
  }
}