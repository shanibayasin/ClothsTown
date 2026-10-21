import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { requireAdmin } from "@/lib/admin-auth";

// GET ALL BANNERS
export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const banners = await Banner.find().sort({
      createdAt: -1,
    });

    return NextResponse.json(banners);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// CREATE BANNER
export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const body = await request.json();

    const banner = await Banner.create(body);

    return NextResponse.json(banner, {
      status: 201,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to create banner" },
      { status: 500 }
    );
  }
}