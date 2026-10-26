import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getActiveProductFilter,
  getFeaturedProductFilter,
  getNewArrivalProductFilter,
} from "@/lib/products";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectDB();

    // ============================
    // COUNTS
    // ============================
    const totalProducts = await Product.countDocuments(getActiveProductFilter());
    const totalOrders = await Order.countDocuments();
    const customers = await Order.distinct("email");
    const completedOrderFilter = { status: { $ne: "Cancelled" } };

    // ============================
    // TOTAL REVENUE
    // ============================
    const revenueData = await Order.aggregate([
      { $match: completedOrderFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // ============================
    // TODAY
    // ============================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      ...completedOrderFilter,
      createdAt: { $gte: today },
    });

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const todayOrderCount = todayOrders.length;

    // ============================
    // CURRENT MONTH
    // ============================
    const startCurrentMonth = new Date();
    startCurrentMonth.setDate(1);
    startCurrentMonth.setHours(0, 0, 0, 0);

    const currentMonthOrders = await Order.find({
      ...completedOrderFilter,
      createdAt: { $gte: startCurrentMonth },
    });

    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    // ============================
    // LAST MONTH
    // ============================
    const startLastMonth = new Date(startCurrentMonth);
    startLastMonth.setMonth(startLastMonth.getMonth() - 1);

    const lastMonthOrders = await Order.find({
      ...completedOrderFilter,
      createdAt: {
        $gte: startLastMonth,
        $lt: startCurrentMonth,
      },
    });

    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    // ============================
    // GROWTH
    // ============================
    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : Number(
            (
              ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
              100
            ).toFixed(1)
          );

    // ============================
    // MONTHLY SALES
    // ============================
    const monthlySales = await Order.aggregate([
      { $match: completedOrderFilter },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // ============================
    // WEEKLY SALES
    // ============================
    const weeklySales = await Order.aggregate([
      {
        $match: {
          ...completedOrderFilter,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfWeek: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.day": 1 },
      },
    ]);

    const karachiDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());
    const karachiDate = Object.fromEntries(
      karachiDateParts.map(({ type, value }) => [type, value])
    );
    const startOfLastSevenDays = new Date(
      Date.UTC(
        Number(karachiDate.year),
        Number(karachiDate.month) - 1,
        Number(karachiDate.day),
        -5
      )
    );
    startOfLastSevenDays.setUTCDate(startOfLastSevenDays.getUTCDate() - 6);

    const dailySales = await Order.aggregate([
      {
        $match: {
          ...completedOrderFilter,
          createdAt: { $gte: startOfLastSevenDays },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Karachi",
            },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ============================
    // ORDER STATUS ANALYTICS
    // ============================
    const analytics = {
      pending: await Order.countDocuments({ status: "Pending" }),
      processing: await Order.countDocuments({ status: "Processing" }),
      shipped: await Order.countDocuments({ status: "Shipped" }),
      delivered: await Order.countDocuments({ status: "Delivered" }),
      cancelled: await Order.countDocuments({ status: "Cancelled" }),
    };

    // ============================
    // RECENT ORDERS
    // ============================
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("customerName email phone city total status createdAt products");

    // ============================
    // LATEST PRODUCTS
    // ============================
    const latestProducts = await Product.find({ status: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name slug images price discountPrice stock featured newArrival createdAt");

    // ============================
    // FEATURED PRODUCTS
    // ============================
    const featuredProducts = await Product.find(
      getActiveProductFilter(getFeaturedProductFilter())
    )
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name slug images price stock");

    // ============================
    // NEW ARRIVALS
    // ============================
    const newArrivals = await Product.find(
      getActiveProductFilter(getNewArrivalProductFilter())
    )
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name slug images price stock");

    // ============================
    // LOW STOCK PRODUCTS
    // ============================
    const lowStockProducts = await Product.find({
      status: true,
      stock: { $lte: 5 },
    })
      .sort({ stock: 1 })
      .limit(10)
      .select("name slug images stock price");
    const lowStockCount = await Product.countDocuments({
      status: true,
      stock: { $lte: 5 },
    });

    // ============================
    // TOP SELLING PRODUCTS
    // ============================
    const topSellingProducts = await Order.aggregate([
      { $match: completedOrderFilter },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          name: { $first: "$products.name" },
          image: { $first: "$products.image" },
          totalSold: { $sum: "$products.quantity" },
          revenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // ============================
    // RECENT ACTIVITY
    // ============================
    const recentActivity = [
      ...recentOrders.map((order) => ({
        _id: order._id,
        type: "order",
        customerName: order.customerName,
        title: `New order from ${order.customerName}`,
        description: `Rs. ${order.total}`,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      })),
      ...latestProducts.map((product) => ({
        _id: product._id,
        type: "product",
        customerName: "System",
        title: `Product Added`,
        description: product.name,
        status: "Processing", // Default standard status logic map
        total: product.price,
        createdAt: product.createdAt,
      })),
    ];

    recentActivity.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // ============================
    // RETURN RESPONSE
    // ============================
    return NextResponse.json({
      // Dashboard Cards
      products: totalProducts,
      orders: totalOrders,
      customers: customers.length,
      revenue,

      // Today's Stats
      todayRevenue,
      todayOrders: todayOrderCount,

      // Growth
      revenueGrowth,

      // Charts
      monthlySales,
      weeklySales,
      dailySales,

      // Order Status
      analytics,

      // Tables
      recentOrders,
      latestProducts,

      // Product Widgets
      featuredProducts,
      newArrivals,
      lowStockProducts,
      lowStockCount,
      topSellingProducts,

      // Activity Feed
      recentActivity,
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data.",
      },
      { status: 500 }
    );
  }
}