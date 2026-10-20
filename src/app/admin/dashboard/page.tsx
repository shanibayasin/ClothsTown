"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import StatsCard from "../components/StatCard";
import SalesChart from "./SalesChart";
import OrderStatusChart from "./OrderStatusChart";
import WeeklySalesChart from "./WeekltySalesChart";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Wallet,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock 
} from "lucide-react";

interface Order {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  createdAt: string;
}

interface ProductItem {
  _id: string;
  name: string;
  price: number;
  stock: number;
  status: boolean;
  images: string[];
}

interface MonthlySales {
  _id: { month: number };
  revenue: number;
  orders: number;
}

interface WeeklySales {
  _id: { day: number };
  revenue: number;
  orders: number;
}

interface Activity {
  _id: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
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
  featuredProducts: ProductItem[];
  newArrivals: ProductItem[];
  topSellingProducts: any[];
  monthlySales: MonthlySales[];
  weeklySales: WeeklySales[];
  recentActivity: Activity[];
  analytics: Analytics | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
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
    featuredProducts: [],
    newArrivals: [],
    topSellingProducts: [],
    monthlySales: [],
    weeklySales: [],
    recentActivity: [],
    analytics: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to pull complete metrics payload");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Dashboard massive runtime extraction pipeline fault:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "delivered" || s === "paid") return "bg-green-100 text-green-800 font-medium";
    if (s === "pending" || s === "processing") return "bg-yellow-100 text-yellow-800 font-medium";
    return "bg-gray-100 text-gray-800 font-medium";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4b1532] tracking-tight font-heading">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-text/70 font-body">
            Welcome back, Administrator
          </p>
        </div>
        {!loading && (
          <div className="flex gap-4 rounded-2xl border bg-white p-4 shadow-sm text-sm font-body">
            <div>
              <p className="text-gray-400">Today's Revenue</p>
              <p className="font-bold text-[#4b1532]">Rs. {data.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-gray-400">Today's Orders</p>
              <p className="font-bold text-[#4b1532]">{data.todayOrders}</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-gray-400">MoM Growth</p>
              <p className={`font-bold ${data.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {data.revenueGrowth >= 0 ? "+" : ""}{data.revenueGrowth}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Counter Grid Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full items-stretch justify-items-stretch">
        <StatsCard title="Products" value={loading ? "..." : data.products.toLocaleString()} icon={<Package size={22} />} />
        <StatsCard title="Orders" value={loading ? "..." : data.orders.toLocaleString()} icon={<ShoppingCart size={22} />} />
        <StatsCard title="Customers" value={loading ? "..." : data.customers.toLocaleString()} icon={<Users size={22} />} />
        <StatsCard title="Total Revenue" value={loading ? "..." : `Rs. ${data.revenue.toLocaleString()}`} icon={<Wallet size={22} />} />
      </div>

      {/* Primary Monthly Analytics Linear Progression Chart */}
      <div className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#4b1532] font-heading">Monthly Revenue</h2>
          <p className="mt-2 text-sm text-gray-500 font-body">Revenue generated every month</p>
        </div>
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        ) : data.monthlySales.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-body">No monthly distribution history found.</div>
        ) : (
          <SalesChart data={data.monthlySales} />
        )}
      </div>

      {/* Secondary Graphs Layer Layout Wrapper */}
      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-[#4b1532] font-heading">Weekly Sales</h2>
          {loading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ) : (
            <WeeklySalesChart data={data.weeklySales} />
          )}
        </div>
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-[#4b1532] font-heading">Orders Overview</h2>
          {loading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ) : (
            <OrderStatusChart analytics={data.analytics ?? {
              pending: 0,
              processing: 0,
              shipped: 0,
              delivered: 0,
              cancelled: 0,
            }} />
          )}
        </div>
      </div>

      {/* Data Management Blocks Matrix Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
        {/* Recent Orders Section */}
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-2xl font-bold text-[#4b1532] font-heading">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600 text-sm font-body">
                    <th className="p-4 text-left font-semibold">Customer</th>
                    <th className="p-4 text-left font-semibold">Phone</th>
                    <th className="p-4 text-left font-semibold">Total</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700 font-body">
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400"><div className="space-y-2"><div className="h-4 bg-gray-100 rounded animate-pulse" /><div className="h-4 bg-gray-100 rounded animate-pulse" /></div></td></tr>
                  ) : data.recentOrders.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No orders registered.</td></tr>
                  ) : (
                    data.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50/55 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{order.customerName}</td>
                        <td className="p-4 text-gray-500">{order.phone}</td>
                        <td className="p-4 font-semibold text-gray-900">Rs. {(order.total ?? 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Latest Products Section */}
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-2xl font-bold text-[#4b1532] font-heading">Latest Products</h2>
              <Link href="/admin/products" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600 text-sm font-body">
                    <th className="p-4 text-left font-semibold">Product</th>
                    <th className="p-4 text-left font-semibold">Price</th>
                    <th className="p-4 text-left font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700 font-body">
                  {loading ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400"><div className="space-y-2"><div className="h-4 bg-gray-100 rounded animate-pulse" /><div className="h-4 bg-gray-100 rounded animate-pulse" /></div></td></tr>
                  ) : data.latestProducts.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">No products found.</td></tr>
                  ) : (
                    data.latestProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50/55 transition-colors">
                        <td className="flex items-center gap-4 p-4">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100">
                            <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} fill className="object-cover" />
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                        </td>
                        <td className="p-4 font-semibold text-gray-900">Rs. {(product.price ?? 0).toLocaleString()}</td>
                        <td className="p-4 text-gray-500 font-medium">{product.stock}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Operational Feeds Layer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
        {/* Low Stock Watchlist */}
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h2 className="text-2xl font-bold text-[#4b1532] font-heading">Low Stock Products</h2>
              <p className="mt-1 text-sm text-gray-500 font-body">Products that need restocking</p>
            </div>
            <Link href="/admin/products" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-102.5 overflow-y-auto">
            {loading ? (
              <div className="p-8"><div className="h-48 animate-pulse rounded-2xl bg-gray-50" /></div>
            ) : data.lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-body">No low stock products 🎉</div>
            ) : (
              data.lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-5 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100">
                      <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-body line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-red-500 font-medium mt-0.5">Critical Inventory Level</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 border border-red-100">
                    {product.stock} Left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time System Recent Activity Log */}
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold text-[#4b1532] font-heading">Recent Activity</h2>
            <p className="mt-1 text-sm text-gray-500 font-body">Latest activity on your store</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-102.5 overflow-y-auto">
            {loading ? (
              <div className="p-8"><div className="h-48 animate-pulse rounded-2xl bg-gray-50" /></div>
            ) : data.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-body">No activity log found.</div>
            ) : (
              data.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center gap-5 p-5 hover:bg-gray-50/40 transition-colors">
                  <div className="shrink-0">
                    {activity.status === "Pending" && <Clock className="text-yellow-500" size={24} />}
                    {activity.status === "Processing" && <ShoppingBag className="text-blue-500" size={24} />}
                    {activity.status === "Shipped" && <Truck className="text-purple-500" size={24} />}
                    {activity.status === "Delivered" && <CheckCircle className="text-green-500" size={24} />}
                    {activity.status === "Cancelled" && <XCircle className="text-red-500" size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 font-body truncate">{activity.customerName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">Order state: {activity.status}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 font-body">Rs. {(activity.total ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}