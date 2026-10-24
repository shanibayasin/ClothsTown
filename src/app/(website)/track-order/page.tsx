"use client";

import { Suspense, type FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Loader2, PackageCheck, Search, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { readJsonResponse } from "@/lib/api";

interface TrackingItem {
  productId?: string;
  name: string;
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface TrackingOrder {
  _id: string;
  status: string;
  createdAt: string;
  products: TrackingItem[];
}

const orderSteps = ["Pending", "Processing", "Shipped", "Delivered"];

function formatDate(date: string, includeTime = false) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-[#f8fafb]">
          <div className="mx-auto max-w-[1000px] px-4 py-8 text-xs text-slate-500 sm:px-6">
            Loading order tracking...
          </div>
        </main>
      }
    >
      <TrackOrderForm />
    </Suspense>
  );
}

function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedId = orderId.trim();

    if (!requestedId) {
      setError("Enter your order ID to continue.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(requestedId)}/tracking`
      );
      const data = await readJsonResponse<TrackingOrder | { message?: string }>(
        response,
        {}
      );

      if (!response.ok) {
        const message =
          "message" in data && data.message
            ? data.message
            : "We couldn't find an order with that ID.";
        setError(message);
        return;
      }

      if (!("_id" in data)) {
        setError("We couldn't find an order with that ID.");
        return;
      }

      setOrder(data);
    } catch (requestError) {
      console.error("Order tracking lookup failed:", requestError);
      setError("Unable to look up your order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isCancelled = order?.status.toLowerCase() === "cancelled";
  const activeStep = orderSteps.findIndex(
    (status) => status.toLowerCase() === order?.status.toLowerCase()
  );
  const completedStep = isCancelled ? -1 : activeStep < 0 ? 0 : activeStep;
  const orderTotal =
    order?.products.reduce((total, item) => total + item.price * item.quantity, 0) ?? 0;

  return (
    <main className="min-h-[70vh] bg-[#f8fafb] text-[#172b3a]">
      <section className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 lg:py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[10px] text-slate-500">
          <Link href="/" className="hover:text-[#102f43]">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="font-medium text-slate-700">Track Order</span>
        </nav>

        <h1 className="text-xl font-bold text-[#173246] sm:text-2xl">Track Your Order</h1>
        <p className="mt-1 text-xs text-slate-500">
          Enter your order ID to get real-time updates.
        </p>

        <form
          onSubmit={handleTrackOrder}
          className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]"
        >
          <label className="sr-only" htmlFor="tracking-order-id">Order ID</label>
          <input
            id="tracking-order-id"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Enter the order ID from your confirmation"
            autoComplete="off"
            className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#102f43] px-4 text-xs font-semibold text-white transition hover:bg-[#1c4d69] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Track Order
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {order && (
          <section aria-live="polite" className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#233b4d]">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  Placed on {formatDate(order.createdAt)}
                  <span className="mx-1.5">·</span>
                  {order.products.length} {order.products.length === 1 ? "item" : "items"}
                  <span className="mx-1.5">·</span>
                  Rs. {orderTotal.toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  isCancelled
                    ? "bg-red-50 text-red-700"
                    : order.status.toLowerCase() === "delivered"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                }`}
              >
                {order.status}
              </span>
            </div>

            {isCancelled ? (
              <div className="mt-4 rounded-md bg-red-50 px-3 py-3 text-xs text-red-700">
                This order has been cancelled. Please contact customer support if you need help.
              </div>
            ) : (
              <ol aria-label="Order progress" className="mt-5 flex">
                {orderSteps.map((status, index) => {
                  const isComplete = index <= completedStep;
                  const isCurrent = index === completedStep;

                  return (
                    <li key={status} className="relative flex min-w-0 flex-1 flex-col items-start">
                      {index < orderSteps.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-3 top-3 h-0.5 w-full ${
                            index < completedStep ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex size-6 items-center justify-center rounded-full border-2 ${
                          isComplete
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {isComplete ? <Check size={13} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                      </span>
                      <span className={`mt-2 text-[9px] font-semibold sm:text-[10px] ${isCurrent ? "text-emerald-700" : isComplete ? "text-slate-700" : "text-slate-400"}`}>
                        {status}
                      </span>
                      {index === 0 && (
                        <span className="mt-0.5 text-[8px] text-slate-400">
                          {formatDate(order.createdAt, true)}
                        </span>
                      )}
                      {isCurrent && index > 0 && (
                        <span className="mt-0.5 text-[8px] text-slate-400">Current status</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-bold text-[#233b4d]">Items in this order</h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {order.products.map((item, index) => (
                  <div
                    key={`${item.productId ?? item.name}-${index}`}
                    className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-slate-50">
                      <Image
                        src={item.image || "/placeholder-product.svg"}
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-slate-700">{item.name}</p>
                      <p className="mt-0.5 text-[9px] text-slate-500">
                        Rs. {item.price.toLocaleString()}
                        {[item.color, item.size].filter(Boolean).map((value) => value !== "default" ? value : "").filter(Boolean).map((value) => ` · ${value}`).join("")}
                        {" · "}Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-slate-700">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500">
              {order.status.toLowerCase() === "shipped" ? (
                <Truck size={14} className="text-[#2867b2]" />
              ) : (
                <PackageCheck size={14} className="text-emerald-700" />
              )}
              Status last updated based on your order’s current status.
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
