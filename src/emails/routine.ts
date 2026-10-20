import { getProduct, resolveVariant } from "@/lib/catalog";
import { stepLabels } from "@/data/categories";
import { euro } from "@/lib/format";
import { siteUrl } from "@/lib/sign";
import type { RoutinePayload } from "@/lib/routine-link";
import { button, emailLayout } from "./layout";

export function routineEmail(payload: RoutinePayload, token: string, firstName?: string) {
  const url = siteUrl();
  const items = payload.i
    .map(([pid, vid, step, m]) => {
      const p = getProduct(pid);
      if (!p) return null;
      return { p, v: resolveVariant(p, vid), step, m };
    })
    .filter(Boolean) as { p: NonNullable<ReturnType<typeof getProduct>>; v: ReturnType<typeof resolveVariant>; step: string; m: string }[];
  const total = items.reduce((s, x) => s + x.v.price, 0);
  const moment = (m: string) => (m === "ms" ? "Matin & soir" : m === "m" ? "Matin" : "Soir");

  const rows = items
    .map((x, i) => {
      const img = x.p.media.packshot
        ? `<img src="${url}${x.p.media.packshot}" width="84" height="84" alt="${x.p.name}" style="display:block;border-radius:16px;object-fit:cover;background:${x.p.color.bg}">`
        : `<div style="width:84px;height:84px;border-radius:16px;background:${x.p.color.bg};text-align:center;line-height:84px;font-size:28px;color:${x.p.color.accent};font-weight:bold">${x.p.name[0]}</div>`;
      return `<tr><td style="padding:12px 0;border-bottom:1px solid #EFEBE0" valign="top" width="96">${img}</td>
<td style="padding:12px 0 12px 12px;border-bottom:1px solid #EFEBE0" valign="top">
<div style="font-size:11px;letter-spacing:2px;color:#6B8F7A">ÉTAPE ${i + 1} · ${(stepLabels[x.step] ?? x.step).toUpperCase()} · ${moment(x.m).toUpperCase()}</div>
<div style="font-size:17px;font-weight:bold;margin:4px 0">${x.p.name}</div>
<div style="font-size:13px;color:#5d6f66">${x.p.kind} — ${x.v.size}</div>
<div style="font-size:13px;margin-top:6px;line-height:19px">${x.p.benefits[0]}. ${x.p.usage}</div>
<div style="font-size:14px;font-weight:bold;margin-top:6px">${euro(x.v.price)}</div>
<a href="${url}/produits/${x.p.slug}" style="font-size:12px;color:#24392F">Voir le produit →</a>
</td></tr>`;
    })
    .join("");

  const profile = payload.p
    ? `<table role="presentation" width="100%" style="background:#E6E8E4;border-radius:16px;margin:16px 0"><tr><td style="padding:16px 18px;font-size:14px;line-height:22px">
<b>Ton profil de peau</b><br>Type : ${payload.p.st}<br>${payload.p.c.length ? `Préoccupations : ${payload.p.c.join(", ")}<br>` : ""}Objectif : ${payload.p.g}${payload.p.h ? `<br>Hydratation recherchée : ${payload.p.h}` : ""}
</td></tr></table>`
    : "";

  const body = `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;margin:0 0 8px">${firstName ? `${firstName}, voici` : "Voici"} ta Glow Routine </h1>
<p style="font-size:15px;line-height:22px;margin:0">La routine SKINCLEAN imaginée pour ta peau, à garder à portée de main.</p>
${profile}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="font-size:16px;text-align:right;margin:16px 0"><b>Total routine : ${euro(total)}</b></p>
<div style="text-align:center;margin:20px 0">${button(`${url}/routine/${token}`, "Retrouver ma routine")}${button(`${url}/routine/${token}?panier=1`, "Ajouter ma routine au panier", "#CDD6C9", "#24392F")}</div>
<p style="font-size:12px;color:#7a8a82;line-height:18px">Les prix indiqués sont ceux du jour de l'envoi et peuvent évoluer : le lien affiche toujours le prix et la disponibilité à jour. Tu as reçu cet e-mail car tu as demandé ta routine : aucune inscription à la newsletter n'a été effectuée.</p>`;

  return emailLayout({ preheader: "Ta routine SKINCLEAN personnalisée", body });
}
