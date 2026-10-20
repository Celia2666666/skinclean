import type { Kit, Product } from "./types";
import raw from "@/data/site-overrides.json";

/**
 * PONT MARKETING HUB → SITE
 * Le Marketing Hub (/hub) écrit ses modifications de contenus dans src/data/site-overrides.json.
 * Le catalogue, les kits, l'accueil et le bandeau d'annonces appliquent ces surcharges au chargement :
 * une seule source de vérité produit (src/data/products.ts) + des retouches marketing traçables.
 * En développement, chaque écriture recharge automatiquement le site (rechargement à chaud).
 */

export type ProductPatch = Partial<
  Pick<Product, "name" | "kind" | "tagline" | "description" | "benefits" | "tips" | "isNew" | "media" | "textureLabel">
> & { seoTitle?: string; seoDescription?: string; hidden?: boolean };

export interface HomeSlide { id: string; image: string; title: string; text?: string; cta?: string; href?: string }

export interface SiteOverrides {
  updatedAt?: string;
  updatedBy?: string;
  products?: Record<string, ProductPatch>;
  addedProducts?: Product[];
  /** Ordre des best-sellers (ids produits, 7 max). Remplace le champ `bestseller` du catalogue. */
  bestsellers?: string[];
  kits?: Record<string, Partial<Pick<Kit, "name" | "tagline" | "description" | "routine">>>;
  addedKits?: Kit[];
  home?: {
    hero?: { title: string; subtitle: string; cta: string; ctaHref?: string };
    heroVideo?: string;
    heroVideoMobile?: string;
    heroPoster?: string;
    heroBackground?: string;
    slides?: HomeSlide[];
    featured?: { enabled: boolean; eyebrow: string; title: string; text: string; href: string; image?: string; productIds: string[] };
    promoBanner?: { enabled: boolean; text: string; href?: string; bg?: string; color?: string; image?: string };
  };
  announcements?: string[];
}

export const siteOverrides = raw as SiteOverrides;

export function applyProductOverrides(base: Product[], o: SiteOverrides = siteOverrides): Product[] {
  const merged = [...base, ...(o.addedProducts ?? [])]
    .map((p) => {
      const patch = o.products?.[p.id];
      if (!patch) return { ...p };
      const { seoTitle: _t, seoDescription: _d, hidden: _h, ...fields } = patch;
      return { ...p, ...fields, media: { ...p.media, ...(fields.media ?? {}) } };
    })
    .filter((p) => !o.products?.[p.id]?.hidden);
  if (o.bestsellers?.length) {
    for (const p of merged) {
      const rank = o.bestsellers.indexOf(p.id);
      p.bestseller = rank >= 0 ? rank + 1 : undefined;
    }
  }
  return merged;
}

export function applyKitOverrides(base: Kit[], o: SiteOverrides = siteOverrides): Kit[] {
  return [...base, ...(o.addedKits ?? [])].map((k) => ({ ...k, ...(o.kits?.[k.id] ?? {}) }));
}

export const productSeo = (id: string) => siteOverrides.products?.[id] ?? {};
