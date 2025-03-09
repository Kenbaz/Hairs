import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


// Routes that are accessible without authentication
const publicRoutes = [
  "/login",
  "/register",
  "/password-reset",
  "/auth/login",
  "/auth/register",
];

// Routes that require email verification
const verifiedRoutes = ['/shipping-address'];

// Routes that should be guest-only
const guestRoutes = ['/login', '/register', '/auth/login', 
    '/auth/register'];


export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Checking route: ${pathname}`);
    const isPublicRoute = publicRoutes.includes(pathname);
    const requiresVerification = verifiedRoutes.includes(pathname);
    const isGuestRoute = guestRoutes.includes(pathname);


    // Get auth state from cookies
    // const hasAuthToken = request.cookies.get('accessToken');
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const emailVerified = request.cookies.get("email_verified")?.value;
    // const isVerified = request.cookies.get('email_verified');

     console.log(
       `[Middleware] Tokens - Access: ${!!accessToken}, Refresh: ${!!refreshToken}, Verified: ${emailVerified}`
     );


    // If its a guest route and user is authenticated, redirect to home page
    if (isGuestRoute && accessToken) {
        console.log(
          "[Middleware] Redirecting authenticated user from guest route"
        );
        return NextResponse.redirect(new URL('/', request.url));
    };


    // If route requires auth and user isnt authenticated, redirect to login
    if (!isPublicRoute && (!accessToken || !refreshToken)) {
        console.log("[Middleware] Redirecting unauthenticated user");
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    };


    // If route requires verification and user isn't verified, redirect to verification notice
    if (requiresVerification && !emailVerified) {
        console.log("[Middleware] Redirecting unverified user");
      return NextResponse.redirect(
        new URL("/verify-email/verify-email-notice", request.url)
      );
    };

    return NextResponse.next();
};


// Configure which routes should be processed by this middleware
export const config = {
    matcher: [
        // Routes that need protection
        '/auth/shipping-address',
        '/profile/:path*',

        // Auth routes that need guest protection
        '/auth/login',
        '/auth/register',
        '/auth/password-reset',
    ],
};