"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, PackageCheck } from "lucide-react";

interface CustomerProfile {
  name: string;
  email: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = (await response.json()) as {
          customer?: CustomerProfile;
          message?: string;
        };
        if (!response.ok || !result.customer) {
          if (active) setError(result.message ?? "Unable to load your account.");
          return;
        }
        if (active) setCustomer(result.customer);
      } catch (requestError) {
        console.error("Customer account request failed:", requestError);
        if (active) setError("Could not reach the server. Please try again.");
      }
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) {
        setError("Unable to sign out right now. Please try again.");
        setIsSigningOut(false);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (requestError) {
      console.error("Customer sign-out request failed:", requestError);
      setError("Could not reach the server. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <main className="mx-auto min-h-[50svh] w-full max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#173246]">My account</h1>
        {customer ? (
          <>
            <p className="mt-3 text-lg font-semibold text-slate-800">{customer.name}</p>
            <p className="mt-1 text-sm text-slate-600">{customer.email}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/track-order"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#092b40] px-4 text-sm font-semibold text-white hover:bg-[#124561]"
              >
                <PackageCheck size={16} aria-hidden="true" />
                Track an order
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <LogOut size={16} aria-hidden="true" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        ) : error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Loading your account…</p>
        )}
      </section>
    </main>
  );
}
