import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/"].includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isUserRoute = nextUrl.pathname.startsWith("/user");

  if (isApiAuthRoute) return NextResponse.next();

  if (isPublicRoute) {
    if (isLoggedIn) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      } else {
        return NextResponse.redirect(new URL("/user", nextUrl));
      }
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/user", nextUrl));
  }

  if (isUserRoute && role !== "user") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
