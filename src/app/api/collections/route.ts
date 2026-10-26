import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import { requireAdmin } from "@/lib/admin-auth";

// =========================================================
// 1. GET ALL COLLECTIONS
// =========================================================
export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("admin") === "true";
  if (includeInactive) {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
  }

  try {
    await connectDB();

    const collections = await Collection.find(includeInactive ? {} : { status: true }).sort({
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
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Collection data must be an object." },
        { status: 400 }
      );
    }
    const data = body as Record<string, unknown>;
    const requiredFields = ["title", "slug", "subtitle", "description"] as const;
    for (const field of requiredFields) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        return NextResponse.json(
          { message: `${field} is required.` },
          { status: 400 }
        );
      }
    }
    if (data.image !== undefined && typeof data.image !== "string") {
      return NextResponse.json(
        { message: "Image must be a string." },
        { status: 400 }
      );
    }

    // Validation Check: Kya yeh slug pehle se database me majood hai?
    const exists = await Collection.findOne({
      slug: (data.slug as string).trim(),
    });

    if (exists) {
      return NextResponse.json(
        { message: "Collection slug already exists" },
        { status: 400 }
      );
    }

    // Explicit payload structure mapping for security purposes
    const collection = await Collection.create({
      title: (data.title as string).trim(),
      slug: (data.slug as string).trim(),
      subtitle: (data.subtitle as string).trim(),
      description: (data.description as string).trim(),
      buttonText: data.buttonText,
      buttonLink: data.buttonLink,
      image: data.image ?? "",
      status: data.status,
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