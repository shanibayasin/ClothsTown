import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";

// =========================================================
// 1. GET ALL COLLECTIONS
// =========================================================
export async function GET() {
  try {
    await connectDB();

    // Latest collections sab se pehle show karne ke liye sort lagaya hai
    const collections = await Collection.find().sort({
      createdAt: -1,
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("GET Collections Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// =========================================================
// 2. CREATE COLLECTION (With Slug Validation Protection)
// =========================================================
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validation Check: Kya yeh slug pehle se database me majood hai?
    const exists = await Collection.findOne({
      slug: body.slug,
    });

    if (exists) {
      return NextResponse.json(
        { message: "Collection slug already exists" },
        { status: 400 }
      );
    }

    // Explicit payload structure mapping for security purposes
    const collection = await Collection.create({
      title: body.title,
      slug: body.slug,
      subtitle: body.subtitle,
      description: body.description,
      buttonText: body.buttonText,
      buttonLink: body.buttonLink,
      image: body.image,
      status: body.status,
    });

    return NextResponse.json(collection, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Collection Error:", error);
    return NextResponse.json(
      { message: "Failed to create collection" },
      { status: 500 }
    );
  }
}