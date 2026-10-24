"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, Mail, Shirt } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Men", href: "/shop/men" },
  { label: "Women", href: "/shop/women" },
  { label: "Accessories", href: "/shop/accessories" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/shop?sale=true" },
];

const serviceLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
  { label: "Returns & Exchanges", href: "/contact" },
  { label: "FAQs", href: "/contact" },
  { label: "Size Guide", href: "/contact" },
  { label: "Help", href: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Shipping Policy", href: "/contact" },
  { label: "Return Policy", href: "/contact" },
  { label: "Payment Methods", href: "/contact" },
];

const socialLinks = [
  { label: "Facebook", Icon: FaFacebookF, href: "https://www.facebook.com/" },
  { label: "Instagram", Icon: FaInstagram, href: "https://www.instagram.com/" },
  { label: "X", Icon: FaXTwitter, href: "https://x.com/" },
  { label: "YouTube", Icon: FaYoutube, href: "https://www.youtube.com/" },
  { label: "TikTok", Icon: FaTiktok, href: "https://www.tiktok.com/" },
];

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white sm:mb-5">{title}</h3>
      <ul className="space-y-2.5 text-xs text-[#b7c5ce] sm:space-y-3">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link className="transition-colors hover:text-white" href={href}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [newsletterMessage, setNewsletterMessage] = useState("");

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterMessage("Newsletter sign-up is not available yet.");
  }

  return (
    <footer className="mt-12 bg-[#071f30] text-white sm:mt-16">
      <section className="relative overflow-hidden border-b border-white/15 bg-[radial-gradient(ellipse_at_78%_100%,rgba(38,91,126,0.55),transparent_47%),linear-gradient(110deg,#0b2d43_0%,#123d5c_56%,#0b2639_100%)]">
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-6 px-5 py-8 sm:px-8 sm:py-9 lg:grid-cols-[1fr_auto] lg:gap-10 lg:px-12">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <Mail
              aria-hidden="true"
              className="mt-1 size-9 shrink-0 text-white sm:size-12"
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold sm:text-lg">Join Our Newsletter</h2>
              <p className="mt-1 text-xs leading-5 text-[#d0dce4]">
                Get exclusive offers, new arrivals and the latest trend updates.
              </p>
              <form
                className="mt-4 flex max-w-[560px] rounded-lg bg-white/10 p-1"
                onSubmit={handleNewsletterSubmit}
              >
                <label className="sr-only" htmlFor="footer-newsletter-email">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-[#c2d0d9]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-bold text-[#102d40] transition-colors hover:bg-[#eaf1f5] sm:px-5"
                >
                  Subscribe
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </form>
              <p aria-live="polite" className="mt-2 min-h-4 text-[11px] text-[#d0dce4]">
                {newsletterMessage}
              </p>
            </div>
          </div>
          <p className="hidden pr-3 text-right font-serif text-xl italic leading-7 text-white/90 sm:block lg:text-2xl">
            Stay Stylish
            <br />
            Stay Updated
            <span className="mx-auto mt-2 block h-0.5 w-14 rotate-[-10deg] rounded bg-white/80" />
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 sm:py-10 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-[1.45fr_0.8fr_1fr_0.9fr_1.15fr] lg:gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
              <Shirt aria-hidden="true" className="size-7" strokeWidth={1.7} />
              <span>
                ClothesTown
              </span>
            </Link>
            <p className="mt-4 max-w-[290px] text-xs leading-6 text-[#b7c5ce]">
              Your one-stop shop for premium clothing for men and women. Quality,
              style and comfort — always.
            </p>
            <div className="mt-5 flex items-center gap-4">
              {socialLinks.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/90 transition-colors hover:text-[#9ec9e2]"
                >
                  <Icon size={17} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinks title="Quick Links" links={quickLinks} />
          <FooterLinks title="Customer Service" links={serviceLinks} />
          <FooterLinks title="Policies" links={policyLinks} />

          <div>
            <h3 className="mb-4 text-sm font-bold text-white sm:mb-5">Secure Payments</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white px-2 py-1 text-[11px] font-black italic text-[#17479e]">
                VISA
              </span>
              <span className="inline-flex items-center rounded bg-white px-2 py-1 text-[11px] font-black text-[#182a50]">
                <span className="mr-[-3px] text-[#e33a42]">●</span>
                <span className="text-[#f2a22b]">●</span>
              </span>
              <span className="rounded bg-white px-2 py-1 text-[9px] font-bold text-[#168f53]">
                easypaisa
              </span>
              <span className="rounded bg-white px-2 py-1 text-[9px] font-bold text-[#098b76]">
                JazzCash
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/20 pt-5 text-[11px] text-[#b7c5ce] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ClothesTown. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 transition-colors hover:text-white"
          >
            Back to top
            <ArrowUp size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
