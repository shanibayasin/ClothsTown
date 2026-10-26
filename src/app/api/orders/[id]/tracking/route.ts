import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const TrackingVerificationSchema = z.object({
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s().-]{7,32}$/)
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }),
});

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }
  const verification = TrackingVerificationSchema.safeParse(body);
  if (!verification.success) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  try {
    await connectDB();

    const order = await Order.findOne({
      _id: id,
      email: verification.data.email.toLowerCase(),
      phone: normalizePhone(verification.data.phone),
    })
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
