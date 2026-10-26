import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/admin-auth";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const OrderStatusSchema = z.object({
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]),
});

class OrderUpdateError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function GET(
  req: Request,
  { params }: Props
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: Props
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid order update." }, { status: 400 });
    }
    const input = OrderStatusSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json({ message: "Choose a valid order status." }, { status: 400 });
    }

    await connectDB();
    const session = await mongoose.startSession();
    let updatedOrder: Awaited<ReturnType<typeof Order.findById>> = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new OrderUpdateError("Order not found", 404);
        if (order.status === "Cancelled" && input.data.status !== "Cancelled") {
          throw new OrderUpdateError("Cancelled orders cannot be reopened.", 409);
        }

        if (
          order.status !== "Cancelled" &&
          input.data.status === "Cancelled" &&
          order.inventoryReserved
        ) {
          const quantities = new Map<string, number>();
          for (const item of order.products) {
            if (!mongoose.Types.ObjectId.isValid(item.productId ?? "")) continue;
            quantities.set(
              item.productId,
              (quantities.get(item.productId) ?? 0) + (item.quantity ?? 0)
            );
          }
          for (const [productId, quantity] of quantities) {
            if (quantity > 0) {
              await Product.updateOne(
                { _id: new mongoose.Types.ObjectId(productId) },
                { $inc: { stock: quantity } },
                { session }
              );
            }
          }
          order.inventoryReserved = false;
        }

        order.status = input.data.status;
        updatedOrder = await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    if (error instanceof OrderUpdateError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Failed to update order:", error);

    return NextResponse.json(
      { message: "Update failed" },
      { status: error instanceof mongoose.Error.ValidationError ? 400 : 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: Props
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    await connectDB();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new OrderUpdateError("Order not found", 404);

        if (order.status !== "Cancelled" && order.inventoryReserved) {
          const quantities = new Map<string, number>();
          for (const item of order.products) {
            if (!mongoose.Types.ObjectId.isValid(item.productId ?? "")) continue;
            quantities.set(
              item.productId,
              (quantities.get(item.productId) ?? 0) + (item.quantity ?? 0)
            );
          }
          for (const [productId, quantity] of quantities) {
            if (quantity > 0) {
              await Product.updateOne(
                { _id: new mongoose.Types.ObjectId(productId) },
                { $inc: { stock: quantity } },
                { session }
              );
            }
          }
        }

        await order.deleteOne({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      message: "Order deleted",
    });
  } catch (error) {
    if (error instanceof OrderUpdateError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Failed to delete order:", error);

    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}