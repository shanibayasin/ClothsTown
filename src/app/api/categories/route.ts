import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

const MAX_BANNER_IMAGE_LENGTH = 6_000_000;

function isSafeBannerLink(value: string) {
  const link = value.trim();
  return (
    !link ||
    (link.startsWith("/") && !link.startsWith("//")) ||
    link.startsWith("#") ||
    /^https?:\/\//i.test(link)
  );
}

// GET ALL CATEGORIES

export async function GET(request: Request) {
  const includeAll = new URL(request.url).searchParams.get("admin") === "true";
  if (includeAll) {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
  }

  try {
    await connectDB();

    const categories = await Category.find(
      includeAll ? {} : { status: true }
    ).sort({ sortOrder: 1, name: 1 });

    return NextResponse.json(categories, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// CREATE CATEGORY

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ message: "Category data must be an object." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ message: "Category name must be between 2 and 120 characters." }, { status: 400 });
    }
    const slug = (typeof input.slug === "string" && input.slug.trim()
      ? input.slug
      : name.replace(/['’]/g, ""))
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/^-|-$/g, "");
    if (!slug) {
      return NextResponse.json({ message: "Category name must produce a valid slug." }, { status: 400 });
    }
    let parentCategory: mongoose.Types.ObjectId | null = null;
    let parentDocument: { _id: mongoose.Types.ObjectId; parentCategory?: mongoose.Types.ObjectId | null; group?: string; routeGroup?: string; gender?: string; slug?: string; status?: boolean } | null = null;
    let parentRouteGroup: string | undefined;
    if (input.parentCategory !== undefined && input.parentCategory !== null && input.parentCategory !== "") {
      if (
        typeof input.parentCategory !== "string" ||
        !mongoose.Types.ObjectId.isValid(input.parentCategory)
      ) {
        return NextResponse.json({ message: "Select a valid parent category." }, { status: 400 });
      }
      parentDocument = await Category.findById(input.parentCategory)
        .select("_id parentCategory group routeGroup gender slug status")
        .lean();
      if (!parentDocument || parentDocument.parentCategory || parentDocument.status === false) {
        return NextResponse.json({ message: "Subcategories must be assigned directly to a top-level category." }, { status: 400 });
      }
      parentRouteGroup = parentDocument.routeGroup ?? {
        men: "men",
        women: "women",
        girls: "girls",
        boys: "boys",
        accessories: "accessories",
      }[parentDocument.slug ?? ""];
      if (!parentRouteGroup || !["men", "women", "girls", "boys", "accessories"].includes(parentRouteGroup)) {
        return NextResponse.json({ message: "Choose a supported storefront department." }, { status: 400 });
      }
      parentCategory = parentDocument._id;
    }
    const routeGroup = parentRouteGroup ?? input.routeGroup;
    if (
      typeof routeGroup !== "string" ||
      !["men", "women", "girls", "boys", "accessories"].includes(routeGroup)
    ) {
      return NextResponse.json(
        { message: "Choose a supported category department." },
        { status: 400 }
      );
    }
    if (
      parentRouteGroup &&
      typeof input.routeGroup === "string" &&
      input.routeGroup !== parentRouteGroup
    ) {
      return NextResponse.json(
        { message: "The category does not belong to the selected department." },
        { status: 400 }
      );
    }
    const group =
      routeGroup === "girls" || routeGroup === "boys"
        ? "Kids"
        : routeGroup === "accessories"
          ? "Accessories & Others"
          : routeGroup === "men"
            ? "Men"
            : "Women";
    const gender =
      routeGroup === "accessories" ? "unisex" : routeGroup;
    if (await Category.exists({ slug })) {
      return NextResponse.json({ message: "A category with this name or slug already exists." }, { status: 409 });
    }
    if (input.image !== undefined && typeof input.image !== "string") {
      return NextResponse.json({ message: "Category image must be a string." }, { status: 400 });
    }
    for (const field of [
      "bannerImage",
      "bannerTitle",
      "bannerDescription",
      "bannerButtonText",
      "bannerButtonLink",
    ] as const) {
      if (input[field] !== undefined && typeof input[field] !== "string") {
        return NextResponse.json({ message: `Category ${field} must be a string.` }, { status: 400 });
      }
    }
    if (
      (typeof input.bannerImage === "string" && input.bannerImage.length > MAX_BANNER_IMAGE_LENGTH) ||
      (typeof input.bannerTitle === "string" && input.bannerTitle.trim().length > 160) ||
      (typeof input.bannerDescription === "string" && input.bannerDescription.trim().length > 500) ||
      (typeof input.bannerButtonText === "string" && input.bannerButtonText.trim().length > 80) ||
      (typeof input.bannerButtonLink === "string" && input.bannerButtonLink.trim().length > 500)
    ) {
      return NextResponse.json({ message: "Category banner fields exceed the allowed length." }, { status: 400 });
    }
    if (
      typeof input.bannerButtonLink === "string" &&
      !isSafeBannerLink(input.bannerButtonLink)
    ) {
      return NextResponse.json({ message: "Category banner button link must be a relative URL or use HTTP(S)." }, { status: 400 });
    }
    if (
      input.bannerPosition !== undefined &&
      !["left", "center", "right"].includes(String(input.bannerPosition))
    ) {
      return NextResponse.json({ message: "Banner position must be left, center, or right." }, { status: 400 });
    }
    if (input.status !== undefined && typeof input.status !== "boolean") {
      return NextResponse.json({ message: "Category status must be a boolean." }, { status: 400 });
    }

    const category = await Category.create({
      name,
      slug,
      group: parentDocument?.group ?? group,
      routeGroup,
      gender: parentDocument?.gender ?? gender,
      sortOrder: (await Category.countDocuments({ parentCategory })) + 1,
      image: input.image ?? "",
      bannerImage: input.bannerImage ?? "",
      bannerTitle: input.bannerTitle ?? "",
      bannerDescription: input.bannerDescription ?? "",
      bannerButtonText: input.bannerButtonText ?? "",
      bannerButtonLink: input.bannerButtonLink ?? "",
      bannerPosition: input.bannerPosition ?? "left",
      status: input.status ?? true,
      parentCategory,
      sectionTiles: Array.isArray(input.sectionTiles) ? input.sectionTiles : [],
      menuGroups: Array.isArray(input.menuGroups) ? input.menuGroups : [],
    });

    revalidateStorefront();
    return NextResponse.json(category, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const duplicateKey =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;
    return NextResponse.json(
      {
        message: duplicateKey
          ? "A category with this name or slug already exists."
          : error instanceof Error
            ? error.message
            : "Failed to create category",
      },
      { status: duplicateKey ? 409 : 500 }
    );
  }
}
