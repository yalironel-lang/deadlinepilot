import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/dashboard", "/courses", "/inbox", "/assignments", "/settings", "/onboarding"];
const COOKIE_NAME = "deadlinepilot-session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    } catch {
      const resp = NextResponse.redirect(new URL("/login", req.url));
      resp.cookies.delete(COOKIE_NAME);
      return resp;
    }
  }

  // Redirect authenticated users away from login/register
  if ((pathname === "/login" || pathname === "/register") && token) {
    try {
      await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      // invalid token — let them through
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/courses/:path*", "/inbox/:path*", "/assignments/:path*", "/settings/:path*", "/onboarding/:path*", "/login", "/register"],
};
