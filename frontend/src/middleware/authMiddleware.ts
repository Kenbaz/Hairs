import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


// Routes that are accessible without authentication
const publicRoutes = [
    '/login',
    '/register',
    '/password-reset',
];

// Routes that require email verification
const verifiedRoutes = ['/shipping-address'];

// Routes that should be guest-only
const guestRoutes = ['/login', '/register'];


export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublicRoute = publicRoutes.includes(pathname);
    const requiresVerification = verifiedRoutes.includes(pathname);
    const isGuestRoute = guestRoutes.includes(pathname);


    // Get auth state from cookies
    const hasAuthToken = request.cookies.get('accessToken');
    const isVerified = request.cookies.get('email_verified');


    // If its a guest route and user is authenticated, redirect to home page
    if (isGuestRoute && hasAuthToken) {
        return NextResponse.redirect(new URL('/', request.url));
    };


    // If route requires auth and user isnt authenticated, redirect to login
    if (!isPublicRoute && !hasAuthToken) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    };


    // If route requires verification and user isn't verified, redirect to verification notice
    if (requiresVerification && !isVerified) {
        return NextResponse.redirect(new URL('/verify-email/verify-email-notice', request.url));
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