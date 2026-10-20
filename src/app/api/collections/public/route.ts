import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";

export async function GET() {
  try {
    await connectDB();

    const collections = await Collection.find({ status: true })
      .select("title slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(collections);
  } catch (error) {
    console.error("GET PUBLIC COLLECTIONS ERROR:", error);
    return NextResponse.json([], { status: 200 });
  }
}