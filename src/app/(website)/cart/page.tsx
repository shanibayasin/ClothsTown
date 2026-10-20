"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart } = useCart();

  // Dynamic calculations panel 
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping active threshold
  const total = subtotal + shipping;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      
      {/* Top Header Section */}
      <div className="mb-12">
        <span className="text-xs uppercase tracking-[0.3em] font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
          Shopping Bag
        </span>
        <h1 className="mt-5 font-heading text-4xl sm:text-5xl text-[#2B1A22] tracking-tight">
          Your Cart
        </h1>
        <p className="mt-4 text-base text-gray-500">
          Review your selected products before proceeding to checkout.
        </p>
      </div>

      {cart.length === 0 ? (
        /* Empty State Layout Layer */
        <div className="rounded-[30px] border border-dashed border-[#d8b7c7] bg-[#FCF8F6] py-24 text-center max-w-4xl mx-auto shadow-inner animate-in fade-in duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-2xl font-bold text-[#2B1A22]">
            Your cart is empty
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
            Add beautiful luxury articles to your bag to continue shopping.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-primary-dark hover:scale-105 shadow-md"
          >
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>
      ) : (
        /* Dynamic Cart Table Grid */
        <div className="grid gap-10 lg:grid-cols-3 items-start">
          
          {/* Left Column: Interactive Products Item List Stack */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <div 
                key={item._id} 
                className="rounded-[30px] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm transition hover:shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  
                  {/* Optimized Image Layer */}
                  <div className="relative h-36 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-[#FCF8F6] border border-slate-50">
                    <Image
                      src={item.image || "/images/placeholder-product.jpg"}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  {/* Core Meta Details Layout */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-xl sm:text-2xl text-[#2B1A22] truncate">
                      {item.name}
                    </h2>
                    <p className="mt-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Premium Collection
                    </p>
                    <p className="mt-4 text-xl font-bold text-[#6f1d46]">
                      Rs. {item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Operational Controls Interface Panel */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 gap-4">
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-full border border-rose-100 transition duration-200"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>

                    {/* Quantity Selector Stepper */}
                    <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 font-medium text-[#2B1A22]">
                      <button 
                        onClick={() => decreaseQty(item._id)}
                        className="p-1 hover:text-primary disabled:text-gray-300 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center select-none">{item.quantity}</span>
                      <button 
                        onClick={() => increaseQty(item._id)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary Configuration Panel */}
          <div className="sticky top-28">
            <div className="rounded-[30px] bg-white p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#2B1A22] tracking-tight pb-4 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-bold normal-case">Free Shipping</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Estimated Tax</span>
                  <span className="text-gray-900 font-bold">Rs. 0</span>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-base font-bold text-[#2B1A22] normal-case">
                  <span>Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-8 block w-full text-center rounded-full bg-primary py-4 text-sm font-semibold text-white shadow-md transition duration-300 hover:bg-primary-dark hover:shadow-xl hover:scale-[1.01]"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}