import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetails({
  params,
}: Props) {
  await connectDB();

  const { id } = await params;

  const order: any = await Order.findById(id).lean();

  if (!order) {
    return (
      <div className="p-10 text-center text-2xl font-bold">
        Order Not Found
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl p-8">

      <div className="mb-10 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            Order Details
          </h1>

          <p className="mt-2 text-gray-500">
            Order ID : {order._id.toString()}
          </p>

        </div>

        <span
          className={`rounded-full px-5 py-2 text-sm font-semibold
          ${
            order.status === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : order.status === "Processing"
              ? "bg-blue-100 text-blue-700"
              : order.status === "Shipped"
              ? "bg-purple-100 text-purple-700"
              : order.status === "Delivered"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {order.status}
        </span>

      </div>

      {/* Customer */}

      <div className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-2xl font-bold">
          Customer Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <p className="text-sm text-gray-500">
              Customer Name
            </p>

            <h3 className="font-semibold">
              {order.customerName}
            </h3>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <h3 className="font-semibold">
              {order.email}
            </h3>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Phone
            </p>

            <h3 className="font-semibold">
              {order.phone}
            </h3>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              City
            </p>

            <h3 className="font-semibold">
              {[order.city, order.postalCode].filter(Boolean).join(" ")}
            </h3>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">
              Address
            </p>

            <h3 className="font-semibold">
              {order.address}
            </h3>
          </div>

        </div>

      </div>

      {/* Products */}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="mb-8 text-2xl font-bold">
          Ordered Products
        </h2>

        <div className="space-y-6">

          {order.products.map((product: any, index: number) => (

            <div
              key={index}
              className="flex gap-6 rounded-xl border p-5"
            >

              <div className="relative h-32 w-28 overflow-hidden rounded-lg">

                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />

              </div>

              <div className="flex flex-1 justify-between">

                <div>

                  <h3 className="text-xl font-semibold">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-gray-500">
                    Size : {product.size}
                  </p>

                  <p className="text-gray-500">
                    Color : {product.color}
                  </p>

                  <p className="text-gray-500">
                    Quantity : {product.quantity}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-lg font-bold text-[#6f1d46]">
                    Rs. {product.price}
                  </p>

                  <p className="mt-3 text-gray-500">
                    Total
                  </p>

                  <h4 className="font-bold">
                    Rs. {product.price * product.quantity}
                  </h4>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Summary */}

      <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-2xl font-bold">
          Order Summary
        </h2>

        <div className="flex justify-between border-b py-3">

          <span>Payment Method</span>

          <span>
            {order.paymentMethod}
          </span>

        </div>

        <div className="flex justify-between border-b py-3">

          <span>Status</span>

          <span>
            {order.status}
          </span>

        </div>

        <div className="flex justify-between py-5 text-2xl font-bold">

          <span>Grand Total</span>

          <span className="text-[#6f1d46]">
            Rs. {order.total}
          </span>

        </div>

        <button
          onClick={() => window.print()}
          className="mt-6 rounded-xl bg-[#6f1d46] px-8 py-3 text-white"
        >
          Print Invoice
        </button>

      </div>

    </section>
  );
}