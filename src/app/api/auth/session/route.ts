import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionToken,
  isCustomerAuthConfigured,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import Customer from "@/models/Customer";

export async function GET(request: Request) {
  if (!isCustomerAuthConfigured()) {
    return NextResponse.json(
      { message: "Customer sign-in is not configured on this server." },
      { status: 503 }
    );
  }

  const session = verifyCustomerSessionToken(getCustomerSessionToken(request));
  if (!session || !mongoose.isValidObjectId(session.id)) {
    return NextResponse.json({ message: "Sign in to view your account." }, { status: 401 });
  }

  try {
    await connectDB();
    const customer = await Customer.findById(session.id).select("name email").lean();
    if (!customer) {
      return NextResponse.json({ message: "Sign in to view your account." }, { status: 401 });
    }

    return NextResponse.json({
      customer: { name: customer.name, email: customer.email },
    });
  } catch (error) {
    console.error("Customer session lookup failed:", error);
    return NextResponse.json(
      { message: "Unable to load your account right now." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
