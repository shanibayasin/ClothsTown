import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import {
  createCustomerSessionToken,
  CUSTOMER_REMEMBERED_SESSION_MAX_AGE,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  isCustomerAuthConfigured,
} from "@/lib/customer-auth";
import Customer from "@/models/Customer";

const LoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must be 72 bytes or fewer.",
    }),
  rememberMe: z.boolean().optional().default(false),
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
    return NextResponse.json({ message: "Invalid login request." }, { status: 400 });
  }

  const input = LoginSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { message: input.error.issues[0]?.message ?? "Enter a valid email and password." },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const customer = await Customer.findOne({ email: input.data.email }).select(
      "+passwordHash"
    );
    if (
      !customer ||
      !(await bcrypt.compare(input.data.password, customer.passwordHash))
    ) {
      return NextResponse.json(
        { message: "The email address or password is incorrect." },
        { status: 401 }
      );
    }

    const maxAge = input.data.rememberMe
      ? CUSTOMER_REMEMBERED_SESSION_MAX_AGE
      : CUSTOMER_SESSION_MAX_AGE;
    const response = NextResponse.json({
      customer: { name: customer.name, email: customer.email },
    });
    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: createCustomerSessionToken(
        { id: String(customer._id), email: customer.email },
        maxAge
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return response;
  } catch (error) {
    console.error("Customer sign-in failed:", error);
    return NextResponse.json(
      { message: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
