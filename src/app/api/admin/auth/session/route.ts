import { NextResponse } from "next/server";
import {
  getAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function GET(request: Request) {
  return NextResponse.json({
    authenticated: verifyAdminSessionToken(getAdminSessionToken(request)),
  });
}
