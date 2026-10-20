"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    });

    fetchOrders();
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;

    await fetch(`/api/orders/${id}`, {
      method: "DELETE",
    });

    fetchOrders();
  }

  function badge(status: string) {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Shipped":
        return "bg-purple-100 text-purple-700";

      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100";
    }
  }

  return (
    <section className="p-8">

      <div className="mb-8 flex items-center justify-between">

        <h1 className="text-3xl font-bold">
          Orders
        </h1>

        <span className="rounded-xl bg-[#6f1d46] px-4 py-2 text-white">
          {orders.length} Orders
        </span>

      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="p-4 text-left">
                Customer
              </th>

              <th className="p-4 text-left">
                Phone
              </th>

              <th className="p-4 text-left">
                City
              </th>

              <th className="p-4 text-left">
                Total
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Date
              </th>

              <th className="p-4 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center"
                >
                  Loading...
                </td>
              </tr>

            ) : orders.length === 0 ? (

              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center"
                >
                  No Orders Found
                </td>
              </tr>

            ) : (

              orders.map((order) => (

                <tr
                  key={order._id}
                  className="border-t"
                >

                  <td className="p-4">

                    <div className="font-semibold">
                      {order.customerName}
                    </div>

                    <div className="text-sm text-gray-500">
                      {order.email}
                    </div>

                  </td>

                  <td className="p-4">
                    {order.phone}
                  </td>

                  <td className="p-4">
                    {order.city}
                  </td>

                  <td className="p-4 font-semibold">
                    Rs. {order.total}
                  </td>

                  <td className="p-4">

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(
                          order._id,
                          e.target.value
                        )
                      }
                      className={`rounded-lg px-3 py-2 ${badge(
                        order.status
                      )}`}
                    >
                      <option>
                        Pending
                      </option>

                      <option>
                        Processing
                      </option>

                      <option>
                        Shipped
                      </option>

                      <option>
                        Delivered
                      </option>

                      <option>
                        Cancelled
                      </option>

                    </select>

                  </td>

                  <td className="p-4">
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">

                    <div className="flex justify-center gap-3">

                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                      >
                        View
                      </Link>

                      <button
                        onClick={() =>
                          deleteOrder(order._id)
                        }
                        className="rounded-lg bg-red-500 px-4 py-2 text-white"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}