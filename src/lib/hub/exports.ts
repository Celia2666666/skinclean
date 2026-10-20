import "server-only";
import { list } from "./repo";
import type { AdCampaign } from "./types";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\n");

export const utmUrl = (a: Pick<AdCampaign, "url" | "utm">) => {
  const u = new URL(a.url);
  u.searchParams.set("utm_source", a.utm.source);
  u.searchParams.set("utm_medium", a.utm.medium);
  u.searchParams.set("utm_campaign", a.utm.campaign);
  if (a.utm.content) u.searchParams.set("utm_content", a.utm.content);
  if (a.utm.term) u.searchParams.set("utm_term", a.utm.term);
  return u.toString();
};

/** Export d'une campagne publicitaire. Google Ads : colonnes compatibles avec l'import Google Ads Editor. */
export function adsCsv(a: AdCampaign) {
  if (a.platform === "google_ads") {
    const head = ["Campaign", "Campaign Daily Budget", "Start Date", "End Date", "Ad Group", "Keyword", "Criterion Type", "Headline 1", "Headline 2", "Headline 3", "Description Line 1", "Description Line 2", "Final URL"];
    const rows: unknown[][] = [head, [a.name, a.dailyBudget, a.startDate, a.endDate, "", "", "", "", "", "", "", "", ""]];
    const group = `${a.name} — groupe 1`;
    for (const k of a.keywords) rows.push([a.name, "", "", "", group, k.text, k.match === "exact" ? "Exact" : k.match === "expression" ? "Phrase" : "Broad", "", "", "", "", "", ""]);
    for (const k of a.negativeKeywords) rows.push([a.name, "", "", "", group, k, "Negative Broad", "", "", "", "", "", ""]);
    for (const ad of a.ads) {
      const [h1 = "", h2 = "", h3 = ""] = ad.headline.split("|").map((x) => x.trim().slice(0, 30));
      rows.push([a.name, "", "", "", group, "", "", h1, h2, h3, ad.text.slice(0, 90), (ad.description ?? "").slice(0, 90), utmUrl(a)]);
    }
    return csv(rows);
  }
  const rows: unknown[][] = [["Campagne", "Plateforme", "Objectif", "Lieux", "Âge", "Genre", "Centres d'intérêt", "Exclusions", "Budget/jour (€)", "Budget total (€)", "Début", "Fin", "Titre", "Texte", "CTA", "URL avec UTM"]];
  for (const ad of a.ads)
    rows.push([a.name, a.platform, a.objective, a.audience.locations, a.audience.age, a.audience.gender, a.audience.interests.join(" / "), a.audience.exclusions ?? "", a.dailyBudget, a.totalBudget, a.startDate, a.endDate, ad.headline, ad.text, ad.cta, utmUrl(a)]);
  return csv(rows);
}

/** Rapport de performances : données réelles (API + saisies) ou démonstration, jamais mélangées. */
export function reportCsv(source: "demo" | "reel") {
  const ms = list("metrics").filter((m) => (source === "demo" ? m.source === "demo" : m.source !== "demo"));
  const keys = [...new Set(ms.flatMap((m) => Object.keys(m.values)))];
  const rows: unknown[][] = [["Source", "Canal", "Date", ...keys]];
  for (const m of ms.sort((a, b) => a.date.localeCompare(b.date))) rows.push([m.source === "demo" ? "DÉMONSTRATION" : m.source, m.channel, m.date, ...keys.map((k) => m.values[k] ?? "")]);
  const posts = list("posts").filter((p) => !p.library);
  rows.push([], ["Gestion éditoriale"], ["Publications prévues", posts.length], ["Publiées (confirmées API)", posts.filter((p) => p.status === "publie").length], ["Publiées (déclarées manuellement)", posts.filter((p) => p.status === "publie_manuel").length], ["En attente de validation", posts.filter((p) => p.status === "a_valider").length]);
  return csv(rows);
}
