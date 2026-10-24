
"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";

const contactDetails = [
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our location",
    value: "Lahore, Pakistan",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "We're happy to help",
    value: "+92 300 1234567",
    href: "tel:+923001234567",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Send us your queries",
    value: "support@clothstown.com",
    href: "mailto:support@clothstown.com",
  },
  {
    icon: Clock,
    title: "Working Hours",
    description: "Customer support",
    value: "Mon – Sat, 9 AM – 7 PM",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Connect this form to your existing contact API/email service.
    // Do not show success until the message is actually delivered.
    setSubmitted(false);
  }

  return (
    <main className="min-h-screen bg-[#FFFCF8] text-[#252126]">
      {/* Full-width fashion hero */}
      <section className="relative isolate flex min-h-[300px] items-center overflow-hidden sm:min-h-[360px] lg:min-h-[420px]">
        <Image
          src="/images/contact-hero.jpg"
          alt="Clothstown fashion collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#351722]/80 via-[#4A1F32]/45 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#F7E9ED]">
            CLOTHSTOWN · WE'RE HERE FOR YOU
          </p>

          <h1 className="max-w-2xl font-heading text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-7xl">
            Let's start a
            <span className="block italic text-[#F7DCE5]">
              conversation.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/90 sm:text-base">
            Questions about an order, our latest collections, or sizing?
            We'd love to help you find exactly what you're looking for.
          </p>

          <a
            href="#contact-form"
            className="mt-8 inline-flex items-center gap-3 border border-white/70 bg-white px-6 py-3.5 text-sm font-semibold text-[#4A1F32] transition hover:bg-[#F7E9ED]"
          >
            Get in touch <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-7xl px-5 py-5 text-sm text-[#777078] sm:px-8 lg:px-12"
      >
        <a href="/" className="transition hover:text-[#722F4A]">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#722F4A]">Contact Us</span>
      </nav>

      {/* Contact information */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-12 lg:pb-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#722F4A]">
            PERSONAL SERVICE, ALWAYS
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium sm:text-4xl">
            We're just a message away.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#777078] sm:text-base">
            Our team is here to make your Clothstown shopping experience
            simple, comfortable, and special.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactDetails.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group border border-[#EAE3E6] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#D8B6C3] hover:shadow-lg hover:shadow-[#722F4A]/5"
              >
                <div className="flex size-12 items-center justify-center bg-[#F7E9ED] text-[#722F4A] transition group-hover:bg-[#722F4A] group-hover:text-white">
                  <Icon size={22} strokeWidth={1.6} />
                </div>

                <h3 className="mt-5 font-heading text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm text-[#777078]">
                  {item.description}
                </p>

                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-3 inline-block break-words text-sm font-medium text-[#722F4A] hover:underline"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-3 text-sm font-medium">{item.value}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Message form */}
      <section
        id="contact-form"
        className="border-y border-[#EAE3E6] bg-[#F7E9ED]/45"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#722F4A]">
              WE'D LOVE TO HEAR FROM YOU
            </p>

            <h2 className="mt-4 font-heading text-4xl font-medium leading-tight sm:text-5xl">
              How can we
              <span className="block italic text-[#722F4A]">help you?</span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-[#777078] sm:text-base">
              Send us a message about orders, delivery, product availability,
              sizing, returns, or anything else. Our team will be happy to
              assist.
            </p>

            <div className="mt-8 flex items-start gap-4 border-t border-[#E5D2D9] pt-6">
              <div className="flex size-11 shrink-0 items-center justify-center bg-white text-[#722F4A]">
                <MessageCircle size={21} />
              </div>
              <div>
                <h3 className="font-semibold">A little help goes a long way</h3>
                <p className="mt-1 text-sm leading-6 text-[#777078]">
                  Please include your order number if your question concerns
                  an existing order.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-[#EAE3E6] bg-white p-6 shadow-sm sm:p-9 lg:p-10"
          >
            <h3 className="font-heading text-2xl font-medium sm:text-3xl">
              Send us a message
            </h3>
            <p className="mt-2 text-sm text-[#777078]">
              Fill in the details below and we'll be in touch.
            </p>

            {submitted && (
              <div
                role="status"
                className="mt-6 flex items-center gap-3 bg-[#F0F7F0] p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={20} />
                Your message has been submitted successfully.
              </div>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                  className="w-full border border-[#EAE3E6] bg-[#FFFCF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A49AA0] focus:border-[#722F4A] focus:ring-2 focus:ring-[#722F4A]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="w-full border border-[#EAE3E6] bg-[#FFFCF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A49AA0] focus:border-[#722F4A] focus:ring-2 focus:ring-[#722F4A]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block text-sm font-medium"
                >
                  Subject *
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="What can we help you with?"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  required
                  className="w-full border border-[#EAE3E6] bg-[#FFFCF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A49AA0] focus:border-[#722F4A] focus:ring-2 focus:ring-[#722F4A]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-medium"
                >
                  Your message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  required
                  className="w-full resize-y border border-[#EAE3E6] bg-[#FFFCF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A49AA0] focus:border-[#722F4A] focus:ring-2 focus:ring-[#722F4A]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 bg-[#722F4A] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#4A1F32] focus:outline-none focus:ring-2 focus:ring-[#722F4A] focus:ring-offset-2 sm:w-auto sm:min-w-52"
            >
              Send Message <ArrowRight size={17} />
            </button>

            <p className="mt-4 text-xs leading-5 text-[#777078]">
              Your details should only be used to respond to your enquiry.
            </p>
          </form>
        </div>
      </section>

      {/* Location map */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#722F4A]">
              FIND US
            </p>
            <h2 className="mt-3 font-heading text-3xl font-medium sm:text-4xl">
              Our location
            </h2>
            <p className="mt-3 text-sm text-[#777078]">
              Lahore, Pakistan
            </p>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Lahore%2C+Pakistan"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#722F4A] hover:underline sm:self-auto"
          >
            Open in Google Maps <ArrowRight size={16} />
          </a>
        </div>

        <div className="relative h-[300px] overflow-hidden border border-[#EAE3E6] sm:h-[400px] lg:h-[460px]">
          <iframe
            title="Clothstown location in Lahore"
            src="https://www.google.com/maps?q=Lahore,Pakistan&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 border-0"
          />
        </div>
      </section>

      {/* Brand closing strip */}
      <section className="border-t border-[#EAE3E6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-8 lg:px-12">
          <div>
            <p className="font-heading text-xl font-semibold text-[#722F4A]">
              ClothesTown
            </p>
            <p className="mt-1 text-sm text-[#777078]">
              Style for every you.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              aria-label="ClothesTown home"
              className="text-sm text-[#777078] transition hover:text-[#722F4A]"
            >
              Continue Shopping
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex size-10 items-center justify-center border border-[#EAE3E6] text-[#722F4A] hover:bg-[#F7E9ED]"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex size-10 items-center justify-center border border-[#EAE3E6] text-[#722F4A] hover:bg-[#F7E9ED]"
            >
              <FaFacebookF size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
