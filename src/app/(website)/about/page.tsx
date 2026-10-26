import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-[70vh] bg-white text-[#171717]">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-[11px] text-[var(--brand-primary)] sm:px-6"
      >
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="font-medium">About Us</span>
      </nav>

      <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 sm:px-8 sm:pt-36">
        <h1 className="border-b border-[#e5e5e5] pb-4 text-center text-lg font-semibold">
          About Us
        </h1>

        <div className="space-y-5 pt-20 text-xs leading-6 text-[#40383b] sm:pt-24 sm:text-sm">
          <p>
            Clothstown brings together thoughtfully selected fashion for
            everyday wear and special occasions, with a focus on comfort, style,
            and quality.
          </p>
          <p>
            Explore clothing and accessories for women, men, and children, and
            find pieces that suit your personal style.
          </p>
        </div>
      </section>
    </main>
  );
}
