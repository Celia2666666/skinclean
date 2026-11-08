import { crmStockLive } from "@/lib/crm/inbound";

export const dynamic = "force-dynamic";

/** Stock du CRM pour le site (local uniquement). En ligne : { source: "catalogue" } et le site garde son stock. */
export async function GET() {
  if (!crmStockLive()) return Response.json({ source: "catalogue", stock: {} });
  const { ensureCrmSeeded } = await import("@/lib/crm/repo");
  const { all } = await import("@/lib/crm/db");
  await ensureCrmSeeded();
  const stock = Object.fromEntries(all("stock").map((s) => [s.id, s.qty]));
  return Response.json({ source: "crm", stock }, { headers: { "cache-control": "no-store" } });
}
