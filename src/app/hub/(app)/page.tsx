import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { refs } from "@/lib/hub/page-data";
import { addDays, todayYmd, ymdhm, diffDays, nowParis } from "@/lib/hub/dates";
import { connectors } from "@/lib/hub/connectors";
import { HomeDashboard, type DayAction, type Priority, type Reco } from "@/components/hub/pages/HomeDashboard";
import { PLATFORM_LABEL } from "@/lib/hub/types";

export default async function HubHome() {
  const user = await requirePageUser();
  const t = todayYmd();
  const now = ymdhm(nowParis());
  const posts = list("posts").filter((p) => !p.library);
  const ads = list("ads");
  const emails = list("emails");
  const articles = list("articles");
  const campaigns = list("campaigns");

  const actions: DayAction[] = [
    ...posts.filter((p) => p.date.startsWith(t)).map((p) => ({ kind: "post" as const, time: p.date.slice(11, 16), id: p.id, post: p })),
    ...ads.filter((a) => a.reviewDueAt?.startsWith(t) && a.status === "a_valider").map((a) => ({ kind: "ad" as const, time: a.reviewDueAt!.slice(11, 16), id: a.id, title: `Validation de la campagne ${a.name.split("—")[0].trim()}`, sub: `${a.name} · budget ${a.totalBudget} €`, href: `/hub/ads?id=${a.id}`, amount: a.totalBudget })),
    ...emails.filter((m) => m.reviewDueAt?.startsWith(t) && m.status === "a_valider").map((m) => ({ kind: "email" as const, time: m.reviewDueAt!.slice(11, 16), id: m.id, title: `Validation newsletter — ${m.name}`, sub: m.subject, href: `/hub/emailing?id=${m.id}` })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = posts.filter((p) => p.date > now && !p.date.startsWith(t) && !["publie", "publie_manuel", "publie_test"].includes(p.status)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const toValidate = posts.filter((p) => p.status === "a_valider" || p.status === "modifications").sort((a, b) => a.date.localeCompare(b.date));
  const others = [
    ...emails.filter((m) => m.status === "a_valider").map((m) => ({ id: m.id, type: "Newsletter", title: m.name, href: `/hub/emailing?id=${m.id}` })),
    ...ads.filter((a) => a.status === "a_valider").map((a) => ({ id: a.id, type: "Publicité", title: `${a.name} — ${a.totalBudget} €`, href: `/hub/ads?id=${a.id}` })),
    ...articles.filter((a) => a.status === "a_valider").map((a) => ({ id: a.id, type: "Article SEO", title: a.title, href: `/hub/seo?tab=articles&id=${a.id}` })),
  ];
  const running = campaigns
    .filter((c) => c.status === "active" || c.status === "planifiee")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((c) => {
      const cp = posts.filter((p) => p.campaignId === c.id);
      return { id: c.id, name: c.name, color: c.color, status: c.status, startDate: c.startDate, endDate: c.endDate, channels: c.channels, total: cp.length, validated: cp.filter((p) => ["valide", "programme", "publie", "publie_manuel", "publie_test"].includes(p.status)).length, published: cp.filter((p) => ["publie", "publie_manuel", "publie_test"].includes(p.status)).length };
    });

  // Recommandations : moteur de règles sur les données réelles du Hub
  const recos: Reco[] = [];
  const soon = toValidate.filter((p) => diffDays(p.date, t) <= 2);
  if (soon.length) recos.push({ title: `${soon.length} contenu(s) à valider avant 48 h`, text: `Les publications de ${soon.slice(0, 2).map((p) => PLATFORM_LABEL[p.platform]).join(" et ")} arrivent bientôt. Valide-les pour pouvoir les programmer à temps.`, cta: "Valider maintenant", href: "/hub/calendrier?status=a_valider" });
  const nextCamp = campaigns.filter((c) => c.status === "planifiee" && c.startDate > t).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (nextCamp) {
    const d = diffDays(nextCamp.startDate, t);
    const adsToValidate = ads.filter((a) => a.campaignId === nextCamp.id && !a.budgetValidated);
    recos.push({ title: `${nextCamp.name} démarre dans ${d} jour(s)`, text: adsToValidate.length ? `${adsToValidate.length} campagne(s) publicitaire(s) liée(s) attendent la validation de leur budget. Prépare aussi les visuels et la newsletter.` : `Vérifie les visuels, la newsletter et les publications associées avant le lancement.`, cta: "Préparer la campagne", href: `/hub/campagnes/${nextCamp.id}` });
  }
  const nextWeek = posts.filter((p) => p.date >= addDays(t, 7) && p.date < addDays(t, 14));
  const tt = nextWeek.filter((p) => p.platform === "tiktok").length;
  if (tt < 4) recos.push({ title: "TikTok sous la fréquence cible la semaine prochaine", text: `${tt} vidéo(s) prévue(s) pour 4 recommandées. Pioche un concept prêt dans la bibliothèque TikTok.`, cta: "Bibliothèque TikTok", href: "/hub/reseaux-sociaux?platform=tiktok&tab=bibliotheque" });
  const unpublished = articles.filter((a) => a.status !== "publie");
  if (unpublished.length) recos.push({ title: "Un article SEO est prêt à être publié", text: `« ${unpublished[0].title} » cible « ${unpublished[0].keyword} ». Le publier renforce ta visibilité organique et le maillage vers les fiches produits.`, cta: "Voir l'article", href: `/hub/seo?tab=articles&id=${unpublished[0].id}` });
  if (!list("metrics").some((m) => m.source !== "demo")) recos.push({ title: "Aucune statistique réelle pour l'instant", text: "Connecte tes comptes ou saisis tes statistiques après chaque publication : le Copilot pourra alors recommander les formats qui fonctionnent vraiment.", cta: "Performances", href: "/hub/performances" });

  // Priorisation des publications des prochains jours (et des retards) : 1 = urgent, 2 = haute, 3 = normale
  const hoursUntil = (d: string) => (new Date(d).getTime() - Date.now()) / 36e5;
  const needsValidation = (st: string) => ["a_valider", "modifications", "brouillon"].includes(st);
  const priorities: Priority[] = posts
    .filter((p) => !["publie", "publie_manuel", "publie_test"].includes(p.status) && p.date >= addDays(t, -3) && p.date <= addDays(t, 7) + "T99")
    .map((p) => {
      const h = hoursUntil(p.date);
      const when = p.date.slice(11, 16).replace(":", " h ");
      let level: 1 | 2 | 3 = 3;
      let reason = "";
      if (h < 0) { level = 1; reason = `En retard : prévu le ${p.date.slice(8, 10)}/${p.date.slice(5, 7)} à ${when}. À publier ou reporter.`; }
      else if (h <= 24) { level = 1; reason = needsValidation(p.status) ? `À valider avant ${when} (dans ${Math.max(1, Math.round(h))} h).` : p.status === "programme" ? `Programmé à ${when} : vérifier la publication.` : `Validé : à publier ou programmer avant ${when}.`; }
      else if (h <= 72) { level = needsValidation(p.status) ? 1 : 2; reason = needsValidation(p.status) ? "À valider sous 3 jours pour pouvoir le programmer." : "Prêt : à programmer."; }
      else { level = needsValidation(p.status) ? 2 : 3; reason = needsValidation(p.status) ? "À valider cette semaine." : "Prêt, rien à faire pour l'instant."; }
      if (level > 1 && p.campaignId && campaigns.some((c) => c.id === p.campaignId && c.status === "active")) level = (level - 1) as 1 | 2;
      return { post: p, level, reason, hours: h };
    })
    .filter((x) => x.level < 3 || x.hours < 48)
    .sort((a, b) => a.level - b.level || a.hours - b.hours)
    .slice(0, 10)
    .map(({ post, level, reason }) => ({ post, level, reason }));

  const stats = {
    toValidate: toValidate.length + others.length,
    week: posts.filter((p) => p.date >= t && p.date < addDays(t, 7) + "T99").length,
    active: campaigns.filter((c) => c.status === "active").length,
    connected: connectors().filter((c) => c.connected).length,
  };

  return <HomeDashboard userName={user.name} actions={actions} upcoming={upcoming} toValidate={toValidate.slice(0, 12)} others={others} running={running} recos={recos.slice(0, 3)} stats={stats} refs={refs()} priorities={priorities} />;
}
