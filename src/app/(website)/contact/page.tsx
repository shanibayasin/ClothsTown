"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    comment: "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-[11px] text-[#6f1d46] sm:px-6"
      >
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden="true">&gt;</span>
        <span className="font-medium">Contact Us</span>
      </nav>

      <section className="mx-auto w-full max-w-[640px] px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <h1 className="border-b border-[#e5e5e5] pb-4 text-center text-lg font-semibold">
          Contact Us
        </h1>

        <form onSubmit={handleSubmit} className="mt-20 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sr-only" htmlFor="contact-name">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="h-9 w-full border border-[#aaa] px-4 text-xs outline-none placeholder:text-[#806d75] focus:border-[#6f1d46]"
            />

            <label className="sr-only" htmlFor="contact-email">
              Email *
            </label>
            <input
              id="contact-email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder="Email *"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="h-9 w-full border border-[#aaa] px-4 text-xs outline-none placeholder:text-[#806d75] focus:border-[#6f1d46]"
            />
          </div>

          <label className="sr-only" htmlFor="contact-phone">
            Phone number
          </label>
          <input
            id="contact-phone"
            name="phone"
            autoComplete="tel"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className="h-9 w-full border border-[#aaa] px-4 text-xs outline-none placeholder:text-[#806d75] focus:border-[#6f1d46]"
          />

          <label className="sr-only" htmlFor="contact-comment">
            Comment
          </label>
          <textarea
            id="contact-comment"
            name="comment"
            placeholder="Comment"
            rows={4}
            value={form.comment}
            onChange={(event) =>
              setForm((current) => ({ ...current, comment: event.target.value }))
            }
            className="w-full resize-y border border-[#888] px-4 py-2 text-xs outline-none placeholder:text-[#806d75] focus:border-[#6f1d46]"
          />

          <button
            type="submit"
            className="mt-4 min-w-[72px] bg-[#171717] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#6f1d46]"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
