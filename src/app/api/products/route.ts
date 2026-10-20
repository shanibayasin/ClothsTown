import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import Product from "@/models/Product";

// ✅ Register models for populate()
import "@/models/Category";
import "@/models/Collection";

// ======================
// GET ALL PRODUCTS
// ======================

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find()
      .populate("category")
      .populate("collection")
      .sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ======================
// CREATE PRODUCT
// ======================

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const product = await Product.create({
      name: body.name,
      slug: body.slug,

      shortDescription: body.shortDescription,
      description: body.description,

      price: body.price,
      discountPrice: body.discountPrice,

      stock: body.stock,
      sku: body.sku,

      category: body.category,
      collection: body.collection,

      images: body.images,
      sizes: body.sizes,
      colors: body.colors,

      featured: body.featured,
      newArrival: body.newArrival,
      status: body.status,
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}