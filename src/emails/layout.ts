import { siteUrl } from "@/lib/sign";

/** Gabarit HTML d'e-mail aux couleurs SKINCLEAN (tables + styles inline pour compatibilité clients mail). */
export function emailLayout(opts: { preheader: string; body: string }) {
  const url = siteUrl();
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SKINCLEAN</title></head>
<body style="margin:0;padding:0;background:#F4F3EF;font-family:Helvetica,Arial,sans-serif;color:#24392F">
<span style="display:none;max-height:0;overflow:hidden">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3EF"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFEFB;border-radius:24px;overflow:hidden">
<tr><td align="center" style="background:#CDD6C9;padding:28px 24px">
<img src="${url}/media/brand/logo-wordmark.png" width="180" alt="skinclean" style="display:block;border:0;max-width:180px">
<div style="font-size:11px;letter-spacing:4px;margin-top:8px;color:#24392F">YOUR SKIN. YOUR GLOW.</div>
</td></tr>
<tr><td style="padding:32px 28px">${opts.body}</td></tr>
<tr><td align="center" style="background:#DDE3DA;padding:20px 24px;font-size:12px;line-height:18px;color:#24392F">
SKINCLEAN — conseils cosmétiques, pas de diagnostic médical.<br>
<a href="${url}/legal/confidentialite" style="color:#24392F">Confidentialité</a> · <a href="${url}/compte" style="color:#24392F">Mon compte</a>
</td></tr></table></td></tr></table></body></html>`;
}

export const button = (href: string, label: string, bg = "#24392F", color = "#FFFEFB") =>
  `<a href="${href}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;font-size:14px;margin:6px 4px">${label}</a>`;
