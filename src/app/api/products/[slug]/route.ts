import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveProductFilter, normalizeProductAliases } from "@/lib/products";
import { ProductInputError, saveProduct } from "@/lib/product-management";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import Product from "@/models/Product";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { slug } = await params;
    const identity = mongoose.Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }] }
      : { slug };
    const product = await Product.findOne(getActiveProductFilter(identity))
      .populate("category")
      .populate("collection")
      .populate("collections")
      .lean();

    if (!product) {
      return NextResponse.json({ product: null, related: [] }, { status: 404 });
    }

    const related = await Product.find(
      getActiveProductFilter({
        category:
          typeof product.category === "object" && product.category !== null
            ? product.category._id
            : product.category,
        _id: { $ne: product._id },
      })
    )
      .limit(4)
      .populate("category")
      .populate("collection")
      .populate("collections")
      .lean();

    return NextResponse.json(
      {
        product: normalizeProductAliases(product),
        related: related.map(normalizeProductAliases),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { message: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { slug } = await params;
    if (!mongoose.Types.ObjectId.isValid(slug)) {
      return NextResponse.json({ message: "Invalid product ID." }, { status: 400 });
    }

    await connectDB();
    const product = await saveProduct(await request.json(), slug);
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    revalidateStorefront();
    return NextResponse.json(product, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    const duplicateKey =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      {
        message: duplicateKey
          ? "A product with that slug or SKU already exists."
          : error instanceof Error
            ? error.message
            : "Failed to update product.",
      },
      {
        status:
          error instanceof ProductInputError
            ? error.status
            : error instanceof SyntaxError || error instanceof mongoose.Error.ValidationError
              ? 400
            : duplicateKey
              ? 409
              : 500,
      }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { slug } = await params;
    if (!mongoose.Types.ObjectId.isValid(slug)) {
      return NextResponse.json({ message: "Invalid product ID." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findByIdAndDelete(slug);
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    revalidateStorefront();
    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete product." },
      { status: 500 }
    );
  }
}
