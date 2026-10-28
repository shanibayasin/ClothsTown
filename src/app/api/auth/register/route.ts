import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import {
  createCustomerSessionToken,
  CUSTOMER_REMEMBERED_SESSION_MAX_AGE,
  CUSTOMER_SESSION_COOKIE,
  isCustomerAuthConfigured,
} from "@/lib/customer-auth";
import Customer from "@/models/Customer";

const RegistrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must be 72 bytes or fewer.",
    }),
});

export async function POST(request: Request) {
  if (!isCustomerAuthConfigured()) {
    return NextResponse.json(
      { message: "Customer sign-in is not configured on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid registration request." }, { status: 400 });
  }

  const input = RegistrationSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { message: input.error.issues[0]?.message ?? "Enter valid account details." },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const passwordHash = await bcrypt.hash(input.data.password, 12);
    const customer = await Customer.create({
      name: input.data.name,
      email: input.data.email,
      passwordHash,
    });
    const response = NextResponse.json(
      { customer: { name: customer.name, email: customer.email } },
      { status: 201 }
    );
    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: createCustomerSessionToken(
        { id: String(customer._id), email: customer.email },
        CUSTOMER_REMEMBERED_SESSION_MAX_AGE
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_REMEMBERED_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    console.error("Customer registration failed:", error);
    return NextResponse.json(
      { message: "Unable to create your account right now. Please try again." },
      { status: 500 }
    );
  }
}
