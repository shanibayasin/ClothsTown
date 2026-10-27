"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import ClothestownLogo from "@/app/components/layout/ClothestownLogo";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Login failed. Please try again.");
        return;
      }

      const requestedPath = searchParams.get("next");
      const destination =
        requestedPath?.startsWith("/admin/") && requestedPath !== "/admin/login"
          ? requestedPath
          : "/admin";
      router.replace(destination);
      router.refresh();
    } catch (requestError) {
      console.error("Admin login request failed:", requestError);
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4 py-10">
      <section className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_55px_rgba(18,38,53,0.1)] sm:p-9">
        <div>
          <ClothestownLogo width={190} />
          <div className="mt-1">
            <p className="text-xs text-slate-500">Store administration</p>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-bold tracking-tight text-[#172b3b]">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter the administrator credentials configured for this installation.
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <span className="relative mt-2 block">
              <Mail
                aria-hidden="true"
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#2867b2] focus:ring-2 focus:ring-[#2867b2]/10"
              />
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole
                aria-hidden="true"
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={1024}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#2867b2] focus:ring-2 focus:ring-[#2867b2]/10"
              />
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-[var(--brand-primary)] text-sm font-semibold text-white transition hover:bg-[#203f59] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
          <p className="text-sm text-slate-500">Loading admin sign in…</p>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
