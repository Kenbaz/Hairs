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
    } catch {
        return null;
    }
}


export async function middleware(request: NextRequest) {
    // Get both tokens from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isAdminLoginRoute = request.nextUrl.pathname === '/admin/login';

    const redirectToLogin = (request: NextRequest) => {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    };

    if (isAdminRoute) {
        // if both tokens are present
        if (accessToken && refreshToken) {
          // if access token is expired try to refresh
          if (JWTUtil.isTokenExpired(accessToken)) {
            const newTokens = await refreshAccessToken(refreshToken);

            if (newTokens) {
              // If refresh is successful, update access tokens and continue
              const response = NextResponse.next();

              response.cookies.set({
                name: "accessToken",
                value: newTokens.access,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              });

              // Validate admin access with new token
              if (!JWTUtil.isAdminUser(newTokens.access)) {
                return NextResponse.redirect(new URL("/", request.url));
              }
              return response;
            } else {
              // if refresh fails, clear all tokens and redirect to login
              const response = redirectToLogin(request);
              response.cookies.delete("accessToken");
              response.cookies.delete("refreshToken");
              return response;
            }
          }

          // Check if user is admin with current token
          if (!JWTUtil.isAdminUser(accessToken)) {
            const response = NextResponse.redirect(new URL("/", request.url));
            response.cookies.delete("accessToken");
            response.cookies.delete("refreshToken");
            return response;
          }

          // Redirect from login page if already authenticated
          if (isAdminLoginRoute) {
            return NextResponse.redirect(
              new URL("/admin/dashboard", request.url)
            );
          }
        }
        // No tokens present
        else {
          // Allow access to login page
          if (isAdminLoginRoute) {
            return NextResponse.next();
          }

          // Redirect to login for all other admin routes
          return redirectToLogin(request);
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