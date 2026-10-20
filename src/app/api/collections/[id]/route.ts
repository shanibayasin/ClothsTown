import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";

// =========================================================
// 1. GET SINGLE COLLECTION
// =========================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const collection = await Collection.findById(id);

    if (!collection) {
      return NextResponse.json(
        { message: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

// =========================================================
// 2. UPDATE COLLECTION (With Duplicate Slug Verification)
// =========================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Verification: Check if another document already claims this specific slug path
    const exists = await Collection.findOne({
      slug: body.slug,
      _id: { $ne: id }, // Exclude the current editing collection ID
    });

    if (exists) {
      return NextResponse.json(
        { message: "Collection slug already exists" },
        { status: 400 }
      );
    }

    // Perform database payload update
    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      {
        title: body.title,
        slug: body.slug,
        subtitle: body.subtitle,
        description: body.description,
        buttonText: body.buttonText,
        buttonLink: body.buttonLink,
        image: body.image,
        status: body.status,
      },
      { new: true } // Returns the fresh updated state record
    );

    if (!updatedCollection) {
      return NextResponse.json(
        { message: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { message: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// =========================================================
// 3. DELETE COLLECTION
// =========================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedCollection = await Collection.findByIdAndDelete(id);

    if (!deletedCollection) {
      return NextResponse.json(
        { message: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "Failed to delete collection" },
      { status: 500 }
    );
  }
}