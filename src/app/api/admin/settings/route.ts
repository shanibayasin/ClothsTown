import { NextResponse } from "next/server";
import { isAdminAuthConfigured, requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  let database = "unavailable";
  try {
    await connectDB();
    database = "connected";
  } catch {
    database = process.env.MONGODB_URI || process.env.MONGO_URI
      ? "unavailable"
      : "not configured";
  }

  return NextResponse.json({
    database,
    adminAuthentication: isAdminAuthConfigured() ? "configured" : "not configured",
    imageHosting:
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? "configured"
        : "not configured",
  });
}