"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { getCartItemKey, useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping: number = 0;
  const total = subtotal + shipping;

  function handleApplyCoupon() {
    setCouponMessage(
      couponCode.trim()
        ? "Coupon codes are not available yet."
        : "Enter a coupon code first."
    );
  }

  return (
    <main className="min-h-[70vh] bg-[#f8fafb] text-[#172b3a]">
      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {cart.length === 0 ? (
          <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-[#173246]">
              <ShoppingBag size={25} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#173246]">Your cart is empty</h1>
            <p className="mt-2 text-sm text-slate-500">
              Browse the store and add products you love.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#102f43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c4d69]"
            >
              <ArrowLeft size={15} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-4 text-lg font-bold text-[#173246] sm:text-xl">
              Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h1>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px_100px_24px] items-center gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[10px] font-semibold text-slate-600 sm:grid sm:px-5">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span aria-label="Actions" />
              </div>

              {cart.map((item) => {
                const lineTotal = item.price * item.quantity;

                return (
                  <article
                    key={getCartItemKey(item)}
                    className="grid grid-cols-[64px_minmax(0,1fr)_24px] items-center gap-x-3 gap-y-3 border-b border-slate-100 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_100px_120px_100px_24px] sm:gap-4 sm:px-5 sm:py-3.5"
                  >
                    <div className="relative row-span-2 aspect-square w-16 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 sm:row-span-1 sm:flex sm:h-14 sm:w-14 sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent">
                      <Image
                        src={item.image || "/images/placeholder-product.jpg"}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover sm:!static sm:!h-14 sm:!w-14 sm:!transform-none sm:!object-cover"
                      />
                    </div>

                    <div className="min-w-0 sm:col-start-1 sm:ml-[68px] sm:row-start-1">
                      <Link
                        href={`/product/${item.slug}`}
                        className="block truncate text-[11px] font-semibold text-[#233b4d] hover:text-[#2867b2] sm:text-xs"
                      >
                        {item.name}
                      </Link>
                      {(item.color || item.size) && (
                        <p className="mt-1 text-[9px] text-slate-500">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] font-medium text-slate-600 sm:hidden">
                        Rs. {item.price.toLocaleString()} each
                      </p>
                    </div>

                    <p className="hidden text-[11px] font-medium text-slate-700 sm:block">
                      Rs. {item.price.toLocaleString()}
                    </p>

                    <div className="col-start-2 row-start-2 flex h-8 w-fit items-center rounded-md border border-slate-200 sm:col-start-3 sm:row-start-auto">
                      <button
                        type="button"
                        onClick={() => decreaseQty(getCartItemKey(item))}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-[11px] font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQty(getCartItemKey(item))}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <p className="col-start-3 row-start-2 text-right text-[11px] font-semibold text-[#263d4e] sm:col-start-4 sm:row-start-auto sm:text-left">
                      <span className="sm:hidden">Total: </span>
                      Rs. {lineTotal.toLocaleString()}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFromCart(getCartItemKey(item))}
                      aria-label={`Remove ${item.name} from cart`}
                      className="col-start-3 row-start-1 flex size-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 sm:col-start-5 sm:row-start-auto"
                    >
                      <X size={13} />
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 grid items-start gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-xs font-bold text-[#233b4d]">Apply Coupon</h2>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleApplyCoupon();
                  }}
                >
                  <label htmlFor="cart-coupon" className="sr-only">Coupon code</label>
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setCouponMessage("");
                    }}
                    placeholder="Enter coupon code"
                    className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-[10px] outline-none placeholder:text-slate-400 focus:border-[#2867b2]"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-[#102f43] px-4 text-[10px] font-semibold text-white transition hover:bg-[#1c4d69]"
                  >
                    Apply
                  </button>
                </form>
                {couponMessage && (
                  <p role="status" className="mt-2 text-[10px] text-slate-500">
                    {couponMessage}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-xs font-bold text-[#233b4d]">Order Summary</h2>
                <dl className="mt-3 space-y-2 text-[11px]">
                  <div className="flex justify-between gap-4 text-slate-500">
                    <dt>Subtotal</dt>
                    <dd className="font-medium text-slate-700">Rs. {subtotal.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-500">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-slate-700">
                      {shipping === 0 ? "Rs. 0" : `Rs. ${shipping.toLocaleString()}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-2 text-sm font-bold text-[#263d4e]">
                    <dt>Total</dt>
                    <dd>Rs. {total.toLocaleString()}</dd>
                  </div>
                </dl>
                <Link
                  href="/checkout"
                  className="mt-4 block rounded-md bg-[#102f43] py-2.5 text-center text-[11px] font-semibold text-white transition hover:bg-[#1c4d69]"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/shop"
                  className="mt-2 block rounded-md border border-[#102f43] py-2 text-center text-[11px] font-semibold text-[#102f43] transition hover:bg-slate-50"
                >
                  Continue Shopping
                </Link>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
