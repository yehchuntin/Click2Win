import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that require authentication here
const protectedPaths = [
    // '/', // Assuming the home page itself requires login to interact fully
    '/my-rewards',
    '/activity-log',
    '/settings',
    '/activity', // Protect the base activity route and its children
    // Add other routes that need protection
];

// Add paths that should only be accessible when logged out (like signin)
const publicOnlyPaths = ['/signin'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('__session'); // Adjust cookie name if needed

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicOnly = publicOnlyPaths.some(path => pathname.startsWith(path));

  // If trying to access a protected route without a session, redirect to sign-in
  if (isProtected && !sessionCookie) {
    console.log(`Middleware: Unauthorized access to ${pathname}, redirecting to /signin`);
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    // Optional: Add redirect query param ?next=/protected-path
    // url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If trying to access a public-only route (like signin) with a session, redirect to home
  if (isPublicOnly && sessionCookie) {
     console.log(`Middleware: Authenticated access to ${pathname}, redirecting to /`);
     const url = request.nextUrl.clone();
     url.pathname = '/';
     return NextResponse.redirect(url);
  }


  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
