import { NextResponse, type NextRequest } from "next/server";

/**
 * Marketing Hub : accessible uniquement en localhost.
 * Toute requête vers /hub ou /api/hub venant d'un autre hôte (Vercel, domaine public, IP du réseau) reçoit une 404.
 */
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  if (process.env.VERCEL || !LOCAL.has(host)) {
    return new NextResponse("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/hub", "/hub/:path*", "/api/hub/:path*"],
};
