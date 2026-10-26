import Link from "next/link";
import { ChevronRight } from "lucide-react";

const policies = [
  {
    id: "shipping",
    title: "Shipping & Handling",
    content: (
      <p>
        Delivery options, charges, and estimated timing are shown during
        checkout when available. For help with an existing shipment, visit{" "}
        <Link className="text-[var(--brand-primary)] underline" href="/track-order">
          Track Order
        </Link>{" "}
        or <Link className="text-[var(--brand-primary)] underline" href="/contact">contact us</Link>.
      </p>
    ),
  },
  {
    id: "exchange",
    title: "Exchange Policy",
    content: (
      <p>
        Please contact us with your order details to ask about an exchange.
        Eligibility and next steps depend on the item and order. See our{" "}
        <Link className="text-[var(--brand-primary)] underline" href="/contact">
          Contact Us
        </Link>{" "}
        page for support.
      </p>
    ),
  },
  {
    id: "cancellation",
    title: "Order Cancellation Policy",
    content: (
      <p>
        If you need to cancel an order, contact us as soon as possible and
        include your order ID. We will confirm whether cancellation is still
        possible based on the order&apos;s status.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: (
      <p>
        Information you provide is used to support your shopping experience and
        respond to your requests. For questions about your personal
        information, please <Link className="text-[var(--brand-primary)] underline" href="/contact">contact us</Link>.
      </p>
    ),
  },
  {
    id: "terms",
    title: "Terms Of Use",
    content: (
      <p>
        By using this site, you agree to provide accurate information and use
        the store lawfully. Product availability, pricing, and order details
        are presented during shopping and checkout. Please{" "}
        <Link className="text-[var(--brand-primary)] underline" href="/contact">contact us</Link>{" "}
        if you have a question.
      </p>
    ),
  },
];

export default function PoliciesPage() {
  return (
    <main className="min-h-[70vh] bg-white text-[#111]">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-[11px] text-[var(--brand-primary)] sm:px-6"
      >
        <Link href="/" className="hover:underline">Home</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="font-medium">Policies</span>
      </nav>

      <section className="mx-auto max-w-[1125px] px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <h1 className="bg-[#f1f1f1] px-4 py-1 text-center text-lg font-semibold">
          POLICIES
        </h1>

        <div className="mx-auto mt-3 max-w-[900px] space-y-3">
          {policies.map((policy) => (
            <details key={policy.id} id={policy.id} className="group">
              <summary className="flex min-h-[35px] cursor-pointer list-none items-stretch bg-[#e9e9e9] text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex flex-1 items-center px-3 py-2">
                  {policy.title}
                </span>
                <span
                  aria-hidden="true"
                  className="flex w-9 shrink-0 items-center justify-center bg-black text-xl font-normal text-white transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border border-t-0 border-[#e5e5e5] px-4 py-3 text-xs leading-5 text-[#62575b]">
                {policy.content}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
