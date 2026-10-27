import Link from "next/link";
import {
  ArrowRight,
  Grid2X2,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import CategoryImage from "@/app/components/category/CategoryImage";
import HeroBanner from "@/app/components/shop/HeroBanner";
import {
  CATEGORY_CATALOG,
  getCategoryHref,
} from "@/lib/category-catalog";

export const dynamic = "force-dynamic";
const categorySections = [
  { id: "men", title: "Men", routeGroup: "men", Icon: Shirt },
  { id: "women", title: "Women", routeGroup: "women", Icon: Shirt },
  { id: "girls", title: "Girls", routeGroup: "girls", Icon: Shirt },
  { id: "boys", title: "Boys", routeGroup: "boys", Icon: Shirt },
  {
    id: "accessories",
    title: "Accessories & Others",
    routeGroup: "accessories",
    Icon: ShoppingBag,
  },
] as const;

const browseLinks = [
  { label: "All Categories", href: "#category-list", Icon: Grid2X2 },
  { label: "Women", href: "#group-women", Icon: Shirt },
  { label: "Men", href: "#group-men", Icon: Shirt },
  { label: "Girls", href: "#group-girls", Icon: Shirt },
  { label: "Boys", href: "#group-boys", Icon: Shirt },
  { label: "Accessories", href: "#group-accessories", Icon: ShoppingBag },
  { label: "New Arrivals", href: "/new-arrivals", Icon: Sparkles },
  { label: "Sale", href: "/shop?sale=true", Icon: Tag },
] as const;

export default async function CategoriesPage() {
  await connectDB();

  const databaseCategories = await Category.find({
    status: true,
    slug: { $in: CATEGORY_CATALOG.map((category) => category.slug) },
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const categoriesBySlug = new Map(
    databaseCategories.map((category) => [category.slug, category])
  );
  const categories = CATEGORY_CATALOG.map((definition) => ({
    ...definition,
    ...categoriesBySlug.get(definition.slug),
    name: definition.name,
    slug: definition.slug,
  }));
  const heroImage =
    categories.find((category) => category.bannerImage)?.bannerImage ||
    categories.find((category) => category.image)?.image;

  return (
    <main className="min-h-screen bg-[var(--page-background)]">
      <HeroBanner
        name="All Categories"
        image={heroImage}
        imageAlt="Clothing and accessories from the ClothesTown collection"
        subtitle="Explore Our Collections"
        description="Find clothing and accessories for every member of the family."
        buttonText="Browse Categories"
        buttonLink="#category-list"
        imagePosition="right"
        priority
        className="!mb-0 !aspect-[1.7/1] !min-h-[200px] !max-h-[250px] sm:!aspect-[4.6/1] sm:!min-h-[190px] sm:!max-h-[320px]"
      />
      <section
        id="category-list"
        className="mx-auto max-w-[1440px] px-4 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:px-12"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#e7ded2] pb-4">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <Link href="/" className="transition-colors hover:text-[var(--brand-primary)]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-[var(--brand-primary)]">
                All Categories
              </span>
            </nav>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Browse {categories.length} categories across the ClothesTown collection.
            </p>
            </div>
          <span className="text-[11px] text-[var(--text-secondary)]">
            {categories.length} categories
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-3 text-xs font-semibold uppercase text-[var(--brand-primary)]">
              Browse
            </h2>
            <nav
              aria-label="Browse categories"
              className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1"
            >
              {browseLinks.map(({ label, href, Icon }, index) => (
                <Link
                  key={label}
                  href={href}
                  aria-current={index === 0 ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-md px-2.5 text-[11px] transition-colors duration-200 hover:bg-[var(--section-background)] hover:text-[var(--brand-primary)] sm:px-3 sm:text-xs ${
                    index === 0
                      ? "bg-[var(--section-background)] font-semibold text-[var(--brand-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-6 hidden border-t border-[#e7ded2] pt-5 lg:block">
              <p className="text-sm font-semibold text-[var(--brand-primary)]">
                New season, new style
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                Explore the latest arrivals from ClothesTown.
              </p>
              <Link
                href="/new-arrivals"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-secondary-foreground)]"
              >
                Shop new arrivals
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <div className="min-w-0 space-y-10 sm:space-y-12">
            {categorySections.map(({ id, title, routeGroup }) => {
              const groupCategories = categories.filter(
                (category) => category.routeGroup === routeGroup
              );

              if (!groupCategories.length) return null;

              return (
                <section key={id} id={`group-${id}`} className="scroll-mt-24">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-heading text-xl text-[var(--brand-primary)] sm:text-2xl">
                      {title}
                    </h2>
                    <span className="shrink-0 text-[10px] text-[var(--text-secondary)] sm:text-xs">
                      {groupCategories.length} categories
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                    {groupCategories.map((category) => (
                      <Link
                        key={category.slug}
                        href={getCategoryHref(category)}
                        className="group min-w-0 overflow-hidden rounded-md border border-[#e7ded2] bg-white transition duration-300 hover:-translate-y-0.5 hover:border-[#c18b65]/60 hover:shadow-[0_8px_24px_rgba(15,45,57,0.08)]"
                      >
                        <div className="relative aspect-[1.42/1] overflow-hidden bg-[var(--section-background)]">
                          <CategoryImage
                            src={category.image}
                            alt={category.name}
                            sizes="(max-width: 639px) 50vw, (max-width: 1279px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            fallbackClassName="text-xs text-[var(--text-secondary)]"
                          />
                        </div>
                        <div className="flex min-h-[60px] items-center justify-between gap-2 p-3 sm:min-h-[68px] sm:p-3.5">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-[var(--brand-primary)] sm:text-sm">
                              {category.name}
                            </h3>
                            <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                              Shop category
                            </p>
                          </div>
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-secondary)] text-white transition-transform duration-200 group-hover:translate-x-0.5 sm:size-8">
                            <ArrowRight size={14} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}