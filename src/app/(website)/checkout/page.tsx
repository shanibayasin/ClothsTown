"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "@/app/components/product/ProductImage";
import { ArrowLeft, Check, ChevronRight, Loader2, ShieldCheck, Truck } from "lucide-react";
import { getCartItemKey, useCart } from "@/context/CartContext";

type CheckoutForm = {
  customerName: string;
  email: string;
  phone: string;
  city: string;
  postalCode: string;
  address: string;
  paymentMethod: string;
};

const initialForm: CheckoutForm = {
  customerName: "",
  email: "",
  phone: "",
  city: "",
  postalCode: "",
  address: "",
  paymentMethod: "Cash On Delivery",
};

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState("");

  const setField = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  };

  async function placeOrder() {
    if (!cart.length) {
      setError("Your cart is empty. Add products before checking out.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          products: cart.map((item) => ({
            productId: item._id,
            name: item.name,
            image: item.image,
            size: item.size ?? "default",
            color: item.color ?? "default",
            quantity: item.quantity,
            price: item.price,
          })),
          total: cartTotal,
        }),
      });

      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(result?.message || "Unable to place your order. Please try again.");
      }

      const createdOrder = (await res.json().catch(() => null)) as
        | { _id?: string }
        | null;
      clearCart();
      setPlacedOrderId(createdOrder?._id || "");
      setStep(3);
    } catch (submitError) {
      console.error("Checkout order submission failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const stepClass = (targetStep: 1 | 2 | 3) =>
    step >= targetStep
      ? "border-[#102f43] bg-[#102f43] text-white"
      : "border-slate-200 bg-slate-100 text-slate-500";

  return (
    <main className="min-h-[70vh] bg-[#f8fafb] text-[#172b3a]">
      <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[10px] text-slate-500">
          <Link href="/" className="hover:text-[#102f43]">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link href="/cart" className="hover:text-[#102f43]">Cart</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="font-medium text-slate-700">Checkout</span>
        </nav>

        <h1 className="text-xl font-bold text-[#173246] sm:text-2xl">Checkout</h1>

        <ol aria-label="Checkout progress" className="mx-auto my-5 flex max-w-[560px] items-center justify-center">
          {([
            [1, "Shipping"],
            [2, "Payment"],
            [3, "Confirmation"],
          ] as const).map(([number, label], index) => (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span className={`flex size-7 items-center justify-center rounded-full border text-[10px] font-bold ${stepClass(number)}`}>
                  {step > number ? <Check size={13} /> : number}
                </span>
                <span className={`hidden text-[10px] sm:inline ${step >= number ? "font-semibold text-[#173246]" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {index < 2 && (
                <span className={`mx-3 h-px flex-1 sm:mx-5 ${step > number ? "bg-[#102f43]" : "bg-slate-200"}`} />
              )}
            </li>
          ))}
        </ol>

        {cart.length === 0 ? (
          step === 3 ? (
            <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Check size={22} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-[#173246]">Order placed successfully</h2>
              {placedOrderId ? (
                <>
                  <p className="mt-2 text-xs text-slate-500">Save this order ID to check delivery updates.</p>
                  <p className="mt-3 break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-[#233b4d]">
                    {placedOrderId}
                  </p>
                  <Link
                    href={`/track-order?orderId=${encodeURIComponent(placedOrderId)}`}
                    className="mt-5 inline-flex items-center justify-center rounded-md bg-[#102f43] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c4d69]"
                  >
                    Track Your Order
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Keep your order confirmation for tracking details.</p>
              )}
            </div>
          ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center">
            <h2 className="text-lg font-bold text-[#173246]">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Add something before continuing to checkout.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#102f43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1c4d69]"
            >
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>
          )
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              {step === 1 ? (
                <>
                  <h2 className="text-sm font-bold text-[#233b4d]">Shipping Information</h2>
                  <form
                    id="shipping-form"
                    className="mt-4 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setError("");
                      setStep(2);
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-[10px] font-medium text-slate-600">
                        Full Name
                        <input
                          autoComplete="name"
                          required
                          value={form.customerName}
                          onChange={(event) => setField("customerName", event.target.value)}
                          placeholder="Your full name"
                          className="mt-1 block h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                        />
                      </label>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Phone Number
                        <input
                          type="tel"
                          autoComplete="tel"
                          required
                          value={form.phone}
                          onChange={(event) => setField("phone", event.target.value)}
                          placeholder="+92 300 1234567"
                          className="mt-1 block h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                        />
                      </label>
                    </div>
                    <label className="block text-[10px] font-medium text-slate-600">
                      Email Address
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(event) => setField("email", event.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 block h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                      />
                    </label>
                    <label className="block text-[10px] font-medium text-slate-600">
                      Address
                      <textarea
                        autoComplete="street-address"
                        required
                        rows={2}
                        value={form.address}
                        onChange={(event) => setField("address", event.target.value)}
                        placeholder="House, street, area"
                        className="mt-1 block w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-[10px] font-medium text-slate-600">
                        City
                        <input
                          autoComplete="address-level2"
                          required
                          value={form.city}
                          onChange={(event) => setField("city", event.target.value)}
                          placeholder="City"
                          className="mt-1 block h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                        />
                      </label>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Postal Code <span className="font-normal text-slate-400">(optional)</span>
                        <input
                          autoComplete="postal-code"
                          value={form.postalCode}
                          onChange={(event) => setField("postalCode", event.target.value)}
                          placeholder="Postal code"
                          className="mt-1 block h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                        />
                      </label>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-sm font-bold text-[#233b4d]">Payment Method</h2>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Review your delivery details and select how you would like to pay.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2867b2] bg-blue-50/40 p-3">
                    <input
                      type="radio"
                      name="payment"
                      value="Cash On Delivery"
                      checked={form.paymentMethod === "Cash On Delivery"}
                      onChange={(event) => setField("paymentMethod", event.target.value)}
                      className="mt-0.5 accent-[#102f43]"
                    />
                    <span>
                      <span className="block text-xs font-semibold text-[#233b4d]">Cash on Delivery</span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        Pay in cash when your order arrives.
                      </span>
                    </span>
                  </label>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[10px] leading-5 text-slate-600">
                    <h3 className="font-semibold text-[#233b4d]">Delivering to</h3>
                    <p>{form.customerName} · {form.phone}</p>
                    <p>{form.address}, {form.city}{form.postalCode ? ` ${form.postalCode}` : ""}</p>
                    <p>{form.email}</p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="mt-1 font-semibold text-[#2867b2] hover:underline"
                    >
                      Edit shipping information
                    </button>
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-4 border-t border-slate-100 pt-4">
                {step === 1 ? (
                  <button
                    type="submit"
                    form="shipping-form"
                    className="w-full rounded-md bg-[#102f43] py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1c4d69]"
                  >
                    Continue to Payment
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="rounded-md border border-slate-200 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void placeOrder()}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#102f43] py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1c4d69] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading && <Loader2 size={14} className="animate-spin" />}
                      {loading ? "Placing Order..." : "Place Order"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <aside className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 lg:sticky lg:top-5">
              <h2 className="text-sm font-bold text-[#233b4d]">Order Summary</h2>
              <div className="mt-3 max-h-[250px] space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={getCartItemKey(item)} className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-slate-600 text-[9px] font-semibold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-slate-700">{item.name}</p>
                      {(item.size || item.color) && (
                        <p className="mt-0.5 truncate text-[9px] text-slate-400">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-slate-700">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-[10px]">
                <div className="flex justify-between text-slate-500">
                  <dt>Subtotal</dt>
                  <dd>Rs. {cartTotal.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between text-slate-500">
                  <dt className="flex items-center gap-1"><Truck size={12} /> Shipping</dt>
                  <dd>Rs. 0</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-[#233b4d]">
                  <dt>Total</dt>
                  <dd>Rs. {cartTotal.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-[9px] text-slate-500">
                <ShieldCheck size={13} className="shrink-0 text-emerald-700" />
                Secure checkout · Cash on Delivery available
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
