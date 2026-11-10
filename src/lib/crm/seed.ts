import "server-only";
import { baseProducts } from "@/data/products";
import { baseKits } from "@/data/kits";
import { typeCategories } from "@/data/categories";
import { addDays, parseLocal, ymd, ymdhm } from "@/lib/hub/dates";
import { all, bulk, crmTx, setCrmMeta } from "./db";
import { DEFAULT_AUTOMATIONS } from "./automations";
import type {
  Activity, Automation, AutomationRun, Cart, Channel, ChatLog, CrmSettings, StockAlert, Customer, Deal, DealStage, Device, Order, OrderItem, OrderStatus, Payment, PurchaseOrder, Spend, StockItem, StockMove, Task, Ticket, Traffic,
} from "./types";
import type { Product } from "@/lib/types";

/**
 * JEU DE DÉMONSTRATION DU CRM (données fictives, travail d'école).
 * Généré de façon déterministe (graine fixe) à partir du VRAI catalogue SKINCLEAN (produits, prix, formats, coffrets),
 * sur ~14 mois glissants jusqu'au jour de la génération : croissance progressive, saisonnalité (Black Friday, Noël,
 * soldes, SPF l'été), heures et jours d'achat, codes promo, retours, paniers abandonnés relancés, réassorts.
 * Toutes les adresses e-mail sont en @example.com (domaine réservé, aucun envoi possible).
 * Chaque document porte source = "demo" : il n'est jamais additionné aux données réelles.
 */

const HISTORY_DAYS = 430;
const FIRST_NUMBER = 10241;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let R = rng(2026);
const r = () => R();
const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const chance = (p: number) => r() < p;
const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
function weighted<T>(items: readonly T[], w: (x: T) => number): T {
  let sum = 0;
  for (const x of items) sum += Math.max(0, w(x));
  let k = r() * sum;
  for (const x of items) {
    k -= Math.max(0, w(x));
    if (k <= 0) return x;
  }
  return items[items.length - 1];
}
const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number, l = 2) => String(n).padStart(l, "0");

/* ───────── Référentiels fictifs ───────── */
const FEMALE = ["Camille", "Léa", "Manon", "Chloé", "Emma", "Inès", "Sarah", "Jade", "Lucie", "Clara", "Louise", "Anaïs", "Pauline", "Juliette", "Marie", "Zoé", "Alice", "Lina", "Elsa", "Mathilde", "Océane", "Laura", "Margaux", "Romane", "Eva", "Nina", "Charlotte", "Agathe", "Yasmine", "Salomé", "Mélissa", "Justine", "Amandine", "Noémie", "Victoire", "Héloïse", "Maëlys", "Ambre", "Lou", "Iris", "Sofia", "Aya", "Nour", "Leïla", "Émilie", "Céline", "Sandrine", "Nathalie", "Isabelle", "Aurélie"];
const MALE = ["Lucas", "Hugo", "Thomas", "Nathan", "Théo", "Louis", "Maxime", "Antoine", "Adam", "Yanis", "Julien", "Paul", "Karim", "Mehdi", "Romain"];
const LAST = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Lefèvre", "Mercier", "Dupont", "Lambert", "Bonnet", "François", "Martinez", "Legrand", "Garnier", "Faure", "Rousseau", "Blanc", "Guerin", "Muller", "Henry", "Roussel", "Nicolas", "Perrin", "Morin", "Mathieu", "Clément", "Gauthier", "Dumont", "Lopez", "Fontaine", "Chevalier", "Robin", "Benali", "Haddad", "Nguyen", "Diallo", "Traoré", "Rossi", "Silva", "Ferreira", "Cohen", "Marchand"];
const CITIES: { city: string; zip: string; region: string; w: number }[] = [
  { city: "Paris", zip: "75011", region: "Île-de-France", w: 22 }, { city: "Boulogne-Billancourt", zip: "92100", region: "Île-de-France", w: 3 }, { city: "Versailles", zip: "78000", region: "Île-de-France", w: 2 },
  { city: "Lyon", zip: "69003", region: "Auvergne-Rhône-Alpes", w: 8 }, { city: "Grenoble", zip: "38000", region: "Auvergne-Rhône-Alpes", w: 2.5 }, { city: "Annecy", zip: "74000", region: "Auvergne-Rhône-Alpes", w: 1.5 },
  { city: "Marseille", zip: "13006", region: "Provence-Alpes-Côte d'Azur", w: 6 }, { city: "Nice", zip: "06000", region: "Provence-Alpes-Côte d'Azur", w: 3.5 }, { city: "Aix-en-Provence", zip: "13100", region: "Provence-Alpes-Côte d'Azur", w: 2 },
  { city: "Toulouse", zip: "31000", region: "Occitanie", w: 5.5 }, { city: "Montpellier", zip: "34000", region: "Occitanie", w: 4 },
  { city: "Bordeaux", zip: "33000", region: "Nouvelle-Aquitaine", w: 5 }, { city: "La Rochelle", zip: "17000", region: "Nouvelle-Aquitaine", w: 1.5 },
  { city: "Nantes", zip: "44000", region: "Pays de la Loire", w: 4.5 }, { city: "Angers", zip: "49000", region: "Pays de la Loire", w: 1.8 },
  { city: "Lille", zip: "59000", region: "Hauts-de-France", w: 4.5 }, { city: "Amiens", zip: "80000", region: "Hauts-de-France", w: 1.2 },
  { city: "Strasbourg", zip: "67000", region: "Grand Est", w: 3.5 }, { city: "Reims", zip: "51100", region: "Grand Est", w: 1.5 }, { city: "Metz", zip: "57000", region: "Grand Est", w: 1.3 },
  { city: "Rennes", zip: "35000", region: "Bretagne", w: 3.5 }, { city: "Brest", zip: "29200", region: "Bretagne", w: 1.3 },
  { city: "Rouen", zip: "76000", region: "Normandie", w: 2 }, { city: "Caen", zip: "14000", region: "Normandie", w: 1.6 },
  { city: "Dijon", zip: "21000", region: "Bourgogne-Franche-Comté", w: 1.8 }, { city: "Tours", zip: "37000", region: "Centre-Val de Loire", w: 1.8 },
  { city: "Bruxelles", zip: "1000", region: "Belgique", w: 2.5 }, { city: "Genève", zip: "1201", region: "Suisse", w: 1.2 }, { city: "Luxembourg", zip: "1111", region: "Luxembourg", w: 0.8 },
];
const SKINS: Customer["skinType"][] = ["mixte", "mixte", "grasse", "sensible", "seche", "normale", "sensible", "mixte"];

const COST_RATIO: Record<string, number> = { serum: 0.24, creme: 0.27, "contour-yeux": 0.24, nettoyant: 0.3, demaquillant: 0.3, toner: 0.29, "toner-pads": 0.33, spf: 0.31, masque: 0.36, patchs: 0.3, exfoliant: 0.3, brume: 0.28, "soin-cible": 0.27, accessoire: 0.45 };
const SUPPLIERS = { faconnier: "Laboratoire du Rhône (façonnier, fictif)", provence: "Atelier Provence Formulation (fictif)", pack: "PackOne Accessoires (fictif)" } as const;
const LEAD: Record<string, number> = { [SUPPLIERS.faconnier]: 21, [SUPPLIERS.provence]: 28, [SUPPLIERS.pack]: 12 };

export const categoryOf = (p: Product) => typeCategories.find((c) => c.types.includes(p.type))?.short ?? "Autres";

/* ───────── Saisonnalité ───────── */
const MONTH_F = [0.82, 0.88, 1, 1, 1.05, 1.1, 0.98, 0.8, 1.02, 1.06, 1.08, 1.22];
const WEEKDAY_F = [1.15, 1.05, 1, 1, 1, 0.94, 0.84]; // dimanche → samedi
const HOUR_W = [1, 0.6, 0.3, 0.2, 0.2, 0.3, 0.8, 1.5, 2.2, 2.6, 2.8, 3, 3.6, 3.4, 2.8, 2.6, 2.8, 3.2, 3.8, 4.6, 5.4, 5.6, 4.4, 2.4];
const TYPE_SEASON: Record<string, number[]> = {
  spf: [0.3, 0.35, 0.6, 1, 1.8, 2.6, 2.8, 2.4, 1.2, 0.6, 0.35, 0.3],
  brume: [0.6, 0.6, 0.8, 1, 1.3, 1.7, 1.9, 1.7, 1, 0.7, 0.6, 0.6],
  creme: [1.3, 1.25, 1.05, 1, 0.9, 0.85, 0.8, 0.85, 1, 1.1, 1.25, 1.35],
  masque: [1.2, 1.1, 1, 1, 1, 0.9, 0.9, 0.9, 1, 1.1, 1.3, 1.5],
};
function blackFridayOf(y: number) {
  const d = new Date(y, 10, 1);
  const firstThu = ((4 - d.getDay() + 7) % 7) + 1;
  return `${y}-11-${pad(firstThu + 22)}`;
}
function lastSundayOfMay(y: number) {
  const d = new Date(y, 4, 31);
  d.setDate(31 - d.getDay());
  return ymd(d);
}
interface DayCtx { day: string; promo?: { code: string; pct: number; p: number }; factor: number; conv: number }
function dayContext(day: string): DayCtx {
  const d = parseLocal(day);
  const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
  let factor = MONTH_F[m] * WEEKDAY_F[d.getDay()];
  let promo: DayCtx["promo"];
  let conv = 0.021;
  const bf = blackFridayOf(y);
  if (day >= addDays(bf, -4) && day <= addDays(bf, 3)) {
    factor *= day === bf ? 3.3 : day === addDays(bf, 3) ? 2.2 : 1.9;
    promo = { code: "BLACKFRIDAY25", pct: 25, p: 0.72 };
    conv = 0.034;
  } else if (m === 11 && dd <= 19) {
    factor *= 1.3;
    promo = { code: "NOEL15", pct: 15, p: 0.33 };
    conv = 0.026;
  } else if (m === 11 && dd >= 23) {
    factor *= 0.55;
  } else if ((m === 0 && dd >= 7) || (m === 1 && dd <= 3)) {
    factor *= 1.12;
    promo = { code: "SOLDES20", pct: 20, p: 0.38 };
    conv = 0.024;
  } else if (m === 1 && dd >= 9 && dd <= 14) {
    factor *= 1.18;
  } else {
    const fm = lastSundayOfMay(y);
    if (day >= addDays(fm, -8) && day <= addDays(fm, -1)) {
      factor *= 1.4;
      promo = { code: "FETEMERES15", pct: 15, p: 0.4 };
      conv = 0.026;
    }
  }
  return { day, promo, factor, conv };
}

/* ───────── Génération ───────── */
type GenCustomer = Customer & { w: number; last?: string; orders: number };

export function generateCrmDemo(today = ymd(new Date()), nowHm = ymdhm(new Date())) {
  R = rng(2026);
  const start = addDays(today, -HISTORY_DAYS);
  const catalog = baseProducts.filter((p) => p.variants.length);
  const launch = new Map<string, string>();
  for (const p of catalog) launch.set(p.id, p.isNew ? addDays(today, -int(60, 150)) : start);
  const popularity = new Map<string, number>();
  for (const p of catalog) popularity.set(p.id, (p.bestseller ? (9 - p.bestseller) * 1.7 + 3 : p.type === "accessoire" ? 1.2 : 2.4) * (0.6 + r() * 0.8));
  const costOf = (p: Product, price: number) => round2((price / 1.2) * (COST_RATIO[p.type] ?? 0.3) * (0.9 + r() * 0.2));
  const unitCost = new Map<string, number>();
  for (const p of catalog) for (const v of p.variants) unitCost.set(`${p.id}:${v.id}`, costOf(p, v.price));

  const customers: GenCustomer[] = [];
  const orders: Order[] = [];
  const carts: Cart[] = [];
  const traffic: Traffic[] = [];
  let seq = 0;
  const usedEmails = new Set<string>();

  const newPerson = () => {
    const female = chance(0.86);
    const firstName = female ? pick(FEMALE) : pick(MALE);
    const lastName = pick(LAST);
    const base = `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z.]/g, "");
    let email = `${base}@example.com`;
    for (let i = 2; usedEmails.has(email); i++) email = `${base}${i}@example.com`;
    usedEmails.add(email);
    return { firstName, lastName, email };
  };
  const newCustomer = (at: string, channel: Channel, concerns: string[]): GenCustomer => {
    const person = newPerson();
    const place = weighted(CITIES, (c) => c.w);
    const w = weighted([[0, 40], [0.6, 32], [1.6, 18], [4, 8], [9, 2]] as const, (x) => x[1])[0];
    const c: GenCustomer = {
      id: `cus_${pad(++seq, 5)}`, source: "demo", ...person, phone: chance(0.6) ? `06 39 98 ${pad(int(0, 99))} ${pad(int(0, 99))}` : undefined,
      city: place.city, zip: place.zip, region: place.region, createdAt: at, channel, skinType: pick(SKINS), concerns,
      birthYear: int(1968, 2006), optinEmail: chance(0.72), optinSms: chance(0.28), tags: [], w, orders: 0,
    };
    if (chance(0.34)) c.tags.push("Skin Diag réalisé");
    customers.push(c);
    return c;
  };

  const pickProduct = (day: string, exclude: Set<string>, near?: Product) => {
    const m = parseLocal(day).getMonth();
    const pool = catalog.filter((p) => !exclude.has(p.id) && (launch.get(p.id) ?? start) <= day);
    return weighted(pool, (p) => {
      let w = (popularity.get(p.id) ?? 1) * (TYPE_SEASON[p.type]?.[m] ?? 1);
      if (near) {
        if (p.step === near.step) w *= 0.25;
        if (p.concerns.some((c) => near.concerns.includes(c))) w *= 2.4;
      }
      return w;
    });
  };
  const line = (p: Product, qty = 1, kit?: { id: string; pct: number }): OrderItem => {
    const v = !kit && p.variants.length > 1 && chance(0.16) ? p.variants.find((x) => x.mini) ?? p.variants[0] : p.variants[0];
    return { productId: p.id, variantId: v.id, name: p.name, size: v.size, category: categoryOf(p), qty, unit: round2(v.price * (1 - (kit?.pct ?? 0) / 100)), cost: unitCost.get(`${p.id}:${v.id}`)!, kitId: kit?.id };
  };
  const basket = (day: string): OrderItem[] => {
    const m = parseLocal(day).getMonth();
    if (chance(0.075)) {
      const season = ["hiver", "hiver", "printemps", "printemps", "printemps", "ete", "ete", "ete", "automne", "automne", "automne", "hiver"][m];
      const kit = weighted(baseKits, (k) => (k.season ? (k.season === season ? 3 : 0.15) : 1));
      const items = kit.items.map((it) => catalog.find((p) => p.id === it.productId)).filter((p): p is Product => !!p).map((p) => line(p, 1, { id: kit.id, pct: kit.discountPercent }));
      if (items.length) return items;
    }
    const n = weighted([[1, 44], [2, 30], [3, 16], [4, 7], [5, 3]] as const, (x) => x[1])[0];
    const out: OrderItem[] = [];
    const seen = new Set<string>();
    let first: Product | undefined;
    for (let i = 0; i < n; i++) {
      const p = pickProduct(day, seen, first);
      seen.add(p.id);
      first ??= p;
      out.push(line(p, chance(0.09) ? 2 : 1));
    }
    return out;
  };

  const makeOrder = (at: string, c: GenCustomer, items: OrderItem[], ctx: DayCtx, channelOverride?: Channel): Order => {
    const firstOrder = c.orders === 0;
    const channel: Channel = channelOverride ?? (firstOrder ? c.channel : weighted([["newsletter", 34], ["direct", 30], ["instagram", 10], ["seo", 9], ["google_ads", 7], ["meta_ads", 5], ["tiktok", 5]] as const, (x) => x[1])[0]);
    const subtotal = round2(items.reduce((s, i) => s + i.unit * i.qty, 0));
    let promoCode: string | undefined;
    let discount = 0;
    const kitOnly = items.every((i) => i.kitId);
    if (ctx.promo && chance(ctx.promo.p) && !kitOnly) { promoCode = ctx.promo.code; discount = round2(subtotal * ctx.promo.pct / 100); }
    else if (firstOrder && chance(0.36)) { promoCode = "BIENVENUE10"; discount = round2(subtotal * 0.1); }
    else if (channel === "instagram" && chance(0.28)) { promoCode = "LEA15"; discount = round2(subtotal * 0.15); }
    else if (channel === "tiktok" && chance(0.22)) { promoCode = "TIKTOK10"; discount = round2(subtotal * 0.1); }
    else if (!firstOrder && subtotal > 40 && chance(0.08)) { promoCode = "CLUB5"; discount = 5; }
    const shipping = subtotal - discount >= 100 ? 0 : 10;
    c.orders++;
    c.last = at;
    return {
      id: `ord_${orders.length + 1}`, number: "", source: "demo", customerId: c.id, email: c.email, customerName: `${c.firstName} ${c.lastName}`,
      createdAt: at, status: "payee", channel, device: weighted([["mobile", 68], ["desktop", 27], ["tablette", 5]] as const, (x) => x[1])[0] as Device,
      payment: weighted([["carte", 52], ["apple_pay", 24], ["paypal", 16], ["google_pay", 8]] as const, (x) => x[1])[0] as Payment,
      items, subtotal, discount, promoCode, shipping, total: round2(subtotal - discount + shipping), city: c.city, region: c.region, firstOrder, history: [],
    };
  };

  // Prospects sans commande (abonnés newsletter, comptes créés après le Skin Diag)
  for (let i = 0; i < 420; i++) {
    const at = `${addDays(today, -int(0, HISTORY_DAYS))}T${pad(int(7, 23))}:${pad(int(0, 59))}`;
    const c = newCustomer(at, weighted([["newsletter", 30], ["instagram", 25], ["tiktok", 22], ["seo", 15], ["parrainage", 8]] as const, (x) => x[1])[0], [pick(["acne", "deshydratation", "eclat", "sensibilite", "rides", "taches"])]);
    c.w = chance(0.2) ? 0.4 : 0;
    if (chance(0.5)) c.tags.push("Lead Skin Diag");
  }
  const prospects = customers.slice();

  for (let k = 0; k <= HISTORY_DAYS; k++) {
    const day = addDays(start, k);
    const ctx = dayContext(day);
    const t = k / HISTORY_DAYS;
    const lambda = (3.6 + 7.4 * Math.pow(t, 1.25)) * ctx.factor;
    let count = Math.max(0, Math.round(lambda * (0.72 + r() * 0.56)));
    const isToday = day === today;
    const nowHour = isToday ? Number(nowHm.slice(11, 13)) : 23;
    if (isToday) count = Math.round(count * (HOUR_W.slice(0, nowHour + 1).reduce((a, b) => a + b, 0) / HOUR_W.reduce((a, b) => a + b, 0)));
    const hours = HOUR_W.map((w, h) => (h <= nowHour ? w : 0));
    const time = () => {
      const h = weighted(hours.map((w, h) => [h, w] as const), (x) => x[1])[0];
      return `${day}T${pad(h)}:${pad(int(0, isToday && h === nowHour ? Number(nowHm.slice(14, 16)) : 59))}`;
    };
    const dayOrders: Order[] = [];
    for (let i = 0; i < count; i++) {
      const at = time();
      const items = basket(day);
      const pNew = Math.max(0.42, 0.78 - 0.34 * t);
      let c: GenCustomer | undefined;
      if (!chance(pNew)) {
        c = weighted(customers, (x) => {
          if (!x.w || x.createdAt > at) return 0;
          if (!x.last) return x.w * 0.25; // prospect qui passe enfin commande
          const d = (parseLocal(at).getTime() - parseLocal(x.last).getTime()) / 864e5;
          return x.w * (d < 18 ? 0 : d < 30 ? 0.35 : d < 110 ? 1 : d < 220 ? 0.5 : 0.18);
        });
        if (!c.w) c = undefined;
      }
      c ??= newCustomer(at, weighted([["instagram", 22], ["tiktok", 18], ["google_ads", 14], ["meta_ads", 12], ["seo", 14], ["direct", 8], ["parrainage", 6], ["newsletter", 6]] as const, (x) => x[1])[0], [...new Set(items.flatMap((it) => catalog.find((p) => p.id === it.productId)?.concerns ?? []))].slice(0, 2));
      const o = makeOrder(at, c, items, ctx);
      orders.push(o);
      dayOrders.push(o);
    }

    // Paniers abandonnés identifiés (e-mail connu) sur les 90 derniers jours
    if (k >= HISTORY_DAYS - 90) {
      const nCarts = Math.round(Math.max(1, dayOrders.length) * (0.95 + r() * 0.5));
      for (let i = 0; i < nCarts; i++) {
        const at = time();
        const known = chance(0.5) ? weighted(customers, (x) => (x.createdAt <= at ? 1 : 0)) : undefined;
        const person = known ?? newPerson();
        const items = basket(day).map(({ cost: _c, ...it }) => it);
        const value = round2(items.reduce((s, it) => s + it.unit * it.qty, 0));
        const ageH = (parseLocal(nowHm).getTime() - parseLocal(at).getTime()) / 36e5;
        const cart: Cart = {
          id: `cart_${carts.length + 1}`, source: "demo", customerId: known?.id, email: person.email, name: `${person.firstName} ${person.lastName}`, createdAt: at,
          step: weighted([["panier", 46], ["livraison", 34], ["paiement", 20]] as const, (x) => x[1])[0], device: chance(0.76) ? "mobile" : chance(0.85) ? "desktop" : "tablette",
          items, value, status: "abandonne", relaunches: [],
        };
        if (ageH > 1 && chance(0.86)) { cart.relaunches.push({ at: ymdhm(new Date(parseLocal(at).getTime() + 36e5)), channel: "email", auto: true }); cart.status = "relance"; }
        if (ageH > 24 && cart.status === "relance" && chance(0.7)) cart.relaunches.push({ at: ymdhm(new Date(parseLocal(at).getTime() + 864e5)), channel: chance(0.2) ? "sms" : "email", auto: true });
        const recoverP = cart.step === "paiement" ? 0.2 : cart.step === "livraison" ? 0.13 : 0.08;
        if (ageH > 3 && chance(recoverP * (cart.relaunches.length ? 1 : 0.4))) {
          const rec = ymdhm(new Date(Math.min(parseLocal(nowHm).getTime() - 6e4, parseLocal(at).getTime() + int(2, 40) * 36e5)));
          const c = known ?? newCustomer(at, "direct", []);
          if (!known) { c.firstName = person.firstName; c.lastName = person.lastName; usedEmails.add(person.email); c.email = person.email; }
          const o = makeOrder(rec, c, items.map((it) => ({ ...it, cost: unitCost.get(`${it.productId}:${it.variantId}`)! })), dayContext(rec.slice(0, 10)), "newsletter");
          orders.push(o);
          cart.customerId = c.id;
          cart.status = "recupere";
          cart.recoveredOrderId = o.id;
          cart.recoveredAt = rec;
        } else if (ageH > 14 * 24) cart.status = "perdu";
        carts.push(cart);
      }
    }

    // Trafic du site (tunnel de conversion)
    const sessions = Math.round(Math.max(dayOrders.length, 1) / (ctx.conv * (0.85 + r() * 0.3)));
    traffic.push({ id: `tr_${day}`, day, sessions, productViews: Math.round(sessions * (0.52 + r() * 0.08)), addToCart: Math.round(sessions * (0.082 + r() * 0.016)), checkouts: Math.round(sessions * (0.043 + r() * 0.008)) });
  }

  // Numérotation chronologique et statuts selon l'ancienneté
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const now = parseLocal(nowHm).getTime();
  const at = (base: string, hours: number) => ymdhm(new Date(Math.min(now, parseLocal(base).getTime() + hours * 36e5)));
  const ordById = new Map<string, Order>();
  orders.forEach((o, i) => {
    ordById.set(o.id, o);
    o.number = `SC-${FIRST_NUMBER + i}`;
    const ageH = (now - parseLocal(o.createdAt).getTime()) / 36e5;
    const h: Order["history"] = [{ at: o.createdAt, status: "payee" }];
    let status: OrderStatus = "payee";
    if (chance(0.014) && ageH > 2) {
      status = "annulee";
      h.push({ at: at(o.createdAt, int(1, 10)), status, note: pick(["Annulée à la demande du client (erreur de format)", "Doublon de commande", "Adresse de livraison hors zone"]) });
    } else {
      if (ageH > 14) h.push({ at: at(o.createdAt, int(12, 20)), status: (status = "en_preparation") });
      if (ageH > 40) { h.push({ at: at(o.createdAt, int(26, 40)), status: (status = "expediee"), note: "Colissimo" }); o.tracking = `6A${int(10000000, 99999999)}${int(100, 999)}`; }
      if (ageH > 110) h.push({ at: at(o.createdAt, int(70, 110)), status: (status = "livree") });
      if (status === "livree" && chance(0.021)) {
        h.push({ at: at(o.createdAt, int(200, 400)), status: (status = "remboursee"), note: pick(["Retour : réaction cutanée (produit non adapté)", "Retour : colis abîmé", "Rétractation sous 14 jours", "Erreur de préparation"]) });
        o.refunded = o.total;
      }
    }
    o.status = status;
    o.history = h;
  });
  // Relier les paniers récupérés au numéro de commande
  for (const c of carts) if (c.recoveredOrderId) c.recoveredOrderId = ordById.get(c.recoveredOrderId)?.id;

  // Tags de cycle de vie
  for (const c of customers) {
    if (c.orders >= 6) c.tags.push("Profil ambassadeur");
    if (c.w >= 4 && c.orders >= 3) c.tags.push("Club Fleur");
  }

  /* Stock : couverture calculée sur les ventes des 30 derniers jours */
  const d30 = addDays(today, -30);
  const sold30 = new Map<string, number>();
  for (const o of orders) if (o.createdAt >= d30 && o.status !== "annulee") for (const it of o.items) sold30.set(`${it.productId}:${it.variantId}`, (sold30.get(`${it.productId}:${it.variantId}`) ?? 0) + it.qty);
  const stock: StockItem[] = [];
  for (const p of catalog) for (const v of p.variants) {
    const id = `${p.id}:${v.id}`;
    const supplier = p.type === "accessoire" ? SUPPLIERS.pack : ["serum", "contour-yeux", "soin-cible", "spf"].includes(p.type) ? SUPPLIERS.faconnier : SUPPLIERS.provence;
    const rate = (sold30.get(id) ?? 0) / 30;
    const leadDays = LEAD[supplier];
    const safetyStock = Math.max(3, Math.ceil(rate * 7));
    const reorderPoint = Math.max(6, Math.ceil(rate * leadDays + safetyStock));
    stock.push({ id, productId: p.id, variantId: v.id, name: p.name, size: v.size, category: categoryOf(p), price: v.price, cost: unitCost.get(id)!, qty: Math.round(rate * int(28, 110)) + int(6, 24), reorderPoint, safetyStock, leadDays, supplier, location: `Entrepôt Lyon — allée ${pick(["A", "B", "C"])}${int(1, 9)}`, updatedAt: nowHm });
  }
  const byRate = stock.slice().sort((a, b) => (sold30.get(b.id) ?? 0) - (sold30.get(a.id) ?? 0));
  for (const s of [byRate[4], byRate[11], byRate[19]]) if (s) s.qty = 0; // ruptures
  for (const s of [byRate[2], byRate[7], byRate[9], byRate[15], byRate[23]]) if (s) s.qty = int(s.safetyStock, Math.max(s.safetyStock, s.reorderPoint - 2)); // stock bas
  for (const s of byRate.slice(-3)) s.qty = Math.max(s.qty, 140); // stock dormant

  const moves: StockMove[] = [];
  const pos: PurchaseOrder[] = [];
  let poSeq = 0;
  for (const sup of Object.values(SUPPLIERS)) {
    const items = stock.filter((s) => s.supplier === sup);
    for (let d = 240; d > 20; d -= int(30, 45)) {
      const created = `${addDays(today, -d)}T10:${pad(int(0, 59))}`;
      const received = `${addDays(today, -d + LEAD[sup])}T${pad(int(8, 16))}:${pad(int(0, 59))}`;
      const lines = items.filter(() => chance(0.65)).map((s) => ({ stockId: s.id, label: `${s.name} — ${s.size}`, qty: Math.max(24, Math.ceil(((sold30.get(s.id) ?? 2) * 1.4) / 12) * 12), cost: s.cost }));
      if (!lines.length) continue;
      const po: PurchaseOrder = { id: `po_${++poSeq}`, number: `BC-${2400 + poSeq}`, supplier: sup, createdAt: created, expectedAt: received.slice(0, 10), status: "recue", lines, receivedAt: received };
      pos.push(po);
      for (const l of lines) moves.push({ id: `mv_${moves.length + 1}`, at: received, stockId: l.stockId, label: l.label, delta: l.qty, reason: "reception", ref: po.number, by: "SKINCLEAN" });
    }
  }
  // Réassorts en cours (dont une rupture)
  const rupture = stock.filter((s) => s.qty === 0);
  for (const [i, sup] of [SUPPLIERS.faconnier, SUPPLIERS.provence].entries()) {
    const lines = [...rupture.filter((s) => s.supplier === sup).slice(0, 1), ...stock.filter((s) => s.supplier === sup && s.qty > 0 && s.qty <= s.reorderPoint).slice(0, 2)]
      .map((s) => ({ stockId: s.id, label: `${s.name} — ${s.size}`, qty: Math.max(36, Math.ceil(((sold30.get(s.id) ?? 2) * 1.6) / 12) * 12), cost: s.cost }));
    if (!lines.length) continue;
    pos.push({ id: `po_${++poSeq}`, number: `BC-${2400 + poSeq}`, supplier: sup, createdAt: `${addDays(today, -int(3, 8))}T11:${pad(int(0, 59))}`, expectedAt: addDays(today, 4 + i * 6), status: "envoyee", lines });
  }
  for (const o of orders) if (o.status === "remboursee" && o.createdAt >= addDays(today, -60)) for (const it of o.items) moves.push({ id: `mv_${moves.length + 1}`, at: o.history.at(-1)!.at, stockId: `${it.productId}:${it.variantId}`, label: `${it.name} — ${it.size}`, delta: it.qty, reason: "retour", ref: o.number, note: "Retour client remis en stock après contrôle", by: "SKINCLEAN" });
  for (let i = 0; i < 6; i++) {
    const s = pick(stock);
    const reason = chance(0.5) ? "casse" : "ajustement";
    moves.push({ id: `mv_${moves.length + 1}`, at: `${addDays(today, -int(2, 80))}T17:${pad(int(0, 59))}`, stockId: s.id, label: `${s.name} — ${s.size}`, delta: -int(1, 4), reason, note: reason === "casse" ? "Flacon cassé à la préparation" : "Écart constaté à l'inventaire tournant", by: "SKINCLEAN" });
  }

  /* Dépenses marketing mensuelles (ROAS cible par canal) */
  const spend: Spend[] = [];
  const ROAS: Partial<Record<Channel, number>> = { google_ads: 4.3, meta_ads: 3.1, tiktok: 2.6, instagram: 3.6 };
  const revByMonthChannel = new Map<string, number>();
  for (const o of orders) if (o.firstOrder) revByMonthChannel.set(`${o.createdAt.slice(0, 7)}|${o.channel}`, (revByMonthChannel.get(`${o.createdAt.slice(0, 7)}|${o.channel}`) ?? 0) + o.total);
  const months = [...new Set(orders.map((o) => o.createdAt.slice(0, 7)))];
  for (const m of months) for (const ch of Object.keys(ROAS) as Channel[]) {
    const rev = revByMonthChannel.get(`${m}|${ch}`) ?? 0;
    const partial = m === today.slice(0, 7) ? Number(today.slice(8, 10)) / 30 : 1;
    spend.push({ id: `sp_${m}_${ch}`, month: m, channel: ch, amount: Math.round((rev / ROAS[ch]!) * (0.8 + r() * 0.4) + 120 * partial) });
  }

  /* Pipeline B2B (entreprises fictives) */
  const DEAL_TYPE_LABEL_SEED: Record<Deal["type"], string> = { institut: "institut de beauté", concept_store: "concept store", pharmacie: "pharmacie", spa: "spa", marketplace: "marketplace", entreprise: "cadeaux d'entreprise" };
  const DEALS: [string, string, Deal["type"], string, number, DealStage][] = [
    ["Institut Lumière de Peau", "Hélène Garnier", "institut", "Lyon", 4200, "proposition"],
    ["Maison Sève — concept store", "Bastien Morel", "concept_store", "Bordeaux", 6800, "proposition"],
    ["Pharmacie des Tilleuls", "Dr Claire Fontaine", "pharmacie", "Nantes", 9500, "qualifie"],
    ["Spa Les Rives", "Inès Haddad", "spa", "Annecy", 7400, "gagne"],
    ["Atelier Bien-Être", "Margaux Leroy", "institut", "Lille", 2600, "prospect"],
    ["Hôtel Clos des Vignes — spa", "Antoine Mercier", "spa", "Beaune", 11800, "proposition"],
    ["Glow Box (box beauté)", "Sarah Benali", "marketplace", "Paris", 15000, "proposition"],
    ["Concept store Nébuleuse", "Jade Rousseau", "concept_store", "Marseille", 3900, "gagne"],
    ["Institut Peau Neuve", "Lucie Perrin", "institut", "Rennes", 2100, "perdu"],
    ["Parapharmacie du Port", "Paul Gauthier", "pharmacie", "La Rochelle", 5200, "prospect"],
    ["Groupe Atlas — cadeaux CSE", "Nathalie Robin", "entreprise", "Paris", 8700, "qualifie"],
    ["Studio Prana Yoga", "Elsa Martin", "concept_store", "Paris", 1800, "gagne"],
    ["Salon Éclat", "Mélissa Diallo", "institut", "Toulouse", 3100, "qualifie"],
    ["Beauté Locale (marketplace)", "Romain Lambert", "marketplace", "Lille", 6400, "perdu"],
    ["Institut Douceur", "Céline Muller", "institut", "Strasbourg", 2900, "proposition"],
    ["Spa thermal Ondine", "Julien Faure", "spa", "Vichy", 9800, "prospect"],
    ["Pharmacie Centrale Saint-Michel", "Aurélie Bonnet", "pharmacie", "Grenoble", 7100, "proposition"],
    ["Institut Rose & Sauge", "Camille Blanc", "institut", "Montpellier", 2400, "prospect"],
    ["Pharmacie de la Croix-Rousse", "Dr Yanis Belkacem", "pharmacie", "Lyon", 6300, "qualifie"],
    ["BDE École de commerce Lyon", "Lina Moreau", "entreprise", "Lyon", 1500, "proposition"],
    ["Salle Équilibre Fitness", "Hugo Lefèvre", "concept_store", "Villeurbanne", 1200, "prospect"],
    ["Concept store Origines", "Manon Girard", "concept_store", "Nice", 3400, "gagne"],
    ["Spa urbain Bulle d'Eau", "Thomas Chevalier", "spa", "Paris", 5600, "perdu"],
  ];
  const ORDER_OF: DealStage[] = ["prospect", "qualifie", "proposition", "gagne"];
  const deals: Deal[] = DEALS.map(([company, contact, type, city, amount, stage], i) => {
    const created = `${addDays(today, -int(15, 150))}T${pad(int(9, 17))}:${pad(int(0, 59))}`;
    const steps = stage === "perdu" ? ORDER_OF.slice(0, int(2, 4)) : ORDER_OF.slice(0, ORDER_OF.indexOf(stage) + 1);
    const hist = steps.map((s, j) => ({ at: j === 0 ? created : `${addDays(created.slice(0, 10), j * int(6, 14))}T10:00`, stage: s }));
    if (stage === "perdu") hist.push({ at: `${addDays(hist.at(-1)!.at.slice(0, 10), int(5, 15))}T10:00`, stage: "perdu" });
    const closed = stage === "gagne" || stage === "perdu";
    const email = `${contact.toLowerCase().replace(/^dr /, "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").split(" ").join(".")}@example.com`;
    return {
      id: `deal_${i + 1}`, company, contact, email, type, city, stage, amount, createdAt: created, updatedAt: hist.at(-1)!.at, owner: "SKINCLEAN",
      closeDate: closed ? hist.at(-1)!.at.slice(0, 10) : addDays(today, int(5, 70)),
      nextStep: closed ? undefined : pick(["Envoyer les échantillons testeurs", "Rappeler pour valider les quantités", "Présenter la gamme en visio", "Envoyer la grille tarifaire revendeur", "Organiser une formation produit"]),
      lostReason: stage === "perdu" ? pick(["Budget gelé jusqu'à l'an prochain", "A choisi une marque déjà référencée chez son grossiste"]) : undefined,
      // Source du contact et téléphone fictif (plage 06 39 98 réservée aux œuvres de fiction par l'ARCEP)
      origin: (["reseau_social", "partenaire", "salon", "site", "recommandation"] as const)[i % 5],
      phone: `06 39 98 ${pad(10 + i)} ${pad((i * 37) % 100)}`,
      stageHistory: hist,
    };
  });

  /* Service client */
  const recent = orders.filter((o) => o.createdAt >= addDays(today, -75) && o.status !== "payee");
  const TPL: [Ticket["category"], string, string, string][] = [
    ["livraison", "Colis non reçu", "Bonjour, mon suivi indique « livré » mais je n'ai rien reçu. Pouvez-vous vérifier ?", "Bonjour, nous avons ouvert une enquête auprès de Colissimo. Si le colis n'est pas retrouvé sous 48 h, nous le renvoyons à nos frais."],
    ["livraison", "Délai de livraison", "Bonjour, ma commande est-elle bien partie ? J'en ai besoin pour un cadeau samedi.", "Bonjour, ton colis a été expédié hier, livraison prévue sous 48 h. Voici ton numéro de suivi."],
    ["produit", "Peut-on utiliser le sérum avec le rétinol ?", "Bonjour, j'ai le sérum niacinamide, est-ce que je peux l'utiliser le soir avec un rétinol ?", "Bonjour, oui : applique la niacinamide en premier, puis le rétinol un soir sur deux pour commencer. Pense au SPF le matin."],
    ["retour", "Réaction cutanée", "Bonjour, j'ai eu des rougeurs après deux utilisations. Puis-je retourner le produit ?", "Bonjour, désolés pour cet inconfort. Arrête l'utilisation ; nous t'envoyons une étiquette retour et remboursons le produit."],
    ["conseil", "Routine pour peau mixte", "Hello, j'ai la peau mixte avec des imperfections sur le menton, quelle routine me conseillez-vous ?", "Bonjour ! Le Skin Diag te propose une routine complète ; en résumé : Clear Foam, toner exfoliant 2 soirs/semaine, gel-crème léger et SPF."],
    ["paiement", "Code promo refusé", "Bonjour, le code BIENVENUE10 ne fonctionne pas sur mon panier.", "Bonjour, le code n'est pas cumulable avec les coffrets déjà remisés. Nous avons appliqué la remise manuellement sur ta commande."],
    ["compte", "Feuilles du Club non créditées", "Bonjour, je n'ai pas reçu mes feuilles pour ma dernière commande.", "Bonjour, les feuilles sont créditées à l'expédition : c'est fait depuis ce matin, tu peux les voir dans ton espace Club."],
    ["produit", "Produit coulé dans le colis", "Bonjour, le flacon de toner a fui dans le carton.", "Bonjour, toutes nos excuses : un nouveau flacon part aujourd'hui, inutile de nous renvoyer l'ancien."],
  ];
  const tickets: Ticket[] = [];
  const fresh = orders.filter((o) => o.createdAt >= addDays(today, -6) && o.status !== "annulee");
  for (let i = 0; i < 46 && recent.length; i++) {
    const isFresh = i < 7 && fresh.length > 0; // quelques demandes récentes encore ouvertes
    const o = isFresh ? pick(fresh) : pick(recent);
    const [category, subject, msg, answer] = weighted(TPL, (x) => (isFresh && ["Colis non reçu", "Réaction cutanée", "Produit coulé dans le colis", "Feuilles du Club non créditées"].includes(x[1]) ? 0 : x[0] === "livraison" ? 3 : x[0] === "produit" || x[0] === "conseil" ? 2 : 1));
    const created = isFresh ? ymdhm(new Date(Math.max(parseLocal(o.createdAt).getTime() + 36e5, now - int(1, 44) * 36e5))) : ymdhm(new Date(parseLocal(o.createdAt).getTime() + int(30, 200) * 36e5));
    if (created > nowHm) continue;
    const ageH = (now - parseLocal(created).getTime()) / 36e5;
    const status: Ticket["status"] = ageH < 20 ? (chance(0.5) ? "ouvert" : "en_cours") : ageH < 60 && chance(0.3) ? "en_cours" : "resolu";
    const first = status === "ouvert" ? undefined : int(6, 420);
    const t: Ticket = {
      id: `tk_${i + 1}`, number: `SAV-${3100 + i}`, source: "demo", customerId: o.customerId, customerName: o.customerName, orderId: o.id, subject, category,
      channel: weighted([["email", 45], ["chat", 30], ["instagram", 18], ["telephone", 7]] as const, (x) => x[1])[0], priority: category === "retour" || subject.includes("non reçu") ? "haute" : chance(0.1) ? "urgente" : chance(0.2) ? "basse" : "normale",
      status, createdAt: created, firstResponseMin: first, messages: [{ at: created, from: "client", body: msg }],
    };
    if (first) t.messages.push({ at: ymdhm(new Date(parseLocal(created).getTime() + first * 6e4)), from: "skinclean", body: answer });
    if (status === "resolu") { t.resolvedAt = ymdhm(new Date(parseLocal(created).getTime() + (first ?? 60) * 6e4 + int(1, 40) * 36e5)); if (chance(0.7)) t.csat = weighted([[5, 58], [4, 27], [3, 9], [2, 4], [1, 2]] as const, (x) => x[1])[0]; }
    tickets.push(t);
  }
  tickets.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  /* Notes et activités sur les fiches clients */
  const top = customers.filter((c) => c.orders >= 4).slice(0, 40);
  const NOTES: [Activity["kind"], string][] = [
    ["appel", "Souhaite des conseils pour passer au rétinol cet hiver. Recommandé de commencer 2 soirs par semaine."],
    ["note", "Très fidèle, a partagé sa routine en story Instagram (identification @skinclean)."],
    ["email", "E-mail personnel envoyé : remerciement + échantillon du nouveau sérum joint à la prochaine commande."],
    ["note", "Peau sensible confirmée : éviter les exfoliants forts dans les recommandations."],
    ["sms", "SMS de rappel de réapprovisionnement envoyé (sérum bientôt terminé)."],
  ];
  const activities: Activity[] = top.map((c, i) => {
    const [kind, body] = NOTES[i % NOTES.length];
    return { id: `act_${i + 1}`, at: `${addDays(today, -int(1, 90))}T${pad(int(9, 18))}:${pad(int(0, 59))}`, customerId: c.id, kind, body, by: "SKINCLEAN" };
  });
  const FIRST: Record<NonNullable<Deal["origin"]>, string> = {
    reseau_social: "Premier contact via un message reçu sur Instagram après une publication SKINCLEAN.",
    partenaire: "Mise en relation par un partenaire du réseau (créatrice de contenu ou pharmacie déjà cliente).",
    salon: "Rencontre sur le stand Skin Diag d'un salon professionnel de la beauté.",
    site: "Demande reçue via le formulaire « professionnels » du site.",
    recommandation: "Recommandé par un client professionnel satisfait.",
  };
  for (const d of deals) {
    const h = d.stageHistory;
    activities.push({ id: `act_${activities.length + 1}`, at: h[0].at, dealId: d.id, kind: "note", body: FIRST[d.origin ?? "site"], by: "SKINCLEAN" });
    if (h.length > 1) activities.push({ id: `act_${activities.length + 1}`, at: h[1].at, dealId: d.id, kind: "appel", body: `Appel de découverte avec ${d.contact} : besoins, volumes et clientèle (${DEAL_TYPE_LABEL_SEED[d.type]}).`, by: "SKINCLEAN" });
    if (h.length > 2) activities.push({ id: `act_${activities.length + 1}`, at: h[2].at, dealId: d.id, kind: "email", body: `Proposition envoyée : grille revendeur, ${Math.round(d.amount / 100) * 100} € HT estimés sur un an, échantillons joints.`, by: "SKINCLEAN" });
    if (d.stage === "gagne") activities.push({ id: `act_${activities.length + 1}`, at: h.at(-1)!.at, dealId: d.id, kind: "email", body: "Bon de commande signé, première livraison planifiée.", by: "SKINCLEAN" });
    if (d.stage === "perdu") activities.push({ id: `act_${activities.length + 1}`, at: h.at(-1)!.at, dealId: d.id, kind: "note", body: `Opportunité perdue : ${d.lostReason ?? "pas de suite"}. Relance prévue dans 6 mois.`, by: "SKINCLEAN" });
  }

  /* Tâches */
  const vip = customers.filter((c) => c.orders >= 5);
  const lowStock = stock.filter((s) => s.qty <= s.reorderPoint);
  const TASKS: Omit<Task, "id" | "createdAt">[] = [
    { title: `Appeler ${deals[0].contact} pour finaliser la commande revendeur`, due: today, done: false, priority: "haute", type: "appel", related: { kind: "deal", id: deals[0].id, label: deals[0].company } },
    { title: `Valider le bon de commande de réassort ${lowStock[0]?.name ?? ""}`, due: today, done: false, priority: "haute", type: "stock", related: lowStock[0] ? { kind: "produit", id: lowStock[0].id, label: `${lowStock[0].name} — ${lowStock[0].size}` } : undefined },
    { title: "Préparer la sélection Black Friday (stock des best-sellers)", due: addDays(today, 3), done: false, priority: "haute", type: "stock" },
    { title: `Envoyer les échantillons à ${deals[1].company}`, due: addDays(today, 1), done: false, priority: "normale", type: "email", related: { kind: "deal", id: deals[1].id, label: deals[1].company } },
    ...vip.slice(0, 3).map((c, i): Omit<Task, "id" | "createdAt"> => ({ title: `Remercier ${c.firstName} ${c.lastName} (VIP) et lui proposer le programme ambassadeurs`, due: addDays(today, i + 1), done: false, priority: "normale", type: "email", related: { kind: "client", id: c.id, label: `${c.firstName} ${c.lastName}` } })),
    { title: "Relancer manuellement les paniers abandonnés > 150 €", due: addDays(today, -1), done: false, priority: "haute", type: "relance" },
    { title: "Inventaire tournant allée B", due: addDays(today, 6), done: false, priority: "basse", type: "stock" },
    { title: "Rapprocher les remboursements Stripe du mois dernier", due: addDays(today, -3), done: true, priority: "normale", type: "admin" },
    { title: `Envoyer la grille revendeur à ${deals[6].company}`, due: addDays(today, -5), done: true, priority: "normale", type: "email", related: { kind: "deal", id: deals[6].id, label: deals[6].company } },
    { title: "Mettre à jour les coûts de revient après la hausse du flaconnage", due: addDays(today, 10), done: false, priority: "basse", type: "admin" },
  ];
  const tasks: Task[] = TASKS.map((t, i) => ({ ...t, id: `task_${i + 1}`, createdAt: `${addDays(today, -int(1, 10))}T09:00`, doneAt: t.done ? `${t.due}T16:00` : undefined }));

  /* Paramètres de rentabilité (modifiables dans le CRM) */
  const lastMonth = addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7);
  const lastRev = orders.filter((o) => o.createdAt.startsWith(lastMonth)).reduce((s, o) => s + o.total, 0);
  const settings: CrmSettings = {
    id: "settings", demoInbox: "demo@skinclean.example", redirectDemo: false, vatRate: 20, paymentFeePct: 1.5, paymentFeeFixed: 0.25, shippingCost: 6.9, packagingCost: 1.1, monthlyTarget: Math.ceil((lastRev * 1.12) / 1000) * 1000,
    fixedCosts: [
      { label: "Rémunérations et freelances", amount: 2400 }, { label: "Stockage et logistique (entrepôt)", amount: 650 }, { label: "Outils (site, e-mailing, comptabilité)", amount: 240 },
      { label: "Shootings et contenus", amount: 350 }, { label: "Assurance, banque, expert-comptable", amount: 210 },
    ],
  };

  const customerDocs: Customer[] = customers.map(({ w: _w, last: _l, orders: _o, ...c }) => c);
  return { customers: customerDocs, orders, carts, traffic, stock, moves, purchaseOrders: pos, spend, deals, tickets, activities, tasks, settings, prospects: prospects.length };
}

export function seedCrm() {
  const d = generateCrmDemo();
  crmTx(() => {
    bulk("customers", d.customers);
    bulk("orders", d.orders);
    bulk("carts", d.carts);
    bulk("traffic", d.traffic);
    bulk("stock", d.stock);
    bulk("moves", d.moves);
    bulk("purchaseOrders", d.purchaseOrders);
    bulk("spend", d.spend);
    bulk("deals", d.deals);
    bulk("tickets", d.tickets);
    bulk("activities", d.activities);
    bulk("tasks", d.tasks);
    bulk("settings", [d.settings]);
    setCrmMeta("seeded", new Date().toISOString());
  });
  seedCrmExtras();
}

/* ───────── Chatbot, alertes de stock, automatisations, messages de contact (démonstration) ───────── */
const CHAT_SAMPLES: Record<string, string[]> = {
  acne: ["J'ai des boutons", "j'ai des boutons sur le menton", "acné hormonale que faire", "points noirs sur le nez"],
  glow: ["Je veux une peau glowy", "teint terne le matin", "comment avoir plus d'éclat"],
  dry: ["Ma peau est sèche", "ma peau tiraille après la douche", "peau déshydratée en hiver"],
  oily: ["J'ai la peau grasse", "ma peau brille toute la journée", "pores dilatés"],
  redness: ["J'ai des rougeurs", "peau sensible qui réagit à tout", "rougeurs sur les joues"],
  routine: ["Trouver ma routine", "c'est quoi le skin diag", "quelle routine pour moi"],
  discounts: ["Comment avoir des réductions ?", "vous avez un code promo ?", "code de réduction première commande"],
  order: ["Suivre ma commande", "où est mon colis", "délai de livraison ?"],
  stock: ["Je ne trouve plus un produit", "je ne trouve plus le Cloud Gel", "quand revient le Spot Hero Day ?", "Polish Me en rupture ?", "le Cloud Gel est indisponible"],
  contact: ["Parler à l'équipe", "je veux parler à quelqu'un", "contacter le service client"],
  "cart-check": ["Mes produits vont-ils bien ensemble ?", "je peux mélanger rétinol et vitamine c ?"],
  "faq-order": ["dans quel ordre appliquer mes soins", "ordre de la routine"],
  "faq-two-serums": ["je peux utiliser deux sérums ?"],
  "faq-winter": ["routine pour l'hiver", "Quel kit choisir ?"],
  "faq-morning": ["routine du matin rapide"],
  "faq-budget": ["routine pour 40 €", "budget 30 euros"],
  "faq-leaves": ["comment gagner des feuilles", "Comment gagner plus de feuilles ?"],
  "faq-serum": ["quel sérum choisir", "Aide-moi à choisir mon sérum"],
  "product-fit": ["Ce soin correspond-il à ma peau ?"],
  eyes: ["cernes sous les yeux"],
  lines: ["premières rides", "ridules au coin des yeux"],
  medical: ["j'ai de l'eczéma", "allergie grave après un produit"],
  unknown: ["vous livrez en Suisse ?", "c'est vegan ?", "testé sur les animaux ?", "je suis enceinte je peux utiliser le sérum ?", "paiement en 3 fois possible ?", "vous avez une boutique physique ?", "le parfum est naturel ?", "vous faites des cartes cadeaux ?", "c'est fabriqué en France ?", "les emballages sont recyclables ?", "quelle différence avec la marque X ?", "je peux l'utiliser sur le corps ?"],
};
const CHAT_W: Record<string, number> = { acne: 15, glow: 10, dry: 9, oily: 9, redness: 7, routine: 9, discounts: 11, order: 10, stock: 7, contact: 3, "cart-check": 4, "faq-order": 4, "faq-two-serums": 2, "faq-winter": 3, "faq-morning": 2, "faq-budget": 3, "faq-leaves": 3, "faq-serum": 4, "product-fit": 3, eyes: 2, lines: 2, medical: 1, unknown: 9 };
const PAGES = ["/", "/soins-visage", "/produits/glow-shot-serum-vitamine-c", "/skin-diag", "/panier", "/club", "/kits", "/best-sellers", "/soins-visage/serums"];

export function seedCrmExtras(today = ymd(new Date()), nowHm = ymdhm(new Date())) {
  R = rng(4242);
  const now = parseLocal(nowHm).getTime();
  const orders = all("orders").filter((o) => o.source === "demo");
  const carts = all("carts").filter((c) => c.source === "demo");
  const customers = all("customers").filter((c) => c.source === "demo");
  const stock = all("stock");

  // Questions au Glow Assistant (60 jours, conversations de 1 à 4 questions)
  const chats: ChatLog[] = [];
  const intents = Object.keys(CHAT_W);
  for (let k = 60; k >= 0; k--) {
    const day = addDays(today, -k);
    const sessions = Math.round((orders.filter((o) => o.createdAt.startsWith(day)).length || 4) * (0.9 + r() * 0.6));
    for (let s = 0; s < sessions; s++) {
      const session = `demo${k}${s}`;
      let t = new Date(`${day}T${pad(weighted(HOUR_W.map((w, h) => [h, w] as const), (x) => x[1])[0])}:${pad(int(0, 59))}`).getTime();
      if (t > now) continue;
      const page = pick(PAGES);
      for (let q = 0, n = weighted([[1, 45], [2, 30], [3, 17], [4, 8]] as const, (x) => x[1])[0]; q < n && t <= now; q++) {
        const intent = weighted(intents, (x) => CHAT_W[x]);
        chats.push({ id: `chat_${chats.length + 1}`, source: "demo", at: ymdhm(new Date(t)), session, text: pick(CHAT_SAMPLES[intent]), intent, page });
        t += int(20, 180) * 1000;
      }
    }
  }

  // Alertes de retour en stock : en attente sur les ruptures, déjà envoyées sur les réassorts passés
  const alerts: StockAlert[] = [];
  const people = customers.filter((c) => c.optinEmail);
  const addAlert = (s: StockItem, at: string, status: StockAlert["status"], sentAt?: string) => {
    const c = chance(0.6) ? pick(people) : undefined;
    const email = c?.email ?? `${pick(FEMALE).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${pick(LAST).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}${int(1, 99)}@example.com`;
    alerts.push({ id: `al_${alerts.length + 1}`, source: "demo", createdAt: at, email, customerId: c?.id, productId: s.productId, variantId: s.variantId, label: `${s.name} — ${s.size}`, origin: chance(0.55) ? "chatbot" : "fiche_produit", status, sentAt, delivery: sentAt ? "simule" : undefined });
  };
  for (const s of stock.filter((x) => x.qty === 0)) for (let i = int(9, 22); i > 0; i--) addAlert(s, `${addDays(today, -int(0, 12))}T${pad(int(8, 23))}:${pad(int(0, 59))}`, "en_attente");
  const pastRestock = stock.filter((x) => x.qty > 0).slice(0, 4);
  for (const [i, s] of pastRestock.entries()) {
    const sent = `${addDays(today, -(8 + i * 9))}T10:${pad(int(0, 59))}`;
    for (let j = int(6, 14); j > 0; j--) addAlert(s, `${addDays(sent.slice(0, 10), -int(2, 15))}T${pad(int(8, 23))}:${pad(int(0, 59))}`, "envoyee", sent);
  }

  // Historique des automatisations (cohérent avec les relances déjà présentes sur les paniers)
  const runs: AutomationRun[] = [];
  const run = (automationId: AutomationRun["automationId"], at: string, key: string, email: string, name: string, label: string) => {
    if (at <= nowHm) runs.push({ id: `run_${runs.length + 1}`, source: "demo", at, automationId, key, email, name, label, delivery: "simule", detail: "Contact de démonstration : aucun e-mail envoyé" });
  };
  for (const c of carts) c.relaunches.filter((x) => x.auto && x.channel === "email").slice(0, 2).forEach((x, i) => run(i === 0 ? "cart_1" : "cart_2", x.at, `${i === 0 ? "cart_1" : "cart_2"}:${c.id}`, c.email, c.name, `Panier de ${c.value.toFixed(2).replace(".", ",")} €`));
  const since = addDays(today, -60);
  for (const o of orders) {
    if (o.createdAt < since || o.status === "annulee") continue;
    if (o.firstOrder) run("welcome", ymdhm(new Date(parseLocal(o.createdAt).getTime() + 2 * 36e5)), `welcome:${o.id}`, o.email, o.customerName, `Commande ${o.number}`);
    const delivered = o.history.find((h) => h.status === "livree")?.at;
    if (delivered && o.status === "livree") run("review", ymdhm(new Date(parseLocal(delivered).getTime() + 168 * 36e5)), `review:${o.id}`, o.email, o.customerName, `Commande ${o.number}`);
  }
  for (const a of alerts.filter((x) => x.status === "envoyee")) run("back_in_stock", a.sentAt!, `bis:${a.id}`, a.email, a.email.split("@")[0], a.label);
  for (const c of customers.filter((x) => x.optinEmail).slice(0, 2000)) if (chance(0.06)) run("replenish", `${addDays(today, -int(1, 55))}T09:${pad(int(0, 59))}`, `replenish:${c.id}:hist`, c.email, `${c.firstName} ${c.lastName}`, "Rappel de réachat");
  runs.sort((a, b) => a.at.localeCompare(b.at));
  const lastRun = runs.at(-1)?.at ?? nowHm;
  const automations: Automation[] = DEFAULT_AUTOMATIONS.map((a) => ({ ...a, updatedAt: `${addDays(today, -40)}T10:00`, lastRunAt: a.enabled ? lastRun : undefined }));

  // Messages reçus via le formulaire de contact et le Glow Assistant
  const MSG: [string, Ticket["category"], string][] = [
    ["Question produit", "produit", "Bonjour, le sérum Glow Shot convient-il aux peaux sensibles ? Merci !"],
    ["Ma commande", "livraison", "Bonjour, je n'ai pas reçu d'e-mail de confirmation pour ma commande, est-elle bien passée ?"],
    ["Retour / remboursement", "retour", "Bonjour, je souhaite échanger ma crème contre une version plus légère, est-ce possible ?"],
    ["SKINCLEAN Club", "compte", "Bonjour, mes feuilles n'apparaissent pas sur mon compte depuis ma dernière commande."],
    ["Message via le Glow Assistant", "conseil", "Je cherche une routine pour peau mixte avec un budget de 50 €, pouvez-vous m'aider ?"],
    ["Autre", "conseil", "Bonjour, proposez-vous des collaborations avec des créatrices de contenu ?"],
    ["Message via le Glow Assistant", "produit", "Le Cloud Gel revient quand ? C'est mon nettoyant préféré !"],
    ["Question produit", "produit", "Vos produits sont-ils compatibles avec la grossesse ?"],
  ];
  const tickets: Ticket[] = [];
  for (let i = 0; i < 16; i++) {
    const c = pick(customers);
    const [subject, category, body] = MSG[i % MSG.length];
    const at = i < 4 ? ymdhm(new Date(now - int(1, 26) * 36e5)) : `${addDays(today, -int(1, 20))}T${pad(int(8, 22))}:${pad(int(0, 59))}`; // quelques messages récents non traités
    if (at > nowHm) continue;
    const old = (now - parseLocal(at).getTime()) / 36e5 > 30;
    const status: Ticket["status"] = i < 4 ? "ouvert" : old && chance(0.8) ? "resolu" : chance(0.4) ? "en_cours" : "ouvert";
    const t: Ticket = { id: `msg_${i + 1}`, number: `MSG-${4900 + i}`, source: "demo", customerId: c.id, customerName: `${c.firstName} ${c.lastName}`, email: c.email, subject, category, channel: subject.includes("Glow") ? "chatbot" : "formulaire", priority: category === "retour" ? "haute" : "normale", status, createdAt: at, messages: [{ at, from: "client", body }] };
    if (status !== "ouvert") { const m = int(25, 600); t.firstResponseMin = m; t.messages.push({ at: ymdhm(new Date(parseLocal(at).getTime() + m * 6e4)), from: "skinclean", body: "Bonjour, merci pour ton message ! Nous revenons vers toi avec une réponse détaillée." }); }
    if (status === "resolu") t.resolvedAt = ymdhm(new Date(parseLocal(at).getTime() + int(4, 30) * 36e5));
    tickets.push(t);
  }

  crmTx(() => {
    bulk("chats", chats);
    bulk("alerts", alerts);
    bulk("runs", runs);
    bulk("automations", automations);
    bulk("tickets", tickets);
    setCrmMeta("seed-extras-v1", new Date().toISOString());
  });
}

/* ───────── Boîte SAV de démonstration : demandes récentes non traitées (tri et réponses automatiques) ───────── */
const SAV_INBOX: [string, string, Ticket["category"], Ticket["channel"], boolean][] = [
  ["Où en est ma commande ?", "Bonjour, j'ai commandé il y a quelques jours, est-ce que ma commande est bien partie ? Merci !", "livraison", "email", true],
  ["Code BIENVENUE refusé", "Bonjour, mon code de bienvenue ne fonctionne pas sur mon panier, pourquoi ?", "paiement", "chat", true],
  ["Mes feuilles du Club", "Hello, je ne vois pas encore mes feuilles pour ma dernière commande, c'est normal ?", "compte", "formulaire", true],
  ["Quelle routine pour peau mixte ?", "Coucou, j'ai la peau mixte avec des imperfections sur le menton, vous me conseillez quoi le soir ?", "conseil", "chatbot", true],
  ["Le Cloud Gel revient quand ?", "Bonjour, le Cloud Gel est en rupture, il revient bientôt ? C'est mon nettoyant préféré.", "produit", "instagram", true],
  ["Ordre des soins", "Dans quel ordre je mets le sérum et la crème le soir ?", "conseil", "chat", true],
  ["Rougeurs après le sérum", "Bonjour, depuis deux jours j'ai des rougeurs et ça brûle un peu après le sérum Glow Shot. Que dois-je faire ?", "produit", "email", false],
  ["Colis arrivé abîmé", "Le carton est arrivé écrasé et le flacon de toner a coulé partout. Je fais comment ?", "livraison", "formulaire", false],
  ["Enceinte : produits compatibles ?", "Je suis enceinte de 4 mois, est-ce que je peux continuer le Night Renew ?", "conseil", "chatbot", false],
  ["Je veux être remboursée", "Bonjour, la crème ne me convient pas du tout, je souhaite être remboursée.", "retour", "email", false],
  ["Collaboration Instagram", "Hello ! Je suis créatrice de contenu skincare (25k abonnés), seriez-vous partants pour une collaboration ?", "conseil", "instagram", false],
  ["Supprimer mon compte", "Bonjour, je souhaite que vous supprimiez mon compte et toutes mes données personnelles.", "compte", "formulaire", false],
];

export function seedSupportInbox(nowHm = ymdhm(new Date())) {
  R = rng(777);
  const now = parseLocal(nowHm).getTime();
  const customers = all("customers").filter((c) => c.source === "demo" && c.optinEmail);
  const orders = all("orders").filter((o) => o.source === "demo" && o.status !== "annulee");
  const tickets: Ticket[] = SAV_INBOX.map(([subject, body, category, channel], i) => {
    const o = orders[orders.length - 1 - int(0, 60)];
    const c = customers.find((x) => x.id === o.customerId) ?? pick(customers);
    const at = ymdhm(new Date(now - int(10, 30 * 60) * 6e4));
    return {
      id: `sav_${i + 1}`, number: `SAV-${3300 + i}`, source: "demo", customerId: c.id, customerName: `${c.firstName} ${c.lastName}`, email: c.email,
      orderId: category === "livraison" || category === "retour" || i === 0 ? o.id : undefined, subject, category, channel,
      priority: category === "retour" ? "haute" : "normale", status: "ouvert", createdAt: at, messages: [{ at, from: "client", body }],
    } as Ticket;
  });
  crmTx(() => {
    bulk("tickets", tickets);
    setCrmMeta("seed-sav-v1", new Date().toISOString());
  });
}
