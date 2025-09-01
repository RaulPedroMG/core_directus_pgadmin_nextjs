import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simplified middleware to avoid hanging during development
  // TODO: Re-enable full Directus middleware after fixing connection issues

  console.log(
    `Middleware: Processing ${request.method} ${request.nextUrl.pathname}`
  );

  // Simply pass through all requests for now
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (to avoid interference)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
