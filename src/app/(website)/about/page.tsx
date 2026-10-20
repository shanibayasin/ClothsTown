import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}

      <section className="relative h-125">

        <Image
          src="/images/about-banner.jpg"
          alt="About Veloraé"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex items-center justify-center">

          <div className="text-center text-white">

            <h1 className="text-5xl font-bold md:text-7xl">
              About Veloraé
            </h1>

            <p className="mt-6 text-lg md:text-xl">
              Timeless Elegance • Luxury Fashion • Premium Quality
            </p>

          </div>

        </div>

      </section>

      {/* Brand Story */}

      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="grid items-center gap-16 lg:grid-cols-2">

          <div>

            <h2 className="text-4xl font-bold text-primary">
              Our Story
            </h2>

            <p className="mt-8 leading-8 text-gray-600">
              Veloraé was created with a passion for timeless
              fashion and elegant modest wear. Every collection
              reflects luxury, comfort, and confidence for modern
              women who value premium craftsmanship.
            </p>

            <p className="mt-6 leading-8 text-gray-600">
              Our designs blend traditional elegance with modern
              trends to create outfits suitable for every special
              occasion and everyday sophistication.
            </p>

          </div>

          <div className="relative h-150 overflow-hidden rounded-3xl">

            <Image
              src="/images/about-story.jpg"
              alt="Our Story"
              fill
              className="object-cover"
            />

          </div>

        </div>

      </section>

      {/* Mission */}

      <section className="bg-[#faf7f8] py-24">

        <div className="mx-auto max-w-7xl px-6">

          <div className="grid gap-8 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-10 shadow">

              <h3 className="text-2xl font-bold text-primary">
                Our Mission
              </h3>

              <p className="mt-5 leading-8 text-gray-600">
                To provide premium modest fashion that combines
                elegance, comfort and quality for every woman.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-10 shadow">

              <h3 className="text-2xl font-bold text-primary">
                Our Vision
              </h3>

              <p className="mt-5 leading-8 text-gray-600">
                To become a trusted luxury fashion brand recognized
                worldwide for exceptional quality and timeless
                collections.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-10 shadow">

              <h3 className="text-2xl font-bold text-primary">
                Our Values
              </h3>

              <p className="mt-5 leading-8 text-gray-600">
                Premium fabrics, elegant craftsmanship, customer
                satisfaction and attention to every detail.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Why Choose Us */}

      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="text-center">

          <h2 className="text-4xl font-bold text-primary">
            Why Choose Veloraé
          </h2>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl border p-8 text-center">

            <h3 className="text-xl font-semibold">
              Premium Quality
            </h3>

            <p className="mt-4 text-gray-600">
              Carefully selected fabrics with luxury finishing.
            </p>

          </div>

          <div className="rounded-3xl border p-8 text-center">

            <h3 className="text-xl font-semibold">
              Elegant Designs
            </h3>

            <p className="mt-4 text-gray-600">
              Modern styles inspired by timeless fashion.
            </p>

          </div>

          <div className="rounded-3xl border p-8 text-center">

            <h3 className="text-xl font-semibold">
              Fast Delivery
            </h3>

            <p className="mt-4 text-gray-600">
              Reliable shipping with secure packaging.
            </p>

          </div>

          <div className="rounded-3xl border p-8 text-center">

            <h3 className="text-xl font-semibold">
              Customer Support
            </h3>

            <p className="mt-4 text-gray-600">
              Friendly support whenever you need assistance.
            </p>

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="bg-primary py-24">

        <div className="mx-auto max-w-4xl px-6 text-center text-white">

          <h2 className="text-4xl font-bold">
            Discover Our Latest Collection
          </h2>

          <p className="mt-6 text-lg">
            Explore premium fashion designed with elegance,
            sophistication and comfort.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-block rounded-xl bg-white px-10 py-4 font-semibold text-primary"
          >
            Shop Now
          </Link>

        </div>

      </section>
    </>
  );
}