import { siteOverrides } from "@/lib/site-overrides";
/**
 * Contenus média de la page d'accueil.
 * → Déposer les vidéos dans /public/media/videos puis renseigner les chemins ci-dessous.
 */
const baseHomeMedia = {
  /** Vidéo du hero (verticale 834×1112, H.264, muette). */
  heroVideo: "/media/videos/hero.mp4" as string | undefined,
  /** Version mobile verticale optionnelle (1080×1920). */
  heroVideoMobile: "/media/videos/hero-mobile.mp4" as string | undefined,
  /** Image de secours affichée avant lecture ou si l'autoplay est bloqué. */
  heroPoster: "/media/videos/hero-poster.webp" as string | undefined,
  /** Couleur du fond de la vidéo : prolonge l'image derrière le texte sur ordinateur. */
  heroBackground: "#F1ECE7",
  /**
   * Avant / après : vraies photos de peau (banque d'images Pexels, licence libre), en gros plan.
   * `illustrative: true` → elles illustrent le type de résultat recherché, ce ne sont PAS des résultats
   * obtenus avec un produit SKINCLEAN : la mention reste affichée sur le comparateur.
   */
  beforeAfter: [
    // Vraie paire avant/après (même personne), fournie par la marque ; « après » recalé sur l'« avant » (décalage + zoom ×1,07).
    { productId: "sc-sr-01", demo: "imperfections" as const, before: "/media/before-after/acne-avant.webp" as string | undefined, after: "/media/before-after/acne-apres.webp" as string | undefined, illustrative: true, caption: "Peau avec imperfections → peau plus nette" },
    // Rougeurs : photo fournie (visage en miroir) ; « après » = moitié droite retournée et recalée sur la gauche.
    { productId: "sc-sr-04", demo: "rougeurs" as const, before: "/media/before-after/rougeurs-avant.webp" as string | undefined, after: "/media/before-after/rougeurs-apres.webp" as string | undefined, illustrative: true, caption: "Rougeurs visibles → teint plus uniforme" },
    { productId: "sc-sr-02", demo: "eclat" as const, before: undefined as string | undefined, after: undefined as string | undefined, illustrative: true, caption: "Peau terne → teint plus lumineux" },
  ],
};

/** Médias d'accueil publiés : valeurs de base, éventuellement remplacées depuis le Marketing Hub. */
const h = siteOverrides.home ?? {};
export const homeMedia = {
  ...baseHomeMedia,
  heroVideo: h.heroVideo ?? baseHomeMedia.heroVideo,
  heroVideoMobile: h.heroVideoMobile ?? baseHomeMedia.heroVideoMobile,
  heroPoster: h.heroPoster ?? baseHomeMedia.heroPoster,
  heroBackground: h.heroBackground ?? baseHomeMedia.heroBackground,
};
export const homeHub = { hero: h.hero, slides: h.slides ?? [], featured: h.featured, promoBanner: h.promoBanner };
