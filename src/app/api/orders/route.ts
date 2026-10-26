import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getActiveProductFilter } from "@/lib/products";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/admin-auth";

const OrderInputSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s().-]{7,32}$/)
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().max(24).default(""),
  address: z.string().trim().min(5).max(500),
  paymentMethod: z.literal("Cash On Delivery").default("Cash On Delivery"),
  products: z
    .array(
      z.object({
        productId: z.string().refine(mongoose.Types.ObjectId.isValid),
        size: z.string().trim().max(80).optional(),
        color: z.string().trim().max(80).optional(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
});

class OrderInputError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid order request." }, { status: 400 });
    }

    const input = OrderInputSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { message: input.error.issues[0]?.message ?? "Invalid order details." },
        { status: 400 }
      );
    }

    await connectDB();
    const session = await mongoose.startSession();
    let orderId: mongoose.Types.ObjectId | undefined;

    try {
      await session.withTransaction(async () => {
        const productIds = Array.from(
          new Set(input.data.products.map((item) => item.productId))
        ).map((id) => new mongoose.Types.ObjectId(id));
        const products = await Product.find(
          getActiveProductFilter({ _id: { $in: productIds } })
        )
          .select("_id name images price discountPrice stock sizes colors")
          .session(session)
          .lean();
        const productsById = new Map(products.map((product) => [String(product._id), product]));
        const quantitiesByProduct = new Map<string, number>();
        let total = 0;

        const orderProducts = input.data.products.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) {
            throw new OrderInputError("One or more products are no longer available.", 409);
          }

          const size = item.size === "default" ? "" : item.size ?? "";
          const color = item.color === "default" ? "" : item.color ?? "";
          const sizes = product.sizes ?? [];
          const colors = product.colors ?? [];
          if (
            (sizes.length > 0 && !sizes.includes(size)) ||
            (!sizes.length && size) ||
            (colors.length > 0 && !colors.includes(color)) ||
            (!colors.length && color)
          ) {
            throw new OrderInputError("A selected product variant is no longer available.", 409);
          }

          const price =
            product.discountPrice > 0 && product.discountPrice < product.price
              ? product.discountPrice
              : product.price;
          if (!Number.isFinite(price) || price <= 0) {
            throw new OrderInputError("A product has an invalid price and cannot be ordered.", 409);
          }
          total += price * item.quantity;
          quantitiesByProduct.set(
            item.productId,
            (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
          );

          return {
            productId: String(product._id),
            name: product.name,
            image: product.images?.[0] ?? "",
            size,
            color,
            quantity: item.quantity,
            price,
          };
        });

        for (const [productId, quantity] of [...quantitiesByProduct].sort(([left], [right]) => left.localeCompare(right))) {
          const result = await Product.updateOne(
            getActiveProductFilter({
              _id: new mongoose.Types.ObjectId(productId),
              stock: { $gte: quantity },
            }),
            { $inc: { stock: -quantity } },
            { session }
          );
          if (result.matchedCount !== 1) {
            throw new OrderInputError("There is not enough stock to fulfill this order.", 409);
          }
        }

        const [order] = await Order.create(
          [
            {
              ...input.data,
              email: input.data.email.toLowerCase(),
              phone: input.data.phone.replace(/[^\d+]/g, ""),
              products: orderProducts,
              total,
              inventoryReserved: true,
            },
          ],
          { session }
        );
        orderId = order._id;
      });

      return NextResponse.json({ _id: orderId }, { status: 201 });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (error instanceof OrderInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Failed to place order:", error);
    return NextResponse.json(
      { message: "Failed to place order" },
      { status: error instanceof mongoose.Error.ValidationError ? 400 : 500 }
    );
  }
}