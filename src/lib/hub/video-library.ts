/**
 * Vidéos de démonstration libres de droits (Pexels) rangées par thème, pour varier les contenus TikTok et Reels.
 * Chaque vidéo est choisie d'après le sujet du contenu, en privilégiant celles qui ont le moins servi.
 */

export const DEMO_VIDEO_NOTE = "Vidéo de démonstration libre de droits (Pexels) — à remplacer par le tournage SKINCLEAN.";

const V = (id: string, tags: string) => ({ src: `/media/videos/demo/pexels-${id}.mp4`, tags: tags.split(" ") });

/** Vidéos verticales uniquement (les deux vidéos paysage de la bibliothèque sont écartées). */
export const DEMO_VIDEOS = [
  V("12322612", "routine glow matin lifestyle"),
  V("12322647", "creme routine hydrat"),
  V("16232980", "yeux contour cerne"),
  V("4351114", "creme pot barriere seche riche"),
  V("5353474", "masque"),
  V("5468875", "glow eclat vitamine teint"),
  V("5524950", "creme hydrat texture"),
  V("5927790", "creme soir routine nuit"),
  V("5927885", "nettoy rincage double demaquill"),
  V("5927936", "creme sensible apais rougeur"),
  V("5937888", "masque exfol gommage"),
  V("6619522", "masque tissu hydrat"),
  V("6801664", "serum niacinamide goutte"),
  V("6810938", "nettoy mousse double"),
  V("6925815", "serum vitamine huile goutte"),
  V("6925816", "routine soir creme"),
  V("6975305", "yeux patch cerne poches"),
  V("7019513", "massage glow routine gua"),
  V("7250822", "creme spf solaire protection"),
  V("7305465", "serum retinal goutte niacinamide"),
  V("7306686", "yeux ridule anti-age bakuchiol retin"),
  V("7390197", "toner coton pads exfol bha lotion"),
  V("7467138", "glow eclat teint lumineux"),
  V("7593979", "masque peel"),
  V("7597957", "nettoy rincage matin eau"),
  V("8098907", "masque argile pores grasse"),
  V("8131886", "serum goutte"),
  V("8131887", "serum texture goutte hyaluronique"),
  V("8131891", "glow glass eclat"),
  V("8141588", "toner coton demaquill pads"),
  V("8298623", "mousse nettoy gel"),
  V("8371244", "routine lifestyle spf matin"),
  V("8996171", "nettoy imperfection bouton"),
  // Ajouts novembre 2026 : gestes de soin, produit peu visible
  V("4612174", "routine matin lifestyle miroir glow"),
  V("4665050", "creme hydrat glow mains"),
  V("5468859", "creme hydrat routine soir"),
  V("5927727", "masque argile exfol pores"),
  V("5927789", "routine soir detente nuit"),
  V("5936527", "yeux patch cerne poches"),
  V("5936529", "glow eclat matin teint"),
  V("5937387", "nettoy rincage double mousse"),
  V("5937414", "nettoy demaquill routine"),
  V("6446008", "glow teint eclat vitamine"),
  V("6446013", "routine matin spf lifestyle"),
  V("6446058", "serum goutte niacinamide vitamine retinal"),
  V("6619500", "sensible apais creme rougeur"),
  V("6694019", "massage gua glow"),
  V("6706917", "nettoy serviette rincage"),
  V("6945770", "creme mains texture barriere"),
  V("6945771", "routine soir creme hydrat"),
  V("6975316", "masque tissu hydrat"),
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Compteur d'utilisation partagé, pour éviter de répéter la même vidéo d'un contenu à l'autre. */
export function videoPicker(initial: Iterable<string> = []) {
  const used = new Map<string, number>();
  for (const s of initial) used.set(s, (used.get(s) ?? 0) + 1);
  return (topic: string): string => {
    const t = norm(topic);
    const scored = DEMO_VIDEOS.map((v) => ({ v, score: v.tags.filter((tag) => t.includes(tag)).length }));
    const best = Math.max(...scored.map((x) => x.score));
    // Parmi les vidéos du bon thème, celle qui a le moins servi ; à égalité, un choix stable selon le sujet
    const pool = (best > 0 ? scored.filter((x) => x.score === best) : scored).map((x) => x.v);
    const min = Math.min(...pool.map((v) => used.get(v.src) ?? 0));
    const least = pool.filter((v) => (used.get(v.src) ?? 0) === min);
    // Si toutes les vidéos du thème ont déjà servi plus que les autres, on élargit à toute la bibliothèque
    const globalMin = Math.min(...DEMO_VIDEOS.map((v) => used.get(v.src) ?? 0));
    const choice = min > globalMin + 1 ? DEMO_VIDEOS.filter((v) => (used.get(v.src) ?? 0) === globalMin) : least;
    const pick = choice[hash(t) % choice.length];
    used.set(pick.src, (used.get(pick.src) ?? 0) + 1);
    return pick.src;
  };
}
