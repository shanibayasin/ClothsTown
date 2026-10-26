"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

interface CustomerOrder {
  customerName: string;
  email: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  createdAt: string;
}

interface CustomerSummary {
  key: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export default function CustomersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const data: unknown = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error("Customer order history could not be loaded.");
        }
        if (active) setOrders(data as CustomerOrder[]);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Customer order history could not be loaded."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCustomers();
    return () => {
      active = false;
    };
  }, []);

  const customers = useMemo(() => {
    const grouped = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const email = order.email?.trim().toLowerCase() ?? "";
      const phone = order.phone?.trim() ?? "";
      const key = email || phone;
      if (!key) continue;

      const customer = grouped.get(key) ?? {
        key,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        city: order.city,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt,
      };
      customer.orderCount += 1;
      if (order.status.toLowerCase() !== "cancelled") {
        customer.totalSpent += Number.isFinite(order.total) ? order.total : 0;
      }
      if (new Date(order.createdAt).getTime() > new Date(customer.lastOrderAt).getTime()) {
        customer.lastOrderAt = order.createdAt;
        customer.customerName = order.customerName;
        customer.phone = order.phone;
        customer.city = order.city;
      }
      grouped.set(key, customer);
    }

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(right.lastOrderAt).getTime() - new Date(left.lastOrderAt).getTime()
    );
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.customerName, customer.email, customer.phone, customer.city]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, search]);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Guest customer records from completed checkouts</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">Customers</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">
          <Users size={16} aria-hidden="true" />
          {customers.length} customers
        </div>
      </header>

      <label className="flex h-10 max-w-md items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-400 focus-within:border-neutral-500">
        <Search size={15} aria-hidden="true" />
        <span className="sr-only">Search customers</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, phone, or city"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
      </label>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Total spend</th>
              <th className="px-4 py-3 font-semibold">Last order</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">Loading customers...</td></tr>
            ) : filteredCustomers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">{search ? "No customers match this search." : "No customer orders yet."}</td></tr>
            ) : filteredCustomers.map((customer) => (
              <tr key={customer.key} className="border-t border-neutral-100 text-neutral-700">
                <td className="px-4 py-3">
                  <p className="font-semibold text-neutral-900">{customer.customerName}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{customer.email}</p>
                </td>
                <td className="px-4 py-3">{customer.phone}</td>
                <td className="px-4 py-3">{customer.city}</td>
                <td className="px-4 py-3">{customer.orderCount}</td>
                <td className="px-4 py-3 font-medium">Rs. {customer.totalSpent.toLocaleString()}</td>
                <td className="px-4 py-3">{new Date(customer.lastOrderAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
