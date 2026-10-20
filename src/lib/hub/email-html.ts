import { getProduct } from "@/lib/catalog";
import type { EmailCampaign } from "./types";

/**
 * Rendu HTML des e-mails (tableaux + styles en ligne : compatible clients mail).
 * `images` : URL des visuels générés (bloc hero) — data URL pour l'aperçu, URL absolue pour l'envoi.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl = (s: string) => esc(s).replace(/\n/g, "<br>");

export function renderEmailHtml(m: Pick<EmailCampaign, "subject" | "preheader" | "blocks">, opts: { baseUrl: string; images?: Record<string, string> }) {
  const u = (href: string) => (href.startsWith("http") ? href : `${opts.baseUrl}${href}`);
  const F = "font-family:Inter,Helvetica,Arial,sans-serif;";
  const rows = m.blocks.map((b) => {
    switch (b.type) {
      case "hero": {
        const src = opts.images?.[b.id] ?? b.image;
        return src ? `<tr><td><img src="${esc(u(src))}" alt="${esc(b.alt ?? "")}" width="600" style="display:block;width:100%;height:auto;border:0"></td></tr>` : "";
      }
      case "image":
        return `<tr><td style="padding:8px 32px"><img src="${esc(u(b.src))}" alt="${esc(b.alt ?? "")}" width="536" style="display:block;width:100%;height:auto;border:0"></td></tr>`;
      case "title":
        return `<tr><td style="padding:28px 32px 4px;${F}font-size:24px;line-height:1.2;font-weight:600;color:#1F3329;text-transform:uppercase;letter-spacing:-0.01em">${esc(b.text)}</td></tr>`;
      case "text":
        return `<tr><td style="padding:10px 32px;${F}font-size:15px;line-height:1.6;color:#33443B">${nl(b.text)}</td></tr>`;
      case "button":
        return `<tr><td style="padding:18px 32px"><a href="${esc(u(b.href))}" style="display:inline-block;background:#1F3329;color:#ffffff;${F}font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:15px 28px">${esc(b.text)}</a></td></tr>`;
      case "divider":
        return `<tr><td style="padding:16px 32px"><div style="border-top:1px solid #E3E1DC"></div></td></tr>`;
      case "code":
        return `<tr><td style="padding:14px 32px"><table role="presentation" width="100%" style="background:#EDF0EA"><tr><td style="padding:18px;${F}text-align:center"><div style="font-size:18px;font-weight:700;color:#1F3329;letter-spacing:0.04em">${esc(b.code)}</div><div style="font-size:13px;color:#5C6862;margin-top:6px">${esc(b.text)}</div></td></tr></table></td></tr>`;
      case "products": {
        const ps = b.productIds.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 4);
        const w = Math.floor(100 / Math.max(ps.length, 1));
        const cells = ps
          .map((p) => `<td width="${w}%" valign="top" style="padding:6px;${F}text-align:center"><a href="${esc(u(`/produits/${p.slug}`))}" style="text-decoration:none;color:#1F3329">${p.media.packshot ? `<img src="${esc(u(p.media.packshot))}" alt="${esc(p.name)}" width="120" style="display:block;margin:0 auto;width:100%;max-width:120px;height:auto;background:${p.color.bg}">` : ""}<div style="font-size:13px;font-weight:600;margin-top:8px">${esc(p.name)}</div><div style="font-size:12px;color:#5C6862">${esc(p.kind)}</div></a></td>`)
          .join("");
        return `<tr><td style="padding:12px 26px"><table role="presentation" width="100%"><tr>${cells}</tr></table></td></tr>`;
      }
    }
  });
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F3EF">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.preheader)}</div>
<table role="presentation" width="100%" style="background:#F4F3EF"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="padding:22px 32px;border-bottom:1px solid #E3E1DC"><img src="${esc(u("/media/brand/logo-wordmark.png"))}" alt="skinclean" height="26" style="display:block;height:26px;width:auto"></td></tr>
${rows.join("\n")}
<tr><td style="padding:28px 32px;background:#1F3329;${F}font-size:12px;line-height:1.6;color:#D8DFD4">SKINCLEAN — Your skin. Your glow.<br>Tu reçois cet e-mail car tu t'es inscrit·e à la newsletter SKINCLEAN.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#ffffff">Se désinscrire</a></td></tr>
</table></td></tr></table></body></html>`;
}
