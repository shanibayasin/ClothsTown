import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
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

// GET SINGLE CATEGORY

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// UPDATE CATEGORY

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid category ID." }, { status: 400 });
    }
    const existingCategory = await Category.findById(id).select(
      "name slug group routeGroup gender parentCategory"
    );
    if (!existingCategory) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ message: "Category data must be an object." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;

    let name: string | undefined;
    let slug: string | undefined;
    if (input.name !== undefined) {
      if (
        typeof input.name !== "string" ||
        input.name.trim().length < 2 ||
        input.name.trim().length > 120
      ) {
        return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      }
      name = input.name.trim();
      slug =
        typeof input.slug === "string" && input.slug.trim()
          ? input.slug.trim().toLowerCase()
          : name
              .toLowerCase()
              .replace(/['’]/g, "")
              .replace(/&/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
    } else if (input.slug !== undefined) {
      if (typeof input.slug !== "string" || !input.slug.trim()) {
        return NextResponse.json({ message: "Category slug is required." }, { status: 400 });
      }
      slug = input.slug.trim().toLowerCase();
    }

    if (slug !== undefined && !slug) {
      return NextResponse.json({ message: "Category name must produce a valid slug." }, { status: 400 });
    }
    if (slug && await Category.exists({ slug, _id: { $ne: id } })) {
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

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (slug !== undefined) update.slug = slug;
    if (input.image !== undefined) update.image = input.image;
    if (input.bannerImage !== undefined) update.bannerImage = input.bannerImage;
    if (input.bannerTitle !== undefined) update.bannerTitle = input.bannerTitle;
    if (input.bannerDescription !== undefined) update.bannerDescription = input.bannerDescription;
    if (input.bannerButtonText !== undefined) update.bannerButtonText = input.bannerButtonText;
    if (input.bannerButtonLink !== undefined) update.bannerButtonLink = input.bannerButtonLink;
    if (input.bannerPosition !== undefined) update.bannerPosition = input.bannerPosition;
    if (input.status !== undefined) update.status = input.status;
    if (Array.isArray(input.sectionTiles)) update.sectionTiles = input.sectionTiles;
    if (Array.isArray(input.menuGroups)) update.menuGroups = input.menuGroups;
    let parentCategory = existingCategory.parentCategory as
      | mongoose.Types.ObjectId
      | null;
    let parentDocument:
      | { _id: mongoose.Types.ObjectId; routeGroup?: string; group?: string; gender?: string }
      | null = null;
    if (input.parentCategory !== undefined) {
      if (input.parentCategory === null || input.parentCategory === "") {
        update.parentCategory = null;
        parentCategory = null;
      } else if (
        typeof input.parentCategory !== "string" ||
        !mongoose.Types.ObjectId.isValid(input.parentCategory) ||
        input.parentCategory === id
      ) {
        return NextResponse.json({ message: "Select a valid parent category." }, { status: 400 });
      } else {
        const [parent, isParentOfOther, hasChildren] = await Promise.all([
          Category.findById(input.parentCategory).select(
            "_id parentCategory routeGroup group gender"
          ),
          Category.exists({ _id: input.parentCategory, parentCategory: id }),
          Category.exists({ parentCategory: id }),
        ]);
        if (!parent || parent.parentCategory || isParentOfOther || hasChildren) {
          return NextResponse.json({ message: "Subcategories must be assigned directly to a top-level category." }, { status: 400 });
        }
        update.parentCategory = parent._id;
        parentCategory = parent._id;
        parentDocument = parent;
      }
    }
    const routeGroup = parentDocument?.routeGroup ??
      (typeof input.routeGroup === "string"
        ? input.routeGroup
        : existingCategory.routeGroup ?? "accessories");
    if (!["men", "women", "girls", "boys", "accessories"].includes(routeGroup)) {
      return NextResponse.json(
        { message: "Choose a supported category department." },
        { status: 400 }
      );
    }
    if (
      parentDocument &&
      typeof input.routeGroup === "string" &&
      input.routeGroup !== parentDocument.routeGroup
    ) {
      return NextResponse.json(
        { message: "A subcategory must use its parent department." },
        { status: 400 }
      );
    }
    update.routeGroup = routeGroup;
    update.group = parentDocument?.group ?? (
      routeGroup === "girls" || routeGroup === "boys"
        ? "Kids"
        : routeGroup === "accessories"
          ? "Accessories & Others"
          : routeGroup === "men"
            ? "Men"
            : "Women"
    );
    update.gender = parentDocument?.gender ?? (
      routeGroup === "accessories" ? "unisex" : routeGroup
    );
    if (input.parentCategory !== undefined && parentCategory === null) {
      update.parentCategory = null;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    revalidateStorefront();
    return NextResponse.json(updatedCategory, {
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
            : "Failed to update category",
      },
      { status: duplicateKey ? 409 : 500 }
    );
  }
}

// DELETE CATEGORY

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid category ID." },
        { status: 400 }
      );
    }

    const category = await Category.findById(id).select("_id name slug");
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    const childCategoryCount = await Category.countDocuments({
      parentCategory: category._id,
    });
    if (childCategoryCount > 0) {
      return NextResponse.json(
        {
          message:
            `Cannot delete “${category.name}” while ${childCategoryCount} subcategor${childCategoryCount === 1 ? "y is" : "ies are"} assigned to it. Reassign or delete those subcategories first.`,
        },
        { status: 409 }
      );
    }

    const attachedProductCount = await Product.countDocuments({
      category: category._id,
    });
    if (attachedProductCount > 0) {
      return NextResponse.json(
        {
          message:
            `Cannot delete “${category.name}” while ${attachedProductCount} product${attachedProductCount === 1 ? " is" : "s are"} still assigned to it. Reassign those products first; no products were changed.`,
        },
        { status: 409 }
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    revalidateStorefront();
    return NextResponse.json(
      { message: "Category deleted" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
