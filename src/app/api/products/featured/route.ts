import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      featured: true,
      status: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json([], {
      status: 500,
    });
  }
}