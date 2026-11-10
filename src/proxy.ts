import { NextResponse, type NextRequest } from "next/server";

/**
 * Marketing Hub (espace « Admin ») : en ligne sur Vercel en mode démonstration, jamais indexé.
 * En local, il reste réservé à la machine (localhost) : une requête venant du réseau reçoit une 404.
 */
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  if (!process.env.VERCEL && !LOCAL.has(host)) {
    return new NextResponse("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  }
  const res = NextResponse.next();
  res.headers.set("x-robots-tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/hub", "/hub/:path*", "/api/hub/:path*"],
};
