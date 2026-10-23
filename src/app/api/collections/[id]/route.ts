import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/admin-auth";

// =========================================================
// 1. GET SINGLE COLLECTION
// =========================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

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
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Collection data must be an object." },
        { status: 400 }
      );
    }
    const requiredFields = ["title", "slug", "subtitle", "description"] as const;
    for (const field of requiredFields) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { message: `${field} is required.` },
          { status: 400 }
        );
      }
    }
    if (body.image !== undefined && typeof body.image !== "string") {
      return NextResponse.json(
        { message: "Image must be a string." },
        { status: 400 }
      );
    }

    // Verification: Check if another document already claims this specific slug path
    const exists = await Collection.findOne({
      slug: body.slug.trim(),
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
        title: body.title.trim(),
        slug: body.slug.trim(),
        subtitle: body.subtitle.trim(),
        description: body.description.trim(),
        buttonText: body.buttonText,
        buttonLink: body.buttonLink,
        ...(body.image !== undefined ? { image: body.image } : {}),
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
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await params;

    const collectionProducts = await Product.find({
      $or: [{ collections: id }, { collection: id }],
    }).select("_id collections collection");

    if (collectionProducts.length > 0) {
      await Product.bulkWrite(
        collectionProducts.map((product) => {
          const memberships = Array.from(
            new Set(
              [
                ...((product.collections ?? []).map(
                  (value: mongoose.Types.ObjectId) => value.toString()
                )),
                ...(product.collection ? [product.collection.toString()] : []),
              ].filter((collectionId) => collectionId !== id)
            )
          );
          const primaryCollectionId = memberships[0];
          const update: Record<string, unknown> = {
            $set: {
              collections: memberships.map(
                (collectionId) => new mongoose.Types.ObjectId(collectionId)
              ),
            },
          };

          if (primaryCollectionId) {
            (update.$set as Record<string, unknown>).collection =
              new mongoose.Types.ObjectId(primaryCollectionId);
          } else {
            update.$unset = { collection: "" };
          }

          return {
            updateOne: {
              filter: { _id: product._id },
              update,
            },
          };
        })
      );
    }

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