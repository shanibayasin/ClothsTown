import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";

export async function GET() {
  try {
    await connectDB();

    const collections = await Collection.find({ status: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    return NextResponse.json(collections);
  } catch (error) {
    console.error("GET home collections error:", error);
    return NextResponse.json([], {
      status: 500,
    });
  }
}
