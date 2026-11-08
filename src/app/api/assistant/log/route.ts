import { logChat } from "@/lib/crm/inbound";

/** Journal anonyme des questions posées au Glow Assistant (alimente le module Chatbot du CRM local). */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return new Response(null, { status: 400 });
  const ok = await logChat(b).catch(() => false);
  return new Response(null, { status: ok ? 204 : 202 });
}
