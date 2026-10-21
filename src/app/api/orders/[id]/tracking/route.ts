import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  try {
    await connectDB();

    const order = await Order.findById(id)
      .select("_id status createdAt products")
      .lean();

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to look up order tracking:", error);
    return NextResponse.json(
      { message: "Unable to look up this order right now" },
      { status: 500 }
    );
  }
}
