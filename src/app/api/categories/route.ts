import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

// GET ALL CATEGORIES

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().sort({ createdAt: -1 });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// CREATE CATEGORY

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    body.slug = body.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const category = await Category.create(body);

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
