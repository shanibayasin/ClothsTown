import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import Collection from "@/models/Collection";
import Product from "@/models/Product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid collection ID." }, { status: 400 });
    }

    const collectionExists = await Collection.exists({ _id: id });
    if (!collectionExists) {
      return NextResponse.json({ message: "Collection not found." }, { status: 404 });
    }

    const products = await Product.find({
      $or: [{ collections: id }, { collection: id }],
    }).select("_id");

    return NextResponse.json({
      productIds: products.map((product) => product._id.toString()),
    });
  } catch (error) {
    console.error("GET COLLECTION PRODUCTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load collection products." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid collection ID." }, { status: 400 });
    }

    const collectionExists = await Collection.exists({ _id: id });
    if (!collectionExists) {
      return NextResponse.json({ message: "Collection not found." }, { status: 404 });
    }

    const body = await request.json();
    if (
      !Array.isArray(body.productIds) ||
      body.productIds.some(
        (productId: unknown) =>
          typeof productId !== "string" ||
          !mongoose.Types.ObjectId.isValid(productId)
      )
    ) {
      return NextResponse.json(
        { message: "Provide a list of valid product IDs." },
        { status: 400 }
      );
    }

    const selectedIds = Array.from(new Set(body.productIds as string[]));
    const selectedProducts = await Product.find({
      _id: { $in: selectedIds },
    }).select("_id collections collection");
    if (selectedProducts.length !== selectedIds.length) {
      return NextResponse.json(
        { message: "One or more selected products no longer exist." },
        { status: 400 }
      );
    }

    const currentlyAssigned = await Product.find({
      $or: [{ collections: id }, { collection: id }],
    }).select("_id collections collection");
    const affectedIds = new Set([
      ...selectedProducts.map((product) => product._id.toString()),
      ...currentlyAssigned.map((product) => product._id.toString()),
    ]);
    const affectedProducts = await Product.find({
      _id: { $in: [...affectedIds] },
    }).select("_id collections collection");
    const selectedSet = new Set(selectedIds);

    const operations = affectedProducts.map((product) => {
      const memberships = new Set(
        [
          ...((product.collections ?? []).map(
            (value: mongoose.Types.ObjectId) => value.toString()
          )),
          ...(product.collection ? [product.collection.toString()] : []),
        ].filter((membershipId) => membershipId !== id)
      );

      if (selectedSet.has(product._id.toString())) {
        memberships.add(id);
      }

      const membershipIds = [...memberships];
      const previousPrimary = product.collection?.toString();
      const primaryCollectionId =
        previousPrimary && memberships.has(previousPrimary)
          ? previousPrimary
          : membershipIds[0];
      const update: Record<string, unknown> = {
        $set: {
          collections: membershipIds.map(
            (membershipId) => new mongoose.Types.ObjectId(membershipId)
          ),
        },
      };

      if (primaryCollectionId) {
        (update.$set as Record<string, unknown>).collection =
          new mongoose.Types.ObjectId(primaryCollectionId);
      } else {
        update.$unset = { collection: "" };
      }

      return { updateOne: { filter: { _id: product._id }, update } };
    });

    if (operations.length > 0) {
      await Product.bulkWrite(operations);
    }

    return NextResponse.json({ productIds: selectedIds });
  } catch (error) {
    console.error("UPDATE COLLECTION PRODUCTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update collection products." },
      { status: 500 }
    );
  }
}
