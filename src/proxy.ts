import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-cookie";

const publicPathnames = new Set(["/sign-in", "/sign-up", "/login"]);

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isPublicPath = publicPathnames.has(pathname);

  if (!sessionToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const response = NextResponse.next();

  if (sessionToken) {
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
