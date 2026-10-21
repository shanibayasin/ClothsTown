import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { requireAdmin } from "@/lib/admin-auth";

// GET SINGLE
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  await connectDB();

  const { id } = await params;

  const banner = await Banner.findById(id);

  return NextResponse.json(banner);
}

// UPDATE
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  await connectDB();

  const { id } = await params;

  const body = await request.json();

  const banner = await Banner.findByIdAndUpdate(
    id,
    body,
    {
      new: true,
    }
  );

  return NextResponse.json(banner);
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  await connectDB();

  const { id } = await params;

  await Banner.findByIdAndDelete(id);

  return NextResponse.json({
    success: true,
  });
}