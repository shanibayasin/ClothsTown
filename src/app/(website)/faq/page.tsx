import Link from "next/link";
import { ChevronRight } from "lucide-react";

const faqSections = [
  {
    title: "MY ACCOUNT",
    questions: [
      {
        question: "How do I create an account?",
        answer: (
          <>
            Visit the <Link className="text-[#6f1d46] underline" href="/register">Register</Link> page
            and enter your details to create an account.
          </>
        ),
      },
      {
        question: "I need help with my account.",
        answer: (
          <>
            Contact us through the <Link className="text-[#6f1d46] underline" href="/contact">Contact Us</Link> page
            and include the email address associated with your account.
          </>
        ),
      },
    ],
  },
  {
    title: "ORDER",
    questions: [
      {
        question: "How can I check my order status?",
        answer: (
          <>
            Use the <Link className="text-[#6f1d46] underline" href="/track-order">Track Order</Link> page
            and enter your order ID.
          </>
        ),
      },
      {
        question: "I have a question about an order.",
        answer: (
          <>
            Send us a message from the <Link className="text-[#6f1d46] underline" href="/contact">Contact Us</Link> page
            and include your order ID.
          </>
        ),
      },
    ],
  },
  {
    title: "PAYMENT",
    questions: [
      {
        question: "Where can I see the payment options?",
        answer: "Available payment options are shown during checkout before you place your order.",
      },
    ],
  },
  {
    title: "DELIVERY",
    questions: [
      {
        question: "Where can I find delivery information for my order?",
        answer: (
          <>
            Check your order status on the <Link className="text-[#6f1d46] underline" href="/track-order">Track Order</Link> page.
            For further help, please <Link className="text-[#6f1d46] underline" href="/contact">contact us</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: "SECURITY",
    questions: [
      {
        question: "How can I get help with account or checkout security?",
        answer: (
          <>
            Please <Link className="text-[#6f1d46] underline" href="/contact">contact our team</Link> if
            you notice an issue with your account or checkout.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-[70vh] bg-white text-[#111]">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-[11px] text-[#6f1d46] sm:px-6"
      >
        <Link href="/" className="hover:underline">Home</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="font-medium">FAQ&apos;s</span>
      </nav>

      <section className="mx-auto max-w-[1125px] px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <h1 className="bg-[#f1f1f1] px-4 py-1 text-center text-lg font-semibold">
          FAQS
        </h1>

        <div className="mx-auto mt-3 max-w-[900px] space-y-3">
          {faqSections.map((section) => (
            <details key={section.title} className="group">
              <summary className="flex min-h-[35px] cursor-pointer list-none items-stretch bg-[#e9e9e9] text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex flex-1 items-center px-3 py-2">
                  {section.title}
                </span>
                <span
                  aria-hidden="true"
                  className="flex w-9 shrink-0 items-center justify-center bg-black text-xl font-normal text-white transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <div className="divide-y divide-[#e5e5e5] border border-t-0 border-[#e5e5e5] px-4">
                {section.questions.map((item) => (
                  <details key={item.question} className="group/question">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-xs font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="text-base font-normal text-[#6f1d46] transition-transform group-open/question:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="pb-4 text-xs leading-5 text-[#62575b]">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
