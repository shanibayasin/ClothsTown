"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

// React Icons already imported layout
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#111111] text-white">

      {/* Top */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Image
              src="/logo.png"
              alt="Veloraé"
              width={220}
              height={70}
              className="mb-6 h-16 w-auto"
            />

            <p className="leading-8 text-gray-400">
              Discover premium modest fashion crafted with
              elegance, luxury and timeless style. Every
              collection is designed to make you feel confident
              and beautiful.
            </p>

            {/* FIXED: Replaced standard names with the correctly imported react-icons tags */}
            <div className="mt-8 flex gap-4">
              <a
                href="#"
                className="rounded-full bg-[#222] p-3 transition hover:bg-[#6f1d46]"
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="#"
                className="rounded-full bg-[#222] p-3 transition hover:bg-[#6f1d46]"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="#"
                className="rounded-full bg-[#222] p-3 transition hover:bg-[#6f1d46]"
              >
                <FaXTwitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-xl font-semibold">
              Quick Links
            </h3>
            <div className="space-y-4 text-gray-400">
              <Link href="/" className="block hover:text-white">Home</Link>
              <Link href="/shop" className="block hover:text-white">Shop</Link>
              <Link href="/collections" className="block hover:text-white">Collections</Link>
              <Link href="/new-arrivals" className="block hover:text-white">New Arrivals</Link>
              <Link href="/about" className="block hover:text-white">About Us</Link>
              <Link href="/contact" className="block hover:text-white">Contact</Link>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="mb-6 text-xl font-semibold">
              Customer Care
            </h3>
            <div className="space-y-4 text-gray-400">
              <Link href="/cart" className="block hover:text-white">Shopping Cart</Link>
              <Link href="/checkout" className="block hover:text-white">Checkout</Link>
              <Link href="/orders" className="block hover:text-white">My Orders</Link>
              <Link href="/privacy-policy" className="block hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="block hover:text-white">Terms & Conditions</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-xl font-semibold">
              Contact
            </h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <MapPin className="mt-1 text-[#d4af37]" size={18} />
                <p className="text-gray-400">Lahore, Pakistan</p>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-1 text-[#d4af37]" size={18} />
                <p className="text-gray-400">+92 300 1234567</p>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-1 text-[#d4af37]" size={18} />
                <p className="text-gray-400">support@velorae.com</p>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <h4 className="mb-4 font-semibold">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full rounded-l-xl bg-[#222] px-4 py-3 text-white outline-none"
                />
                <button className="rounded-r-xl bg-[#6f1d46] px-5 hover:bg-[#5a1738]">
                  <Send size={18} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Veloraé. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Support</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}