import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

function requiresAdminApiAccess(pathname: string, method: string) {
  const upperMethod = method.toUpperCase();

  if (pathname.startsWith("/api/admin/auth/")) return false;
  if (pathname === "/api/banner/public") return false;
  if (
    pathname === "/api/collections/public" ||
    pathname === "/api/collections/home"
  ) {
    return false;
  }

  if (
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/upload" ||
    pathname === "/api/banner" ||
    pathname.startsWith("/api/banner/")
  ) {
    return true;
  }

  if (pathname === "/api/orders") return upperMethod === "GET";
  if (pathname.startsWith("/api/orders/")) {
    return !pathname.endsWith("/tracking");
  }

  if (pathname === "/api/products" || pathname === "/api/categories") {
    return upperMethod !== "GET";
  }
  if (pathname.startsWith("/api/categories/")) return upperMethod !== "GET";
  if (pathname === "/api/collections") return upperMethod !== "GET";
  if (pathname.startsWith("/api/collections/")) return true;

  return false;
}

function unauthorizedApiResponse() {
  return NextResponse.json(
    { message: "Admin authentication required." },
    { status: 401 }
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = verifyAdminSessionToken(token);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (authenticated) return NextResponse.next();

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname.startsWith("/api/") &&
    requiresAdminApiAccess(pathname, request.method) &&
    !authenticated
  ) {
    return unauthorizedApiResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
