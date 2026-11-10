import type { Order } from "@/lib/store";

/**
 * E-mail de confirmation d'une commande, construit dans le navigateur à partir de la commande enregistrée.
 * En démo, aucun e-mail ne part : il s'affiche sur la page de confirmation et dans la boîte mail de démo du CRM.
 * Même gabarit que les e-mails du serveur (src/emails/layout.ts).
 */
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function orderEmail(o: Order, origin: string, firstName?: string) {
  const subject = `Ta commande ${o.id} est confirmée`;
  const rows = o.lines.map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E7E9E3;font-size:14px">${esc(l.name)} <span style="color:#5C6862">(${esc(l.size)}) × ${l.qty}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #E7E9E3;font-size:14px;white-space:nowrap">${eur(l.unit * l.qty)}</td></tr>`).join("");
  const total = (label: string, v: string, bold = false) => `<tr><td style="padding:4px 0;font-size:14px${bold ? ";font-weight:bold" : ""}">${label}</td><td align="right" style="padding:4px 0;font-size:14px${bold ? ";font-weight:bold" : ""}">${v}</td></tr>`;
  const addr = o.address ? `<p style="font-size:13px;line-height:20px;color:#5C6862;margin:18px 0 0">Livraison à : ${esc(o.address.name)}, ${esc(o.address.line1 ?? "")} ${esc(o.address.zip ?? "")} ${esc(o.address.city ?? "")}</p>` : "";
  const body = `<h1 style="font-size:24px;margin:0 0 8px">Merci${firstName ? ` ${esc(firstName)}` : ""} !</h1>
<p style="font-size:15px;line-height:24px;margin:0 0 18px">Ta commande <b>${esc(o.id)}</b> du ${new Date(o.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} est bien enregistrée. Voici son récapitulatif :</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
${total("Sous-total", eur(o.subtotal))}${o.discount ? total("Réductions", `−${eur(o.discount)}`) : ""}${total("Livraison", o.shipping ? eur(o.shipping) : "offerte")}${total("Total TTC", eur(o.total), true)}
</table>
${o.gift ? `<p style="font-size:14px;margin:14px 0 0">🎁 Cadeau inclus : ${esc(o.gift)}</p>` : ""}${o.leaves ? `<p style="font-size:14px;margin:6px 0 0">🌿 ${o.leaves} feuilles SKINCLEAN Club créditées à l'expédition</p>` : ""}${addr}
<p style="text-align:center;margin:26px 0 8px"><a href="${origin}/compte/commandes" style="display:inline-block;background:#24392F;color:#FFFEFB;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;font-size:14px">Suivre ma commande</a></p>
<p style="font-size:12px;line-height:18px;color:#5C6862;margin:18px 0 0;padding:12px;background:#F4F3EF;border-radius:12px">Paiement simulé (projet étudiant INSEEC, démo sans vente réelle) : aucune somme n'a été débitée et la commande ne sera pas expédiée.</p>`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SKINCLEAN</title></head>
<body style="margin:0;padding:0;background:#F4F3EF;font-family:Helvetica,Arial,sans-serif;color:#24392F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3EF"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFEFB;border-radius:24px;overflow:hidden">
<tr><td align="center" style="background:#CDD6C9;padding:28px 24px"><img src="${origin}/media/brand/logo-wordmark.png" width="180" alt="skinclean" style="display:block;border:0;max-width:180px"><div style="font-size:11px;letter-spacing:4px;margin-top:8px;color:#24392F">YOUR SKIN. YOUR GLOW.</div></td></tr>
<tr><td style="padding:32px 28px">${body}</td></tr>
<tr><td align="center" style="background:#DDE3DA;padding:20px 24px;font-size:12px;line-height:18px;color:#24392F">SKINCLEAN — conseils cosmétiques, pas de diagnostic médical.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, to: o.email };
}
