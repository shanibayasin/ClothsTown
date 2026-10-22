import mongoose, { type QueryFilter } from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getActiveProductFilter,
  getProductStatusFilter,
  type ProductPublicationStatus,
} from "@/lib/products";
import { ProductInputError, saveProduct } from "@/lib/product-management";
import Product from "@/models/Product";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isAdminRequest = url.searchParams.get("admin") === "true";
  if (isAdminRequest) {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
  }

  try {
    await connectDB();

    const conditions: QueryFilter<typeof Product>[] = [];
    const categoryIds =
      url.searchParams.get("categoryId")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    const search = url.searchParams.get("search")?.trim();
    const newArrival = url.searchParams.get("newArrival");
    const featured = url.searchParams.get("featured");
    const requestedStatus = url.searchParams.get("status");

    if (categoryIds.length) {
      if (categoryIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return NextResponse.json({ message: "Invalid category filter." }, { status: 400 });
      }
      conditions.push({ category: { $in: categoryIds } });
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search.slice(0, 100)), "i");
      conditions.push({ $or: [{ name: regex }, { sku: regex }, { slug: regex }] });
    }
    if (newArrival === "true") {
      conditions.push({ $or: [{ newArrival: true }, { isNewArrival: true }] });
    }
    if (featured === "true") {
      conditions.push({ $or: [{ featured: true }, { isFeatured: true }] });
    }

    const baseFilter = { $and: conditions };
    const statusFilter =
      requestedStatus === "active" ||
      requestedStatus === "draft" ||
      requestedStatus === "inactive"
        ? getProductStatusFilter(requestedStatus as ProductPublicationStatus)
        : undefined;
    const filter: QueryFilter<typeof Product> = isAdminRequest
      ? { $and: [baseFilter, ...(statusFilter ? [statusFilter] : [])] }
      : getActiveProductFilter(baseFilter);

    const sortKey = url.searchParams.get("sort") ?? "createdAt";
    const sortField = ["name", "price", "stock", "createdAt", "sku"].includes(sortKey)
      ? sortKey
      : "createdAt";
    const sortDirection = url.searchParams.get("direction") === "asc" ? 1 : -1;

    if (isAdminRequest) {
      const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
      const pageSize = Math.min(
        100,
        Math.max(10, Number.parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20)
      );
      const [products, total, activeCount, draftCount, inactiveCount] = await Promise.all([
        Product.find(filter)
          .populate("category")
          .populate("collection")
          .populate("collections")
          .sort({ [sortField]: sortDirection, _id: 1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        Product.countDocuments(filter),
        Product.countDocuments({ $and: [baseFilter, getProductStatusFilter("active")] }),
        Product.countDocuments({ $and: [baseFilter, getProductStatusFilter("draft")] }),
        Product.countDocuments({ $and: [baseFilter, getProductStatusFilter("inactive")] }),
      ]);

      return NextResponse.json(
        {
          products,
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          counts: { active: activeCount, draft: draftCount, inactive: inactiveCount },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100)
    );
    const products = await Product.find(filter)
      .populate("category")
      .populate("collection")
      .populate("collections")
      .sort({ [sortField]: sortDirection, _id: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch products." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const product = await saveProduct(await request.json());
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    const duplicateKey =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      {
        message: duplicateKey
          ? "A product with that slug or SKU already exists."
          : error instanceof Error
            ? error.message
            : "Failed to create product.",
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
