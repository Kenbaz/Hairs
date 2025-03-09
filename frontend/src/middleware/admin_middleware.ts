import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWTUtil } from "../utils/jwt";


async function refreshAccessToken(refreshToken: string): Promise<{ access: string } | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) throw new Error('Refresh failed');

        return response.json();
    } catch (error) {
        console.error("[Token Refresh] Error:", error);
        return null;
    }
}


export async function middleware(request: NextRequest) {
  // Get both tokens from cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login";
  const isPasswordResetRoute = request.nextUrl.pathname.startsWith(
    "/admin/password-reset"
  );
  const isResetPasswordConfirmRoute = request.nextUrl.pathname.match(
    /^\/admin\/password-reset\/[^/]+$/
  );

  // Debugging logs
  console.log("[Middleware] Route:", request.nextUrl.pathname);
  console.log("[Middleware] Access Token:", !!accessToken);
  console.log("[Middleware] Refresh Token:", !!refreshToken);

  // Public routes that dont require authentication
  const isPublicRoute =
    isAdminLoginRoute || isPasswordResetRoute || isResetPasswordConfirmRoute;

  const redirectToLogin = () => {
    const loginUrl = new URL(
      isAdminRoute ? "/admin/login" : "auth/login",
      request.url
    );
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  };

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (isAdminRoute) {
    // No tokens
    if (!accessToken || !refreshToken) {
      return redirectToLogin();
    }

    // Validate token
    try {
      // Check if token is expired
      if (JWTUtil.isTokenExpired(accessToken)) {
        // Attempt token refresh (your existing logic)
        const newTokens = await refreshAccessToken(refreshToken);

        if (!newTokens) {
          return redirectToLogin();
        }

        // Create response with new token
        const response = NextResponse.next();
        response.cookies.set("accessToken", newTokens.access, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return response;
      }

      // Validate admin access
      if (!JWTUtil.isAdminUser(accessToken)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("[Middleware] Token validation error:", error);
      return redirectToLogin();
    }
  }

  return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/',
    ]
};