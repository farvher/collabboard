import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // We check for the token in a cookie or rely on client-side redirect
  // Since we use localStorage, middleware can only check a lightweight signal
  // For SSR protection, we use a cookie-based approach as fallback
  const hasAuthCookie = request.cookies.get("isAuthenticated")?.value === "true";

  // If trying to access protected route without auth cookie, redirect to login
  if (!isPublicPath && pathname !== "/" && !hasAuthCookie) {
    // Allow the page to load - client-side will handle redirect if no token in localStorage
    // This is a soft guard; the real protection is client-side hydration check
    return NextResponse.next();
  }

  // If authenticated and trying to access auth pages, redirect to boards
  if (isPublicPath && hasAuthCookie) {
    return NextResponse.redirect(new URL("/boards", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
