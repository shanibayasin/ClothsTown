import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    const query = isObjectId
      ? { $or: [{ _id: slug }, { slug }] }
      : { slug };

    const product = await Product.findOne({
      ...query,
      status: true,
    })
      .populate("category")
      .populate("collection")
      .lean();

    if (!product) {
      return NextResponse.json(
        { product: null, related: [] },
        { status: 200 }
      );
    }

    const relatedQuery: Record<string, unknown> = {
      status: true,
      slug: { $ne: slug },
    };

    if (product.category) {
      relatedQuery.category = product.category;
    }

    const related = await Product.find(relatedQuery)
      .limit(4)
      .populate("category")
      .populate("collection")
      .lean();

    return NextResponse.json({
      product,
      related,
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return NextResponse.json(
      { product: null, related: [] },
      { status: 200 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { slug } = await params;
    if (!mongoose.Types.ObjectId.isValid(slug)) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = {
      name: body.name,
      slug: body.slug,
      shortDescription: body.shortDescription,
      description: body.description,
      season: body.season,
      fabric: body.fabric,
      price: body.price,
      discountPrice: body.discountPrice,
      stock: body.stock,
      sku: body.sku,
      category: body.category,
      collection: body.collection,
      images: body.images,
      sizes: body.sizes,
      colors: body.colors,
      featured: body.featured,
      newArrival: body.newArrival,
      status: body.status,
    };

    await connectDB();
    const updatedProduct = await Product.findByIdAndUpdate(slug, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { slug } = await params;
    const productId = typeof slug === "string" ? slug.trim() : "";

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    await connectDB();
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product deleted successfully.",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}