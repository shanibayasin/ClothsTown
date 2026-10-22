import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ message: "Bulk action data must be an object." }, { status: 400 });
    }

    const input = body as { ids?: unknown; action?: unknown; status?: unknown };
    if (
      !Array.isArray(input.ids) ||
      input.ids.length === 0 ||
      input.ids.length > 100 ||
      !input.ids.every((id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
    ) {
      return NextResponse.json(
        { message: "Select between 1 and 100 valid products." },
        { status: 400 }
      );
    }

    await connectDB();
    const ids = Array.from(new Set(input.ids as string[]));

    if (input.action === "delete") {
      const result = await Product.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    if (
      input.action === "status" &&
      (input.status === "active" || input.status === "draft" || input.status === "inactive")
    ) {
      const result = await Product.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            publicationStatus: input.status,
            status: input.status === "active",
          },
        }
      );
      return NextResponse.json({ updated: result.modifiedCount });
    }

    return NextResponse.json({ message: "Choose a valid bulk action." }, { status: 400 });
  } catch (error) {
    console.error("PRODUCT BULK ACTION ERROR:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Product bulk action failed." },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
