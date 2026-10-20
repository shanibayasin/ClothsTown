"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const [routerReady, setRouterReady] = useState(false);

  useEffect(() => {
    setRouterReady(true);
  }, []);

  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);

  const navigateTo = (path: string) => {
    if (typeof window === "undefined") return;

    if (!routerReady) {
      window.location.assign(path);
      return;
    }

    router.push(path);
  };

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    paymentMethod: "Cash On Delivery",
  });

  async function placeOrder() {
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (
      !form.customerName ||
      !form.email ||
      !form.phone ||
      !form.city ||
      !form.address
    ) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

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

    if (res.ok) {
      clearCart();
      alert("Order placed successfully.");
      navigateTo("/");
    } else {
      alert("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">

      <h1 className="mb-12 text-4xl font-bold">
        Checkout
      </h1>

      <div className="grid gap-10 lg:grid-cols-3">

        {/* Shipping Form */}

        <div className="space-y-5 lg:col-span-2">

          <input
            placeholder="Full Name"
            className="w-full rounded-xl border p-4"
            value={form.customerName}
            onChange={(e) =>
              setForm({
                ...form,
                customerName: e.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border p-4"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            placeholder="Phone Number"
            className="w-full rounded-xl border p-4"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <input
            placeholder="City"
            className="w-full rounded-xl border p-4"
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
          />

          <textarea
            rows={5}
            placeholder="Complete Address"
            className="w-full rounded-xl border p-4"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold">
              Payment Method
            </h3>

            <label className="mt-4 flex items-center gap-3">

              <input
                type="radio"
                checked
                readOnly
              />

              Cash On Delivery

            </label>

          </div>

        </div>

        {/* Summary */}

        <div className="h-fit rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-2xl font-bold">
            Order Summary
          </h2>

          <div className="space-y-4">

            {cart.map((item) => (

              <div
                key={`${item._id}-${item.size ?? "default"}-${item.color ?? "default"}`}
                className="flex justify-between"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <span>
                  Rs. {item.price * item.quantity}
                </span>

              </div>

            ))}

          </div>

          <hr className="my-6" />

          <div className="flex justify-between text-xl font-bold">

            <span>Total</span>

            <span className="text-primary">
              Rs. {cartTotal}
            </span>

          </div>

          <button
            onClick={placeOrder}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-primary py-4 font-semibold text-white hover:bg-primary-dark"
          >
            {loading
              ? "Placing Order..."
              : "Place Order"}
          </button>

        </div>

      </div>

    </section>
  );
}