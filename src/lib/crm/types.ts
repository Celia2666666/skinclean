/**
 * CRM SKINCLEAN — modèle de données (partagé client et serveur).
 * Dates locales au format AAAA-MM-JJTHH:mm (comme le Marketing Hub).
 * `source` sépare strictement les données de démonstration des données réelles (commandes Stripe) :
 * elles ne sont jamais additionnées dans un même indicateur.
 */

export type DataSource = "demo" | "reel";

export type OrderStatus = "payee" | "en_preparation" | "expediee" | "livree" | "annulee" | "remboursee";
export type Channel = "instagram" | "tiktok" | "meta_ads" | "google_ads" | "seo" | "newsletter" | "parrainage" | "direct";
export type Device = "mobile" | "desktop" | "tablette";
export type Payment = "carte" | "apple_pay" | "google_pay" | "paypal";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  category: string;
  qty: number;
  /** Prix unitaire TTC payé (après remise coffret, avant code promo). */
  unit: number;
  /** Coût de revient unitaire HT. */
  cost: number;
  kitId?: string;
}

export interface Order {
  id: string;
  number: string;
  source: DataSource;
  customerId: string;
  email: string;
  customerName: string;
  createdAt: string;
  status: OrderStatus;
  channel: Channel;
  device: Device;
  payment: Payment;
  items: OrderItem[];
  /** Somme des lignes TTC. */
  subtotal: number;
  discount: number;
  promoCode?: string;
  shipping: number;
  total: number;
  refunded?: number;
  city: string;
  region: string;
  firstOrder: boolean;
  tracking?: string;
  history: { at: string; status: OrderStatus; note?: string }[];
}

export type Lifecycle = "abonne" | "lead" | "client" | "fidele" | "vip";

export interface Customer {
  id: string;
  source: DataSource;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city: string;
  region: string;
  zip: string;
  createdAt: string;
  channel: Channel;
  skinType: "seche" | "grasse" | "mixte" | "normale" | "sensible";
  concerns: string[];
  birthYear: number;
  optinEmail: boolean;
  optinSms: boolean;
  tags: string[];
  owner?: string;
}

export type CartStatus = "abandonne" | "relance" | "recupere" | "perdu";
export interface Cart {
  id: string;
  source: DataSource;
  customerId?: string;
  email: string;
  name: string;
  createdAt: string;
  step: "panier" | "livraison" | "paiement";
  device: Device;
  items: Omit<OrderItem, "cost">[];
  value: number;
  status: CartStatus;
  relaunches: { at: string; channel: "email" | "sms"; auto: boolean }[];
  recoveredOrderId?: string;
  recoveredAt?: string;
}

export interface StockItem {
  id: string; // productId:variantId
  productId: string;
  variantId: string;
  name: string;
  size: string;
  category: string;
  price: number;
  cost: number;
  qty: number;
  reorderPoint: number;
  safetyStock: number;
  leadDays: number;
  supplier: string;
  location: string;
  updatedAt: string;
}

export type MoveReason = "reception" | "ajustement" | "retour" | "casse" | "vente";
export interface StockMove {
  id: string;
  at: string;
  stockId: string;
  label: string;
  delta: number;
  reason: MoveReason;
  ref?: string;
  note?: string;
  by: string;
}

export type PoStatus = "brouillon" | "envoyee" | "recue" | "annulee";
export interface PurchaseOrder {
  id: string;
  number: string;
  supplier: string;
  createdAt: string;
  expectedAt: string;
  status: PoStatus;
  lines: { stockId: string; label: string; qty: number; cost: number }[];
  receivedAt?: string;
}

export type DealStage = "prospect" | "qualifie" | "proposition" | "negociation" | "gagne" | "perdu";
/** Source qui a amené le contact (réseau social, partenaire, salon…). */
export type DealOrigin = "reseau_social" | "partenaire" | "salon" | "site" | "recommandation";
export interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone?: string;
  type: "institut" | "concept_store" | "pharmacie" | "spa" | "marketplace" | "entreprise";
  city: string;
  stage: DealStage;
  amount: number;
  closeDate: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  nextStep?: string;
  lostReason?: string;
  origin?: DealOrigin;
  stageHistory: { at: string; stage: DealStage }[];
}

export interface Task {
  id: string;
  title: string;
  due: string;
  done: boolean;
  priority: "haute" | "normale" | "basse";
  type: "appel" | "email" | "relance" | "stock" | "admin";
  related?: { kind: "client" | "commande" | "deal" | "produit"; id: string; label: string };
  createdAt: string;
  doneAt?: string;
}

export interface Activity {
  id: string;
  at: string;
  customerId?: string;
  dealId?: string;
  kind: "note" | "appel" | "email" | "relance" | "statut" | "sms";
  body: string;
  by: string;
}

export type TicketStatus = "ouvert" | "en_cours" | "resolu";
export interface Ticket {
  id: string;
  number: string;
  source: DataSource;
  customerId: string;
  customerName: string;
  orderId?: string;
  subject: string;
  category: "livraison" | "produit" | "retour" | "conseil" | "paiement" | "compte";
  channel: "email" | "chat" | "instagram" | "telephone" | "formulaire" | "chatbot";
  /** Adresse de l'expéditeur (messages reçus via le formulaire de contact ou le Glow Assistant). */
  email?: string;
  priority: "urgente" | "haute" | "normale" | "basse";
  status: TicketStatus;
  createdAt: string;
  firstResponseMin?: number;
  resolvedAt?: string;
  csat?: number;
  messages: { at: string; from: "client" | "skinclean"; body: string; auto?: boolean }[];
  /** Assistant SAV : tri (réponse automatique possible ou non), brouillon de réponse, suivi de la vérification. */
  ai?: SupportAi;
}

/** Dépenses marketing mensuelles par canal payant (démonstration). */
export interface Spend { id: string; month: string; channel: Channel; amount: number }
/** Trafic quotidien du site (démonstration) : sert au tunnel de conversion. */
export interface Traffic { id: string; day: string; sessions: number; productViews: number; addToCart: number; checkouts: number }

export interface CrmSettings {
  id: "settings";
  vatRate: number;
  paymentFeePct: number;
  paymentFeeFixed: number;
  shippingCost: number;
  packagingCost: number;
  monthlyTarget: number;
  fixedCosts: { label: string; amount: number }[];
  /** Adresse de démonstration : reçoit (dans la boîte de démo du CRM) tous les e-mails adressés aux contacts fictifs. */
  demoInbox?: string;
  /** Si Resend est configuré et que demoInbox est une vraie adresse : les e-mails de démo y sont réellement envoyés. */
  redirectDemo?: boolean;
}

/** E-mail produit par le CRM (automatisation, relance, réponse) — visible dans la boîte de démo. */
export interface MailDoc {
  id: string; at: string; to: string; deliveredTo?: string; subject: string; html: string; text: string;
  delivery: Delivery; detail?: string; origin: string;
  /** Catégorie de l'envoi (classement de la boîte de démo). */
  kind?: MailKind;
}

export type MailKind = "order" | "sav" | "cart" | "back_in_stock" | "new_product" | "welcome" | "review" | "replenish" | "winback" | "message";
export const MAIL_KIND: { id: MailKind; label: string }[] = [
  { id: "order", label: "Confirmations de commande" },
  { id: "sav", label: "Réponses SAV" },
  { id: "cart", label: "Relances panier abandonné" },
  { id: "back_in_stock", label: "Retour en stock" },
  { id: "new_product", label: "Nouveautés produit" },
  { id: "welcome", label: "Bienvenue" },
  { id: "review", label: "Demandes d'avis" },
  { id: "replenish", label: "Réapprovisionnement" },
  { id: "winback", label: "Réactivation" },
  { id: "message", label: "Messages manuels" },
];
/** Catégorie d'un e-mail (y compris les anciens e-mails enregistrés sans catégorie). */
export function mailKindOf(m: { kind?: MailKind; origin: string; subject: string }): MailKind {
  if (m.origin.startsWith("Boutique")) return "order"; // confirmations envoyées par la boutique (y compris les anciens e-mails)
  if (m.kind) return m.kind;
  const o = `${m.origin} ${m.subject}`.toLowerCase();
  if (o.includes("sav") || o.startsWith("réponse") || o.includes("re :")) return "sav";
  if (o.includes("panier")) return "cart";
  if (o.includes("retour en stock") || o.includes("est de retour")) return "back_in_stock";
  if (o.includes("nouveau")) return "new_product";
  if (o.includes("bienvenue")) return "welcome";
  if (o.includes("avis")) return "review";
  if (o.includes("réapprovisionnement") || o.includes("court de")) return "replenish";
  if (o.includes("réactivation") || o.includes("manque")) return "winback";
  return "message";
}

/** Question posée au Glow Assistant (anonyme : aucune donnée personnelle). */
export interface ChatLog { id: string; source: DataSource; at: string; session: string; text: string; intent: string; page: string }

/** Inscription « Me prévenir du retour en stock ». */
export interface StockAlert {
  id: string; source: DataSource; createdAt: string; email: string; customerId?: string;
  productId: string; variantId?: string; label: string; origin: "fiche_produit" | "chatbot";
  status: "en_attente" | "envoyee" | "annulee"; sentAt?: string; delivery?: Delivery;
}

export type Delivery = "envoye" | "simule" | "echec";
export type AutomationKind = "back_in_stock" | "cart_1" | "cart_2" | "welcome" | "review" | "replenish" | "winback" | "sav_auto" | "new_product";

export interface SupportAi {
  /** auto = réponse standard envoyable sans relecture ; humain = cas spécifique, c'est à l'équipe de répondre. */
  triage: "auto" | "humain";
  reason: string;
  draft: string;
  /** ia = rédigé par Claude (clé ANTHROPIC_API_KEY) ; modele = réponse type complétée avec les données de la commande. */
  engine: "ia" | "modele";
  at: string;
  autoSent?: boolean;
  checked?: boolean;
}
export interface Automation {
  id: AutomationKind; name: string; description: string; trigger: string; enabled: boolean;
  delayHours: number; subject: string; body: string; updatedAt: string; lastRunAt?: string;
}
export interface AutomationRun {
  id: string; source: DataSource; at: string; automationId: AutomationKind; key: string; email: string; name: string;
  label: string; delivery: Delivery; detail?: string; converted?: boolean; revenue?: number;
}

/* ───────── Libellés ───────── */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  payee: "Payée", en_preparation: "En préparation", expediee: "Expédiée", livree: "Livrée", annulee: "Annulée", remboursee: "Remboursée",
};
export const CHANNEL_LABEL: Record<Channel, string> = {
  instagram: "Instagram (organique + influence)", tiktok: "TikTok", meta_ads: "Meta Ads", google_ads: "Google Ads", seo: "SEO / blog", newsletter: "Newsletter", parrainage: "Parrainage", direct: "Accès direct",
};
export const CHANNEL_SHORT: Record<Channel, string> = {
  instagram: "Instagram", tiktok: "TikTok", meta_ads: "Meta Ads", google_ads: "Google Ads", seo: "SEO", newsletter: "Newsletter", parrainage: "Parrainage", direct: "Direct",
};
export const CHANNELS: Channel[] = ["instagram", "tiktok", "meta_ads", "google_ads", "seo", "newsletter", "parrainage", "direct"];
export const PAID_CHANNELS: Channel[] = ["instagram", "tiktok", "meta_ads", "google_ads"];
export const PAYMENT_LABEL: Record<Payment, string> = { carte: "Carte bancaire", apple_pay: "Apple Pay", google_pay: "Google Pay", paypal: "PayPal" };
export const DEVICE_LABEL: Record<Device, string> = { mobile: "Mobile", desktop: "Ordinateur", tablette: "Tablette" };
export const LIFECYCLE_LABEL: Record<Lifecycle, string> = { abonne: "Abonné·e newsletter", lead: "Lead (compte créé)", client: "Client·e", fidele: "Client·e fidèle", vip: "VIP" };
export const CART_STATUS_LABEL: Record<CartStatus, string> = { abandonne: "Abandonné", relance: "Relancé", recupere: "Récupéré", perdu: "Perdu" };
export const CART_STEP_LABEL: Record<Cart["step"], string> = { panier: "Panier", livraison: "Livraison", paiement: "Paiement" };
/** Étapes du pipeline (« négociation » n'est plus proposée : les anciennes opportunités sont rattachées à « Proposition envoyée »). */
export const DEAL_STAGES: { id: DealStage; label: string; probability: number }[] = [
  { id: "prospect", label: "Nouveau", probability: 10 },
  { id: "qualifie", label: "Contacté", probability: 25 },
  { id: "proposition", label: "Proposition envoyée", probability: 55 },
  { id: "gagne", label: "Gagné", probability: 100 },
  { id: "perdu", label: "Perdu", probability: 0 },
];
export const DEAL_ORIGIN_LABEL: Record<DealOrigin, string> = { reseau_social: "Réseau social", partenaire: "Partenaire", salon: "Salon", site: "Site web", recommandation: "Recommandation" };
export const DEAL_TYPE_LABEL: Record<Deal["type"], string> = { institut: "Institut de beauté", concept_store: "Concept store", pharmacie: "Pharmacie / parapharmacie", spa: "Spa / hôtel", marketplace: "Marketplace", entreprise: "Cadeaux d'entreprise" };
export const TICKET_CATEGORY_LABEL: Record<Ticket["category"], string> = { livraison: "Livraison", produit: "Question produit", retour: "Retour / échange", conseil: "Conseil routine", paiement: "Paiement", compte: "Compte / Club" };
export const TICKET_CHANNEL_LABEL: Record<Ticket["channel"], string> = { email: "E-mail", chat: "Chat", instagram: "Instagram", telephone: "Téléphone", formulaire: "Formulaire de contact", chatbot: "Glow Assistant" };
export const DELIVERY_LABEL: Record<Delivery, string> = { envoye: "Envoyé", simule: "Simulé (démo)", echec: "Échec" };
/** Intentions du Glow Assistant : libellé et réponse donnée (résumé), pour le suivi dans le CRM. */
export const INTENT_LABEL: Record<string, { label: string; answer: string }> = {
  acne: { label: "Boutons / imperfections", answer: "Questionnaire en 2 étapes puis Clear Skin + nettoyant adapté, renvoi vers le Skin Diag" },
  glow: { label: "Peau terne, envie de glow", answer: "Conseils éclat + Glow Shot, Cloud Cream et kits Summer Glow / Glass Skin" },
  dry: { label: "Peau sèche", answer: "Aqua Plump sur peau humide + crème riche" },
  oily: { label: "Peau grasse", answer: "Clear Skin + gel-crème matifiant, ne pas décaper" },
  redness: { label: "Rougeurs / peau sensible", answer: "Calm Down, crème apaisante, SPF minéral + conseil médical si persistant" },
  routine: { label: "Trouver ma routine", answer: "Présentation du Skin Diag (10 questions, 2 min)" },
  discounts: { label: "Réductions / codes promo", answer: "Newsletter −20 % + programme SKINCLEAN Club" },
  order: { label: "Suivi de commande", answer: "Statut de la dernière commande ou invitation à se connecter" },
  stock: { label: "Produit introuvable / rupture", answer: "Vérifie la disponibilité et propose l'alerte de retour en stock" },
  contact: { label: "Parler à l'équipe", answer: "Formulaire de message transmis au service client (CRM)" },
  "cart-check": { label: "Compatibilité du panier", answer: "Analyse des actifs du panier (rétinoïde, acides, SPF)" },
  "faq-order": { label: "Ordre d'application des soins", answer: "Ordre SKINCLEAN du plus fluide au plus épais" },
  "faq-two-serums": { label: "Utiliser deux sérums", answer: "Oui, du plus fluide au plus ciblé, alterner rétinoïde et acides" },
  "faq-winter": { label: "Routine d'hiver", answer: "Winter Rescue Kit et Hydration Boost" },
  "faq-morning": { label: "Routine du matin", answer: "Nettoyant, sérum, crème, SPF" },
  "faq-budget": { label: "Routine petit budget", answer: "Routine essentielle calculée sur les prix du catalogue" },
  "faq-leaves": { label: "Gagner des feuilles (Club)", answer: "Barème des feuilles et paliers du Club" },
  "faq-rewards": { label: "Utiliser ses feuilles", answer: "Récompenses au panier et conditions" },
  "faq-find-routine": { label: "Retrouver ma routine", answer: "Compte, lien e-mail ou nouveau Skin Diag" },
  "faq-serum": { label: "Choisir un sérum", answer: "Guide des 5 sérums selon le besoin" },
  "serum-help": { label: "Aide sérum (suggestion)", answer: "Guide des 5 sérums selon le besoin" },
  "product-fit": { label: "Ce soin me convient-il ?", answer: "Types de peau et préoccupations du produit consulté" },
  "diag-help": { label: "Aide au Skin Diag", answer: "Explication des types de peau" },
  "club-help": { label: "Aide Club (suggestion)", answer: "Barème des feuilles et paliers du Club" },
  eyes: { label: "Cernes / contour des yeux", answer: "Gel caféine le matin, crème le soir" },
  lines: { label: "Ridules / anti-âge", answer: "SPF quotidien + bakuchiol ou rétinal progressif" },
  medical: { label: "Question médicale", answer: "Renvoi vers un·e médecin ou dermatologue" },
  menu: { label: "Retour au menu", answer: "Liste des sujets" },
  unknown: { label: "Question non comprise", answer: "Message d'incompréhension + menu des sujets" },
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = { ouvert: "Ouvert", en_cours: "En cours", resolu: "Résolu" };
export const MOVE_LABEL: Record<MoveReason, string> = { reception: "Réception fournisseur", ajustement: "Ajustement d'inventaire", retour: "Retour client", casse: "Casse / périmé", vente: "Vente" };
export const PO_STATUS_LABEL: Record<PoStatus, string> = { brouillon: "Brouillon", envoyee: "Envoyée au fournisseur", recue: "Réceptionnée", annulee: "Annulée" };
export const SKIN_LABEL: Record<Customer["skinType"], string> = { seche: "Sèche", grasse: "Grasse", mixte: "Mixte", normale: "Normale", sensible: "Sensible" };

/** Segments RFM (récence, fréquence, montant), inspirés des grilles standard du marché. */
export type RfmSegment = "champions" | "fideles" | "potentiels" | "nouveaux" | "prometteurs" | "attention" | "a_risque" | "a_ne_pas_perdre" | "hibernants" | "perdus";
export const RFM_LABEL: Record<RfmSegment, string> = {
  champions: "Champions", fideles: "Fidèles", potentiels: "Fidèles potentiels", nouveaux: "Nouveaux clients", prometteurs: "Prometteurs",
  attention: "À surveiller", a_risque: "À risque", a_ne_pas_perdre: "À ne pas perdre", hibernants: "En hibernation", perdus: "Perdus",
};
export const RFM_ACTION: Record<RfmSegment, string> = {
  champions: "Les récompenser : avant-premières, programme ambassadeur, demande d'avis.",
  fideles: "Proposer les coffrets et la montée en gamme (sérums, contour des yeux).",
  potentiels: "Inviter au Club et suggérer une routine complète.",
  nouveaux: "Séquence d'accueil : conseils d'utilisation, Skin Diag, 2ᵉ achat.",
  prometteurs: "Créer l'habitude : rappel de réapprovisionnement au bon moment.",
  attention: "Offre limitée dans le temps sur leurs produits habituels.",
  a_risque: "E-mail personnalisé + bon de réduction sur le prochain achat.",
  a_ne_pas_perdre: "Contact direct (e-mail personnel du service client), nouveautés ciblées.",
  hibernants: "Campagne de réactivation avec les best-sellers.",
  perdus: "Dernière tentative de réactivation, sinon exclure des envois coûteux.",
};
