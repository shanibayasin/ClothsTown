import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";

export async function GET() {
  try {
    await connectDB();

    const banners = await Banner.find({
      status: true,
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json(banners);
  } catch {
    return NextResponse.json([], {
      status: 500,
    });
  }
}