import type { EmailBlock, EmailCampaign } from "../types";
import { tplBanner } from "../templates";
import { addDays, todayYmd } from "../dates";

/** Modèles d'e-mails SKINCLEAN prêts à personnaliser. Les listes de contacts relèvent du futur CRM. */

let k = 0;
const b = <T extends Omit<EmailBlock, "id">>(x: T) => ({ id: `b${++k}`, ...x }) as EmailBlock;
const hero = (headline: string, eyebrow: string, sub: string, packshot?: string, bg?: string) =>
  b({ type: "hero", design: tplBanner({ format: "newsletter", headline, eyebrow, sub, packshot, bg }), alt: headline });
const now = new Date().toISOString();

type E = Omit<EmailCampaign, "createdAt" | "updatedAt">;
const e = (x: E): EmailCampaign => ({ ...x, createdAt: now, updatedAt: now });

export function emails(): EmailCampaign[] {
  const t = todayYmd();
  return [
    e({
      id: "mail-bienvenue", name: "Newsletter de bienvenue", template: "Bienvenue", status: "valide", campaignId: "camp-lancement",
      subject: "Bienvenue chez SKINCLEAN 🌿 (et ton cadeau)", preheader: "Ton code -20 % et 3 conseils pour bien démarrer ta routine.",
      blocks: [
        hero("Bienvenue au Club", "SKINCLEAN", "Ravie de te compter parmi nous.", "/media/packshots/dew-drop-toner-hydratant.png"),
        b({ type: "title", text: "Ta peau, ta routine, ton glow." }),
        b({ type: "text", text: "Merci de nous avoir rejoints ! Chez SKINCLEAN, on croit qu'une routine simple, bien choisie et suivie dans le temps fait toute la différence. Chaque mois, tu recevras nos conseils skincare, nos nouveautés et des avantages réservés aux inscrites." }),
        b({ type: "code", code: "Ton code personnel t'attend dans l'e-mail de confirmation", text: "-20 % sur ta première commande, valable 30 jours (hors kits, non cumulable)." }),
        b({ type: "title", text: "3 conseils pour bien démarrer" }),
        b({ type: "text", text: "1. Fais ton Skin Diag : 2 minutes pour connaître ton type de peau.\n2. Introduis un seul nouveau produit à la fois.\n3. Termine toujours ta routine du matin par un SPF." }),
        b({ type: "button", text: "Faire mon Skin Diag", href: "/skin-diag" }),
        b({ type: "products", productIds: ["sc-cl-01", "sc-sr-03", "sc-cr-01"] }),
      ],
    }),
    e({
      id: "mail-20", name: "Newsletter -20 %", template: "Offre", status: "a_valider", campaignId: "camp-newsletter20", reviewDueAt: `${t}T16:00`,
      subject: "-20 % sur ta première commande, c'est maintenant", preheader: "Ton code de bienvenue expire bientôt : on t'aide à choisir.",
      blocks: [
        hero("-20 %", "Offre de bienvenue", "Sur ta première commande.", "/media/packshots/aqua-plump-serum-acide-hyaluronique.png", "#1F3329"),
        b({ type: "title", text: "Tu n'as pas encore utilisé ton code ?" }),
        b({ type: "text", text: "Ton offre de bienvenue te permet de découvrir SKINCLEAN avec -20 % sur ta première commande. Tu hésites ? Le Skin Diag te recommande la routine adaptée à ta peau en 2 minutes." }),
        b({ type: "button", text: "Trouver ma routine", href: "/skin-diag" }),
        b({ type: "products", productIds: ["sc-sr-01", "sc-sr-02", "sc-sr-03"] }),
        b({ type: "text", text: "Offre valable 30 jours après l'inscription, une fois par adresse e-mail, hors kits et non cumulable. Conditions complètes sur skinclean.fr/legal/conditions-offres." }),
      ],
    }),
    e({
      id: "mail-nouveautes", name: "Présentation des nouveautés", template: "Nouveautés", status: "brouillon", campaignId: "camp-black-friday",
      subject: "Nouveau chez SKINCLEAN : ce qui arrive dans ta salle de bain", preheader: "Spot Hero Night, nos sheet masks et nos accessoires.",
      blocks: [
        hero("Les nouveautés", "Nouveau", "Pensées pour compléter ta routine.", "/media/packshots/spot-hero-night-patchs-nuit.png"),
        b({ type: "title", text: "Nouveau : Spot Hero Night" }),
        b({ type: "text", text: "Le patch de nuit qui protège tes imperfections pendant que tu dors. À poser sur peau propre et sèche, à retirer le matin." }),
        b({ type: "products", productIds: ["sc-pt-02", "sc-pt-01"] }),
        b({ type: "divider" }),
        b({ type: "title", text: "Les sheet masks débarquent" }),
        b({ type: "text", text: "Glow, Hydra et Calm : trois masques en tissu pour un moment de pause selon ce dont ta peau a besoin." }),
        b({ type: "button", text: "Voir les nouveautés", href: "/soins-visage/nouveautes" }),
      ],
    }),
    e({
      id: "mail-ingredients", name: "Focus ingrédients", template: "Éducatif", status: "brouillon", campaignId: "camp-niacinamide",
      subject: "Niacinamide : tout ce que tu dois savoir (en 2 minutes)", preheader: "Ce qu'elle fait, avec quoi l'associer, comment l'utiliser.",
      blocks: [
        hero("Niacinamide", "Focus actif", "Le guide sans blabla.", "/media/packshots/clear-skin-serum-niacinamide.png", "#EDF0EA"),
        b({ type: "title", text: "La niacinamide, c'est quoi ?" }),
        b({ type: "text", text: "La niacinamide est une forme de vitamine B3. Elle aide à réduire l'apparence des pores, à réguler l'aspect brillant et à unifier le teint. Elle se tolère bien et s'associe avec la plupart des actifs." }),
        b({ type: "title", text: "Comment l'utiliser" }),
        b({ type: "text", text: "Matin et/ou soir, après le nettoyage et avant ta crème. Quelques gouttes suffisent. Les résultats s'observent sur plusieurs semaines d'utilisation régulière." }),
        b({ type: "products", productIds: ["sc-sr-01"] }),
        b({ type: "button", text: "Lire le guide complet", href: "/conseils/niacinamide-guide-complet" }),
      ],
    }),
    e({
      id: "mail-glow", name: "Routine Glow", template: "Routine", status: "a_valider", campaignId: "camp-glow",
      subject: "Ta routine glow du matin en 4 gestes ✨", preheader: "Dew Drop, Glow Shot, Cloud Cream, Daily Shield : l'ordre qui change tout.",
      blocks: [
        hero("Routine Glow", "Routine du matin", "4 gestes pour un teint lumineux.", "/media/packshots/glow-shot-serum-vitamine-c.png"),
        b({ type: "text", text: "Un teint lumineux ne demande pas dix produits. Voici la routine du matin que l'on recommande aux peaux ternes et déshydratées :" }),
        b({ type: "text", text: "1. Dew Drop, en 2 couches tapotées.\n2. Glow Shot, 3 gouttes de vitamine C.\n3. Cloud Cream, pour hydrater sans alourdir.\n4. Daily Shield SPF 50, la protection qui préserve ton glow." }),
        b({ type: "products", productIds: ["sc-tn-01", "sc-sr-02", "sc-cr-01", "sc-sp-01"] }),
        b({ type: "button", text: "Découvrir la routine", href: "/kits/glass-skin-routine" }),
      ],
    }),
    e({
      id: "mail-anti-imperfections", name: "Routine anti-imperfections", template: "Routine", status: "brouillon", campaignId: "camp-anti-imperfections",
      subject: "Peau nette sans décaper : la routine en 3 gestes", preheader: "Les erreurs à éviter et les bons réflexes.",
      blocks: [
        hero("Clear sans décaper", "Routine anti-imperfections", "3 gestes qui respectent ta peau.", "/media/packshots/clear-foam-nettoyant-purifiant.png"),
        b({ type: "title", text: "Les 3 erreurs les plus fréquentes" }),
        b({ type: "text", text: "Frotter fort, multiplier les acides le même soir, et sauter l'hydratation. Résultat : une peau irritée qui produit encore plus de sébum." }),
        b({ type: "title", text: "La routine qui marche" }),
        b({ type: "text", text: "Clear Foam pour nettoyer, Clear Skin pour réguler, Matte Balance pour hydrater sans briller. Et Spot Hero pour les urgences." }),
        b({ type: "products", productIds: ["sc-cl-02", "sc-sr-01", "sc-cr-03", "sc-pt-01"] }),
        b({ type: "text", text: "Si tes imperfections sont nombreuses, douloureuses ou persistantes, parles-en à un médecin ou à un dermatologue." }),
        b({ type: "button", text: "Voir le kit Acne Control", href: "/kits/acne-control" }),
      ],
    }),
    e({
      id: "mail-collection", name: "Lancement de collection — Hiver", template: "Collection", status: "brouillon", campaignId: "camp-hiver",
      subject: "Cocon d'hiver : la collection qui répare ta barrière", preheader: "Textures riches, gestes lents, peau protégée.",
      blocks: [
        hero("Cocon d'hiver", "Collection hiver", "Le confort retrouvé, même par grand froid.", "/media/packshots/velvet-barrier-creme-riche.png", "#EFEEEA"),
        b({ type: "text", text: "Quand le froid tiraille, ta barrière cutanée a besoin de renfort. Le Winter Rescue Kit réunit Silk Off, Aqua Plump, Velvet Barrier et Hydra Bloom pour une routine cocon du soir." }),
        b({ type: "products", productIds: ["sc-dm-02", "sc-sr-03", "sc-cr-02", "sc-ms-01"] }),
        b({ type: "button", text: "Découvrir le Winter Rescue Kit", href: "/kits/winter-rescue" }),
      ],
    }),
    e({
      id: "mail-saison", name: "Newsletter saisonnière — Guide cadeaux", template: "Saisonnière", status: "brouillon", campaignId: "camp-noel",
      subject: "Le guide cadeaux skincare (par type de peau) 🎁", preheader: "Des idées qui font vraiment plaisir, et les dates de livraison avant Noël.",
      blocks: [
        hero("Offre un glow", "Guide cadeaux", "Un cadeau choisi pour sa peau.", "/media/packshots/hydra-bloom-masque-hydratant.png", "#EBDDD5"),
        b({ type: "text", text: "Peau grasse : Acne Control. Peau sèche : Winter Rescue. Fan de glow : Glass Skin Routine. Toujours en voyage : Travel Essentials." }),
        b({ type: "button", text: "Voir tous les kits", href: "/kits" }),
        b({ type: "text", text: "Dernières dates de commande pour une livraison avant Noël : à compléter selon le transporteur." }),
      ],
    }),
    e({
      id: "mail-fidelite", name: "Programme de fidélité", template: "Fidélité", status: "brouillon", campaignId: "camp-fidelite",
      subject: "Ton Club SKINCLEAN : fais pousser tes avantages 🌱", preheader: "Feuilles, paliers et récompenses : tout comprendre en 1 minute.",
      blocks: [
        hero("SKINCLEAN Club", "Fidélité", "De Pousse à Canopée.", undefined, "#D8DFD4"),
        b({ type: "text", text: "Chaque euro dépensé te rapporte une feuille. Tu gagnes aussi des feuilles avec ton anniversaire, ton inscription newsletter et tes avis vérifiés. Échange-les contre des réductions dès 200 feuilles." }),
        b({ type: "text", text: "Pousse → Bourgeon → Fleur → Canopée : plus tu avances, plus tes avantages grandissent (avant-premières, échantillons, livraison offerte…)." }),
        b({ type: "button", text: "Découvrir le Club", href: "/club" }),
      ],
    }),
  ].map((x, i) => ({ ...x, scheduledAt: x.status === "valide" ? undefined : x.scheduledAt, reviewDueAt: x.reviewDueAt ?? (i < 2 ? `${addDays(t, 1)}T12:00` : undefined) }));
}
