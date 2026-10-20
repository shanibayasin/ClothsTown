import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

// GET SINGLE CATEGORY

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// UPDATE CATEGORY

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (body.name) {
      body.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE CATEGORY

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
