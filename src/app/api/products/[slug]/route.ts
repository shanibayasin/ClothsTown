import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    const query = isObjectId
      ? { $or: [{ _id: slug }, { slug }] }
      : { slug };

    const product = await Product.findOne({
      ...query,
      status: true,
    })
      .populate("category")
      .populate("collection")
      .lean();

    if (!product) {
      return NextResponse.json(
        { product: null, related: [] },
        { status: 200 }
      );
    }

    const relatedQuery: Record<string, unknown> = {
      status: true,
      slug: { $ne: slug },
    };

    if (product.category) {
      relatedQuery.category = product.category;
    }

    const related = await Product.find(relatedQuery)
      .limit(4)
      .populate("category")
      .populate("collection")
      .lean();

    return NextResponse.json({
      product,
      related,
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return NextResponse.json(
      { product: null, related: [] },
      { status: 200 }
    );
  }
}