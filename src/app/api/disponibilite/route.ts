import { baseProducts } from "@/data/products";
import { crmInboundAvailable } from "@/lib/crm/inbound";

/**
 * Disponibilité d'un produit pour le Glow Assistant : stock du CRM quand il tourne (local), sinon stock du catalogue.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("produit") ?? "";
  const p = baseProducts.find((x) => x.id === id);
  if (!p) return Response.json({ error: "Produit inconnu" }, { status: 404 });
  let variants = p.variants.map((v) => ({ id: v.id, size: v.size, available: v.stock > 0 }));
  let source = "catalogue";
  if (crmInboundAvailable()) {
    const { ensureCrmSeeded } = await import("@/lib/crm/repo");
    const { all } = await import("@/lib/crm/db");
    await ensureCrmSeeded();
    const stock = all("stock").filter((s) => s.productId === id);
    if (stock.length) { variants = p.variants.map((v) => ({ id: v.id, size: v.size, available: (stock.find((s) => s.variantId === v.id)?.qty ?? 0) > 0 })); source = "crm"; }
  }
  return Response.json({ name: p.name, variants, source });
}
