import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const order = await Order.create(body);

    return NextResponse.json(order, {
      status: 201,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed to place order" },
      { status: 500 }
    );
  }
}