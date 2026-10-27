"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Headset,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { ClothestownLogo } from "@/app/components/layout/ClothestownLogo";

const trustItems = [
  {
    Icon: Truck,
    title: "Nationwide Shopping",
    detail: "Explore the collection from anywhere",
  },
  {
    Icon: Banknote,
    title: "Cash on Delivery",
    detail: "Available at checkout",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Checkout",
    detail: "Shop with confidence",
  },
  {
    Icon: Headset,
    title: "Here to Help",
    detail: "Get in touch with our team",
  },
];

const collectionLinks = [
  { label: "Shop All", href: "/shop" },
  { label: "Men", href: "/shop/men" },
  { label: "Women", href: "/shop/women" },
  { label: "Accessories", href: "/shop/accessories" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/shop?sale=true" },
];

const careLinks = [
  { label: "Track Order", href: "/track-order" },
  { label: "Returns & Exchanges", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/policies#privacy" },
  { label: "Terms of Use", href: "/policies#terms" },
];

const socialLinks = [
  { label: "Facebook", Icon: FaFacebookF, href: "https://www.facebook.com/" },
  { label: "Instagram", Icon: FaInstagram, href: "https://www.instagram.com/" },
  { label: "X", Icon: FaXTwitter, href: "https://x.com/" },
  { label: "YouTube", Icon: FaYoutube, href: "https://www.youtube.com/" },
  { label: "TikTok", Icon: FaTiktok, href: "https://www.tiktok.com/" },
];

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d9a77f]">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 text-xs text-[#f8f5ef]/85">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="transition-colors duration-200 hover:text-[#d9a77f]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const [newsletterMessage, setNewsletterMessage] = useState("");

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterMessage("Newsletter sign-up is not available yet.");
  }

  return (
    <footer className="mt-12 border-t border-white/15 bg-[#0f2d39] text-xs text-[#f8f5ef] transition-colors duration-300 sm:mt-16">
      <section
        aria-label="Shopping benefits"
        className="border-b border-white/15 py-6 sm:py-8"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustItems.map(({ Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d9a77f]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-[#f8f5ef]">
                  {title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[#f8f5ef]/70">
                  {detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <Link href="/" aria-label="ClothesTown home" className="inline-flex">
              <ClothestownLogo
                width={220}
                showTagline={false}
                showDivider={false}
                variant="horizontal"
                inverse
              />
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-[#f8f5ef]/75">
              CLOTHESTOWN brings together everyday style, quality, and comfort.
              Find your next favorite look and make it your own.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#f8f5ef]/70">
              {socialLinks.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-[#d9a77f]"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinkGroup title="Collections" links={collectionLinks} />
          <FooterLinkGroup title="Client Care" links={careLinks} />

          <div className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d9a77f]">
              Private Salon
            </h2>
            <p className="text-[11px] leading-relaxed text-[#f8f5ef]/75">
              Get the latest news and updates from CLOTHESTOWN.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <label className="sr-only" htmlFor="footer-newsletter-email">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email address"
                className="w-full rounded border border-white/25 bg-white px-3 py-2.5 text-xs text-[#0f2d39] placeholder:text-[#0f2d39]/55 transition-colors focus:border-[#d9a77f] focus:outline-none focus:ring-2 focus:ring-[#d9a77f]/35"
              />
              <button
                type="submit"
                className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-[#c18b65] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#0f2d39] transition-colors duration-200 hover:bg-[#d9a77f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8f5ef] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2d39]"
              >
                <span>Join Salon</span>
                <ArrowRight
                  className="size-3.5 text-[#0f2d39]"
                  aria-hidden="true"
                />
              </button>
              <p aria-live="polite" className="min-h-4 text-[10px] leading-relaxed text-[#f8f5ef]/70">
                {newsletterMessage}
              </p>
            </form>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-[10px] leading-relaxed text-[#f8f5ef]/70 sm:flex-row sm:text-[11px]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} CLOTHESTOWN. All rights reserved. Style
            Lives Here.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href="/policies#privacy"
              className="transition-colors duration-200 hover:text-[#d9a77f]"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/policies#terms"
              className="transition-colors duration-200 hover:text-[#d9a77f]"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
