import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/admin-auth";
import { getCategoryDefinition } from "@/lib/category-catalog";

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    return NextResponse.json(category);
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
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ message: "Category data must be an object." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;

    let name: string | undefined;
    let slug: string | undefined;
    if (input.name !== undefined) {
      if (typeof input.name !== "string" || !input.name.trim()) {
        return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      }
      const requestedSlug =
        typeof input.slug === "string" && input.slug.trim()
          ? input.slug.trim().toLowerCase()
          : input.name
              .trim()
              .toLowerCase()
              .replace(/['’]/g, "")
              .replace(/&/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
      const definition = getCategoryDefinition(requestedSlug);
      if (!definition) {
        return NextResponse.json(
          { message: "Categories must use one of the 20 predefined Clothestown entries." },
          { status: 400 }
        );
      }
      name = definition.name;
      slug = definition.slug;
    } else if (input.slug !== undefined) {
      if (typeof input.slug !== "string" || !input.slug.trim()) {
        return NextResponse.json({ message: "Category slug is required." }, { status: 400 });
      }
      const definition = getCategoryDefinition(input.slug.trim().toLowerCase());
      if (!definition) {
        return NextResponse.json(
          { message: "Categories must use one of the 20 predefined Clothestown entries." },
          { status: 400 }
        );
      }
      name = definition.name;
      slug = definition.slug;
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
    if (name !== undefined && slug !== undefined) {
      const definition = getCategoryDefinition(slug);
      if (!definition) {
        return NextResponse.json(
          { message: "Categories must use one of the 20 predefined Clothestown entries." },
          { status: 400 }
        );
      }
      update.name = definition.name;
      update.slug = definition.slug;
      update.group = definition.group;
      update.routeGroup = definition.routeGroup;
      update.gender = definition.gender;
      update.sortOrder = definition.sortOrder;
    }
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
    if (input.parentCategory !== undefined) {
      if (input.parentCategory === null || input.parentCategory === "") {
        update.parentCategory = null;
      } else if (
        typeof input.parentCategory !== "string" ||
        !mongoose.Types.ObjectId.isValid(input.parentCategory) ||
        input.parentCategory === id
      ) {
        return NextResponse.json({ message: "Select a valid parent category." }, { status: 400 });
      } else {
        const [parent, isParentOfOther, hasChildren] = await Promise.all([
          Category.findById(input.parentCategory).select("_id parentCategory"),
          Category.exists({ _id: input.parentCategory, parentCategory: id }),
          Category.exists({ parentCategory: id }),
        ]);
        if (!parent || parent.parentCategory || isParentOfOther || hasChildren) {
          return NextResponse.json({ message: "Subcategories must be assigned directly to a top-level category." }, { status: 400 });
        }
        update.parentCategory = parent._id;
      }
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

    return NextResponse.json(updatedCategory);
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

    const categoryReference = new RegExp(
      `^${escapeRegex(category.name)}$`,
      "i"
    );
    const slugReference = new RegExp(
      `^${escapeRegex(category.slug)}$`,
      "i"
    );
    const [hasProducts, hasChildren, hasNavigationReferences] = await Promise.all([
      Product.exists({ category: category._id }),
      Category.exists({ parentCategory: category._id }),
      Category.exists({
        _id: { $ne: category._id },
        $or: [
          { "sectionTiles.category": categoryReference },
          { "sectionTiles.category": slugReference },
          { "sectionTiles.category": id },
          { "menuGroups.categories.category": categoryReference },
          { "menuGroups.categories.category": slugReference },
          { "menuGroups.categories.category": id },
        ],
      }),
    ]);
    if (hasProducts || hasNavigationReferences || hasChildren) {
      return NextResponse.json(
        {
          message:
            "This category is used by products, child categories, or category navigation. Reassign those references before deleting it.",
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

    return NextResponse.json({ message: "Category deleted" });
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
