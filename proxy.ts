import { auth } from "@/app/api/auth/[...nextauth]/auth.edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/", "/dashboard"];
const publicRoutes = ["/login", "/register"];

// Skip middleware for static files, api routes, and _next
const skipMiddlewarePatterns = [
  /^\/_next\//,           // Next.js internal files
  /^\/api\//,             // API routes (have own auth)
  /\.(ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i, // Static files
  /\.(png|jpg|jpeg|gif|webp|avif)$/i, // Images
  /^\/favicon\.ico$/,    // Favicon
];

function shouldSkipMiddleware(pathname: string): boolean {
  return skipMiddlewarePatterns.some((pattern) => pattern.test(pathname));
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static resources and API
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  try {
    const session = await auth();

    const isProtectedRoute = protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    const isPublicRoute = publicRoutes.includes(pathname);

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !session) {
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users away from login/register
    if (isPublicRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // On auth error, allow request to proceed (will be handled by API)
    console.error("Middleware auth error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
