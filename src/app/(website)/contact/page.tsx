"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    alert("Message Sent Successfully!");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  }

  return (
    <>
      {/* Hero Section with Dynamic Background Image Asset Optimization */}
      <section className="relative overflow-hidden py-28 text-center text-white">
        {/* Background Image Layer */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/contact-hero.jpg" 
            alt="Contact Us Background Banner"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Opacity Tint Mask Matrix Overlay for Readability */}
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
            Contact Us
          </h1>
          <p className="font-body mt-5 text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            We'd love to hear from you. Get in touch with our team for premium assistance.
          </p>
        </div>
      </section>

      {/* Contact Operational Center Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">

          {/* Left Metadata Panel Matrix */}
          <div>
            <h2 className="font-heading text-4xl font-black text-primary tracking-tight">
              Get In Touch
            </h2>
            <p className="font-body mt-6 leading-8 text-gray-600">
              Have questions about our collections, customized orders,
              or secure transit delivery? Feel free to contact us anytime.
            </p>

            <div className="mt-12 space-y-8">
              <div className="flex gap-5 items-start">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">Address</h3>
                  <p className="font-body mt-1 text-gray-600">Lahore, Pakistan</p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">Phone</h3>
                  <p className="font-body mt-1 text-gray-600">+92 300 1234567</p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">Email</h3>
                  <p className="font-body mt-1 text-gray-600">support@velorae.com</p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">Working Hours</h3>
                  <p className="font-body mt-1 text-gray-600">Monday - Saturday</p>
                  <p className="font-body text-gray-500 text-sm mt-0.5">9:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Core Action Interface Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 shadow-xl shadow-gray-100/40"
          >
            <h2 className="font-heading mb-8 text-3xl font-bold text-primary tracking-tight">
              Send Message
            </h2>

            <div className="space-y-5 font-body">
              <input
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />

              <input
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />

              <textarea
                rows={5}
                placeholder="Write your message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                required
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-primary py-4 font-semibold text-white transition hover:bg-[#5a1738] shadow-md shadow-primary/20 dynamic-button active:scale-[0.99]"
              >
                Send Message
              </button>
            </div>
          </form>

        </div>
      </section>

      {/* Geolocational Map Frame Asset Layout */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
            <iframe
              src="https://www.google.com/maps?q=Lahore,Pakistan&output=embed"
              width="100%"
              height="485"
              loading="lazy"
              className="border-0 opacity-90 grayscale contrast-125 transition-all hover:grayscale-0 duration-500"
            />
          </div>
        </div>
      </section>
    </>
  );
}