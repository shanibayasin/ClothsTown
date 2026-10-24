import mongoose, { type QueryFilter } from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getActiveProductFilter,
  getCollectionProductFilter,
  getFeaturedProductFilter,
  getNewArrivalProductFilter,
  getOnSaleProductFilter,
  getProductStatusFilter,
  normalizeProductAliases,
  type ProductQuery,
  type ProductPublicationStatus,
} from "@/lib/products";
import { ProductInputError, saveProduct } from "@/lib/product-management";
import Category from "@/models/Category";
import Product from "@/models/Product";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isProductPublicationStatus(
  value: string
): value is ProductPublicationStatus {
  return value === "active" || value === "draft" || value === "inactive";
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

    const conditions: QueryFilter<ProductQuery>[] = [];
    const overviewConditions: QueryFilter<ProductQuery>[] = [];
    const categoryIds =
      url.searchParams.get("categoryId")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    const search = url.searchParams.get("search")?.trim();
    const collectionId = url.searchParams.get("collectionId");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const size = url.searchParams.get("size")?.trim();
    const color = url.searchParams.get("color")?.trim();
    const brand = url.searchParams.get("brand")?.trim();
    const fabric = url.searchParams.get("fabric")?.trim();
    const productType = url.searchParams.get("productType")?.trim();
    const gender = url.searchParams.get("gender")?.trim().toLowerCase();
    const newArrival = url.searchParams.get("newArrival");
    const featured = url.searchParams.get("featured");
    const sale = url.searchParams.get("sale");
    const available = url.searchParams.get("available");
    const requestedStatus = url.searchParams.get("status");

    if (categoryIds.length) {
      if (categoryIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return NextResponse.json({ message: "Invalid category filter." }, { status: 400 });
      }
      const categoryCondition = {
        category: {
          $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      };
      conditions.push(categoryCondition);
      overviewConditions.push(categoryCondition);
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search.slice(0, 100)), "i");
      const matchingCategories = await Category.find({
        status: true,
        $or: [{ name: regex }, { slug: regex }],
      })
        .select("_id")
        .lean();
      conditions.push({
        $or: [
          { name: regex },
          { sku: regex },
          { slug: regex },
          { shortDescription: regex },
          { description: regex },
          { brand: regex },
          { productType: regex },
          { fabric: regex },
          { season: regex },
          { category: { $in: matchingCategories.map((category) => category._id) } },
        ],
      });
    }
    if (collectionId) {
      if (!mongoose.Types.ObjectId.isValid(collectionId)) {
        return NextResponse.json({ message: "Invalid collection filter." }, { status: 400 });
      }
      const collectionObjectId = new mongoose.Types.ObjectId(collectionId);
      conditions.push(getCollectionProductFilter(collectionObjectId));
    }
    const minimum = minPrice === null || minPrice === "" ? undefined : Number(minPrice);
    const maximum = maxPrice === null || maxPrice === "" ? undefined : Number(maxPrice);
    if (minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0)) {
      return NextResponse.json({ message: "Minimum price must be a non-negative number." }, { status: 400 });
    }
    if (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) {
      return NextResponse.json({ message: "Maximum price must be a non-negative number." }, { status: 400 });
    }
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      return NextResponse.json(
        { message: "Minimum price cannot be greater than maximum price." },
        { status: 400 }
      );
    }
    if (minimum !== undefined || maximum !== undefined) {
      conditions.push({
        price: {
          ...(minimum !== undefined ? { $gte: minimum } : {}),
          ...(maximum !== undefined ? { $lte: maximum } : {}),
        },
      });
    }
    if (size) conditions.push({ sizes: size });
    if (color) conditions.push({ colors: color });
    if (brand) conditions.push({ brand });
    if (fabric) conditions.push({ fabric });
    if (productType) conditions.push({ productType });
    if (gender) {
      if (!["men", "women", "girls", "boys", "unisex"].includes(gender)) {
        return NextResponse.json({ message: "Invalid gender filter." }, { status: 400 });
      }
      conditions.push({ gender });
    }
    if (newArrival === "true") {
      const arrivalCondition = getNewArrivalProductFilter();
      conditions.push(arrivalCondition);
      overviewConditions.push(arrivalCondition);
    }
    if (featured === "true") {
      const featuredCondition = getFeaturedProductFilter();
      conditions.push(featuredCondition);
      overviewConditions.push(featuredCondition);
    }
    if (sale === "true") {
      conditions.push(getOnSaleProductFilter());
    }
    if (available === "true") conditions.push({ stock: { $gt: 0 } });

    const baseFilter = { $and: conditions };
    const overviewFilter = { $and: overviewConditions };
    const facetFilter = categoryIds.length
      ? { category: { $in: categoryIds } }
      : {};
    if (requestedStatus && !isProductPublicationStatus(requestedStatus)) {
      return NextResponse.json({ message: "Invalid product status filter." }, { status: 400 });
    }
    const statusFilter =
      requestedStatus && isProductPublicationStatus(requestedStatus)
        ? getProductStatusFilter(requestedStatus)
        : undefined;
    const filter: QueryFilter<ProductQuery> = isAdminRequest
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
      const total = await Product.countDocuments(filter);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const resultPage = Math.min(page, totalPages);
      const [
        products,
        activeCount,
        draftCount,
        inactiveCount,
        availableSizes,
        availableColors,
        availableBrands,
        availableFabrics,
        availableProductTypes,
      ] = await Promise.all([
        Product.find(filter)
          .populate("category")
          .populate("collection")
          .populate("collections")
          .sort({ [sortField]: sortDirection, _id: 1 })
          .skip((resultPage - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        Product.countDocuments({ $and: [overviewFilter, getProductStatusFilter("active")] }),
        Product.countDocuments({ $and: [overviewFilter, getProductStatusFilter("draft")] }),
        Product.countDocuments({ $and: [overviewFilter, getProductStatusFilter("inactive")] }),
        Product.distinct("sizes", facetFilter),
        Product.distinct("colors", facetFilter),
        Product.distinct("brand", facetFilter),
        Product.distinct("fabric", facetFilter),
        Product.distinct("productType", facetFilter),
      ]);

      return NextResponse.json(
        {
          products: products.map(normalizeProductAliases),
          total,
          page: resultPage,
          pageSize,
          totalPages,
          counts: { active: activeCount, draft: draftCount, inactive: inactiveCount },
          filters: {
            sizes: availableSizes.filter((value): value is string => typeof value === "string").sort(),
            colors: availableColors.filter((value): value is string => typeof value === "string").sort(),
            brands: availableBrands.filter((value): value is string => typeof value === "string" && value.length > 0).sort(),
            fabrics: availableFabrics.filter((value): value is string => typeof value === "string" && value.length > 0).sort(),
            productTypes: availableProductTypes.filter((value): value is string => typeof value === "string" && value.length > 0).sort(),
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100)
    );
    const offset = Math.max(
      0,
      Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0
    );
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
      .populate("category")
      .populate("collection")
      .populate("collections")
      .sort({ [sortField]: sortDirection, _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    ]);

    return NextResponse.json(products.map(normalizeProductAliases), {
      headers: {
        "Cache-Control": "no-store",
        "X-Total-Count": String(total),
      },
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
