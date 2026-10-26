"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductImage from "@/app/components/product/ProductImage";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  ImagePlus,
  Package,
  Plus,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import StatsCard from "../components/StatCard";
import SalesChart from "./SalesChart";
import OrderStatusChart from "./OrderStatusChart";

interface OrderProduct {
  name: string;
  image?: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  createdAt: string;
  products?: OrderProduct[];
}

interface ProductItem {
  _id: string;
  name: string;
  price: number;
  stock: number;
  status: boolean;
  images: string[];
}

interface DailySale {
  _id: string;
  revenue: number;
  orders: number;
}

interface ActivityItem {
  _id: string;
  type: string;
  title: string;
  description: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

interface TopSellingProduct {
  _id: string | null;
  name: string;
  image?: string;
  totalSold: number;
  revenue: number;
}

interface Analytics {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface DashboardData {
  products: number;
  orders: number;
  customers: number;
  revenue: number;
  todayRevenue: number;
  todayOrders: number;
  revenueGrowth: number;
  recentOrders: Order[];
  latestProducts: ProductItem[];
  lowStockProducts: ProductItem[];
  lowStockCount: number;
  topSellingProducts: TopSellingProduct[];
  dailySales: DailySale[];
  recentActivity: ActivityItem[];
  analytics: Analytics | null;
}

const emptyAnalytics: Analytics = {
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
};

const initialData: DashboardData = {
  products: 0,
  orders: 0,
  customers: 0,
  revenue: 0,
  todayRevenue: 0,
  todayOrders: 0,
  revenueGrowth: 0,
  recentOrders: [],
  latestProducts: [],
  lowStockProducts: [],
  lowStockCount: 0,
  topSellingProducts: [],
  dailySales: [],
  recentActivity: [],
  analytics: emptyAnalytics,
};

function getLastSevenDays(sales: DailySale[]) {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const cursor = new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day))
  );
  const salesByDate = new Map(sales.map((sale) => [sale._id, sale.revenue]));

  cursor.setUTCDate(cursor.getUTCDate() - 6);

  return Array.from({ length: 7 }, () => {
    const key = cursor.toISOString().slice(0, 10);
    const date = new Intl.DateTimeFormat("en-PK", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(cursor);
    const entry = { date, revenue: salesByDate.get(key) ?? 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return entry;
  });
}

function formatTimeAgo(value: string) {
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function statusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return Clock;
    case "processing":
      return ShoppingBag;
    case "shipped":
      return Truck;
    case "delivered":
      return CheckCircle;
    case "cancelled":
      return XCircle;
    default:
      return Activity;
  }
}

function statusClass() {
  return "rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[10px] font-medium capitalize text-neutral-700";
}

function PanelHeading({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5">
      <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-neutral-500 transition-colors hover:text-black"
      >
        View All
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

const quickActions = [
  {
    title: "Add New Product",
    href: "/admin/products",
    icon: Plus,
    detail: "Create a product listing",
  },
  {
    title: "Manage Banners",
    href: "/admin/banners",
    icon: ImagePlus,
    detail: "Update homepage slides",
  },
  {
    title: "View Orders",
    href: "/admin/orders",
    icon: ClipboardList,
    detail: "Review customer orders",
  },
  {
    title: "Store Settings",
    href: "/admin/settings",
    icon: Settings2,
    detail: "Manage store preferences",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Welcome back, Admin!");

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard data.");
        const result = (await res.json()) as DashboardData;
        if (active) {
          const now = new Date();
          const date = new Intl.DateTimeFormat("en-PK", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Karachi",
          }).format(now);
          const hour = Number(
            new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              hourCycle: "h23",
              timeZone: "Asia/Karachi",
            }).format(now)
          );
          setDateLabel(date);
          setGreeting(
            `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, Admin!`
          );
          setData({ ...initialData, ...result });
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const salesChartData = useMemo(
    () => getLastSevenDays(data.dailySales),
    [data.dailySales]
  );

  const stats = [
    {
      title: "Total Orders",
      value: loading ? "..." : data.orders.toLocaleString(),
      detail: `${loading ? "..." : data.todayOrders.toLocaleString()} placed today`,
      icon: <ShoppingCart size={18} />,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Total Revenue",
      value: loading ? "..." : `Rs. ${data.revenue.toLocaleString()}`,
      detail: `${loading ? "..." : `${data.revenueGrowth >= 0 ? "+" : ""}${data.revenueGrowth}%`} this month`,
      icon: <Wallet size={18} />,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Total Customers",
      value: loading ? "..." : data.customers.toLocaleString(),
      detail: "Unique store customers",
      icon: <Users size={18} />,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Total Products",
      value: loading ? "..." : data.products.toLocaleString(),
      detail: "Active listings",
      icon: <Package size={18} />,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Low Stock Items",
      value: loading ? "..." : data.lowStockCount.toLocaleString(),
      detail: loading
        ? "Checking inventory..."
        : data.lowStockCount > 0
          ? "Restock recommended"
          : "Stock levels look good",
      icon: <AlertTriangle size={18} />,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl bg-[var(--brand-primary)] px-5 py-6 text-white shadow-sm sm:px-7 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 size-72 rounded-full bg-slate-400/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-1/3 size-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              ClothesTown · Store overview
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs text-slate-200 backdrop-blur-sm">
              <CalendarDays size={15} aria-hidden="true" />
              <span>Today</span>
              <span className="font-semibold text-white">{dateLabel || "..."}</span>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-slate-100"
            >
              <Plus size={15} aria-hidden="true" />
              Add product
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 px-3.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <Store size={15} aria-hidden="true" />
              View store
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Store statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            detail={stat.detail}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </section>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
              <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
                <h2 className="text-sm font-bold text-neutral-900">Sales Overview</h2>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Total sales for the last 7 days
                </p>
              </div>
              <div className="px-2 py-3 sm:px-4">
                {loading ? (
                  <div className="h-[250px] animate-pulse rounded-lg bg-neutral-100 sm:h-[290px]" />
                ) : (
                  <SalesChart data={salesChartData} />
                )}
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
              <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
                <h2 className="text-sm font-bold text-neutral-900">Order Status</h2>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Current order distribution
                </p>
              </div>
              <div className="p-3 sm:p-4">
                {loading ? (
                  <div className="h-[210px] animate-pulse rounded-lg bg-neutral-100" />
                ) : (
                  <OrderStatusChart analytics={data.analytics ?? emptyAnalytics} />
                )}
              </div>
            </section>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
              <PanelHeading title="Latest Products" href="/admin/products" />
              <div className="divide-y divide-neutral-100">
                {loading ? (
                  <p className="p-5 text-center text-xs text-neutral-400">Loading products...</p>
                ) : data.latestProducts.length ? (
                  data.latestProducts.slice(0, 5).map((product) => (
                    <div key={product._id} className="flex min-w-0 items-center gap-3 px-4 py-2.5">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                        <ProductImage
                          src={product.images?.[0]}
                          alt={product.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-700">
                        {product.name}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-neutral-900">
                        Rs. {(product.price ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-5 text-center text-xs text-neutral-500">No products found.</p>
                )}
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
              <PanelHeading title="Low Stock Products" href="/admin/products" />
              <div className="divide-y divide-neutral-100">
                {loading ? (
                  <p className="p-5 text-center text-xs text-neutral-400">Loading stock...</p>
                ) : data.lowStockProducts.length ? (
                  data.lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                          <ProductImage
                            src={product.images?.[0]}
                            alt={product.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <span className="truncate text-[11px] text-neutral-700">{product.name}</span>
                      </div>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-700">
                        {product.stock} left
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-5 text-center text-xs text-neutral-500">No low stock products.</p>
                )}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
            <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
              <h2 className="text-sm font-bold text-neutral-900">Recent Activity</h2>
              <p className="mt-1 text-[11px] text-neutral-500">Latest activity on your store</p>
            </div>
            {loading ? (
              <p className="p-5 text-center text-xs text-neutral-400">Loading activity...</p>
            ) : data.recentActivity.length ? (
              <div className="grid divide-y divide-neutral-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {data.recentActivity.slice(0, 6).map((activity) => {
                  const Icon = statusIcon(activity.status);
                  return (
                    <div key={`${activity.type}-${activity._id}`} className="flex min-w-0 items-center gap-3 px-4 py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-neutral-800">
                          {activity.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-neutral-500">
                          {activity.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-neutral-400">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="p-5 text-center text-xs text-neutral-500">No recent activity.</p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
            <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
              <h2 className="text-sm font-bold text-neutral-900">Quick Actions</h2>
              <p className="mt-1 text-[11px] text-neutral-500">Common store tasks</p>
            </div>
            <div className="space-y-2 p-3">
              {quickActions.map(({ title, href, icon: Icon, detail }, index) => (
                <Link
                  key={title}
                  href={href}
                  className={`group flex min-h-[58px] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    index === 0
                      ? "bg-[var(--section-background)] hover:bg-[var(--section-background)]"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      index === 0
                        ? "bg-white [color:var(--brand-primary)]"
                        : "bg-white text-[var(--brand-primary)]"
                    }`}
                  >
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-800">{title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-500">{detail}</span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>

          <section className="relative isolate overflow-hidden rounded-2xl bg-[var(--brand-primary)] p-5 text-white shadow-sm">
            <div aria-hidden="true" className="absolute -right-8 -top-10 size-32 rounded-full [background-color:var(--brand-primary)] opacity-60 blur-2xl" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">ClothesTown</p>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-white">Style Meets Comfort</h2>
              <p className="mt-1 text-xs text-slate-300">More styles, more you.</p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                Visit storefront
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
            <PanelHeading title="Recent Orders" href="/admin/orders" />
            <div className="divide-y divide-neutral-100">
              {loading ? (
                <p className="p-5 text-center text-xs text-neutral-400">Loading orders...</p>
              ) : data.recentOrders.length ? (
                data.recentOrders.slice(0, 5).map((order) => {
                  const image = order.products?.[0]?.image;
                  return (
                    <Link
                      key={order._id}
                      href="/admin/orders"
                      className="flex items-center gap-2.5 px-3 py-3 transition-colors hover:bg-neutral-50"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                        {image ? (
                          <ProductImage src={image} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-neutral-400">
                            <ShoppingBag size={16} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-neutral-800">
                          #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-[10px] text-neutral-500">
                          Rs. {(order.total ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={statusClass()}>{order.status}</span>
                        <span className="text-[9px] text-neutral-400">
                          {formatTimeAgo(order.createdAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="p-5 text-center text-xs text-neutral-500">No orders yet.</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <PanelHeading title="Top Selling Products" href="/admin/products" />
            {loading ? (
              <p className="p-5 text-center text-xs text-neutral-400">Loading products...</p>
            ) : data.topSellingProducts.length ? (
              <div className="divide-y divide-neutral-100">
                {data.topSellingProducts.slice(0, 5).map((product, index) => (
                  <div key={`${product._id ?? product.name}-${index}`} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="w-4 shrink-0 text-[10px] font-semibold text-neutral-400">
                      {index + 1}
                    </span>
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                      {product.image ? (
                        <ProductImage
                          src={product.image}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-neutral-400">
                          <Package size={14} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-700">
                      {product.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-neutral-500">
                      {product.totalSold}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-5 text-center text-xs text-neutral-500">No sales data yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_rgba(15,23,42,0.035)]">
            <h2 className="text-xs font-semibold text-neutral-800">Today&apos;s Summary</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-neutral-500">Revenue</p>
                <p className="mt-1 text-sm font-bold text-neutral-900">
                  Rs. {loading ? "..." : data.todayRevenue.toLocaleString()}
                </p>
              </div>
              <div className="border-l border-neutral-200 pl-3">
                <p className="text-[10px] text-neutral-500">Orders</p>
                <p className="mt-1 text-sm font-bold text-neutral-900">
                  {loading ? "..." : data.todayOrders.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-neutral-100 pt-3 text-[10px] text-neutral-500">
              Monthly revenue growth{" "}
              <span className="font-semibold text-neutral-800">
                {loading ? "..." : `${data.revenueGrowth >= 0 ? "+" : ""}${data.revenueGrowth}%`}
              </span>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
