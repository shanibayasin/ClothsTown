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
  const [actionOrderId, setActionOrderId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = (await res.json()) as Order[] | { message?: string };
      if (!res.ok || !Array.isArray(data)) {
        throw new Error("message" in data ? data.message : "Failed to load orders.");
      }
      setOrders(data);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    setActionOrderId(id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update the order status.");
      setSuccessMessage("Order status updated.");
      await fetchOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update the order status.");
    } finally {
      setActionOrderId("");
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;

    setActionOrderId(id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete the order.");
      setSuccessMessage("Order deleted.");
      await fetchOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete the order.");
    } finally {
      setActionOrderId("");
    }
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

        <span className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-white">
          {orders.length} Orders
        </span>

      </div>

      {errorMessage && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">

        <table className="w-full min-w-[920px]">

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
                      disabled={actionOrderId === order._id}
                      onChange={(e) =>
                        updateStatus(
                          order._id,
                          e.target.value
                        )
                      }
                      className={`rounded-md px-3 py-2 disabled:opacity-60 ${badge(
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
                        type="button"
                        disabled={actionOrderId === order._id}
                        onClick={() =>
                          deleteOrder(order._id)
                        }
                        className="rounded-md bg-red-500 px-4 py-2 text-white disabled:cursor-wait disabled:opacity-60"
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