import type { Account, LedgerEntry, Order, SavedRoutine } from "@/lib/store";
import type { RoutineStep } from "@/lib/types";
import { getProduct } from "@/lib/catalog";

/**
 * COMPTES DE TEST — démonstration uniquement (travail d'école, données fictives).
 * Utilisables sur /compte/connexion (boutons « Compte de test » qui remplissent le formulaire).
 * Le compte est créé dans le navigateur à la première connexion, avec son historique ci-dessous.
 * Ne jamais réutiliser ces mots de passe ailleurs.
 */
export interface DemoAccount {
  label: string;
  description: string;
  email: string;
  password: string;
  build: () => Omit<Account, "passwordHash">;
}

const DAY = 864e5;
const now = () => Date.now();

function line(productId: string, qty = 1) {
  const p = getProduct(productId)!;
  const v = p.variants[0];
  return { productId, variantId: v.id, name: p.name, size: v.size, qty, unit: v.price };
}

function order(id: string, daysAgo: number, email: string, ids: string[], status: Order["status"]): Order {
  const lines = ids.map((x) => line(x));
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const shipping = subtotal >= 39 ? 0 : 4.9;
  return {
    id, date: now() - daysAgo * DAY, email, lines, subtotal, discount: 0, shipping,
    total: Math.round((subtotal + shipping) * 100) / 100, leaves: Math.floor(subtotal),
    status, paymentMode: "test",
    address: { id: "ad_demo", name: "Camille Martin", line1: "12 rue des Lilas", zip: "75011", city: "Paris", country: "France", isDefault: true },
  };
}

const address = { id: "ad_demo", name: "Camille Martin", line1: "12 rue des Lilas", zip: "75011", city: "Paris", country: "France", phone: "06 00 00 00 00", isDefault: true };

export const demoAccounts: DemoAccount[] = [
  {
    label: "Cliente fidèle",
    description: "2 commandes livrées, 1 en cours d'expédition, feuilles SKINCLEAN Club (palier Bourgeon), routine enregistrée, favoris.",
    email: "camille@skinclean.test",
    password: "Glow-2026!",
    build: () => {
      const email = "camille@skinclean.test";
      const o1 = order("SC-DEMO-0001", 120, email, ["sc-cl-01", "sc-sr-01", "sc-cr-03", "sc-sp-01"], "livree");
      const o2 = order("SC-DEMO-0002", 45, email, ["sc-sr-02", "sc-tn-01", "sc-pt-01"], "livree");
      const o3 = order("SC-DEMO-0003", 3, email, ["sc-ms-02", "sc-ey-01"], "expediee");
      const ledger: LedgerEntry[] = [
        { id: "l_d1", date: now() - 130 * DAY, delta: 100, label: "Bonus newsletter confirmée", status: "credited" },
        { id: "l_d2", date: o1.date + 2 * DAY, delta: o1.leaves, label: `Commande ${o1.id}`, status: "credited", orderId: o1.id },
        { id: "l_d3", date: o2.date + 2 * DAY, delta: o2.leaves, label: `Commande ${o2.id}`, status: "credited", orderId: o2.id },
        { id: "l_d4", date: now() - 40 * DAY, delta: 20, label: "Bonus avis — Clear Skin", status: "credited" },
        { id: "l_d5", date: o3.date + 1 * DAY, delta: o3.leaves, label: `Commande ${o3.id}`, status: "credited", orderId: o3.id },
        { id: "l_d6", date: now() - 30 * DAY, delta: 140, label: "Bonus anniversaire + offre fidélité", status: "credited" },
      ];
      const step = (productId: string, s: RoutineStep, moments: ("matin" | "soir")[]) => ({
        step: s, productId, variantId: "std", moments, reason: "Routine enregistrée (compte de test).", alternatives: [], selected: true, frequency: getProduct(productId)!.frequency,
      });
      const routine: SavedRoutine = {
        id: "r_demo", name: "Ma routine peau mixte", createdAt: now() - 50 * DAY, summary: "Peau mixte · Une peau plus nette",
        items: [
          step("sc-cl-02", "nettoyage", ["matin", "soir"]),
          step("sc-tn-01", "tonique", ["matin", "soir"]),
          step("sc-sr-01", "serum", ["matin", "soir"]),
          step("sc-cr-03", "hydratation", ["matin", "soir"]),
          step("sc-sp-01", "protection", ["matin"]),
        ],
      };
      return {
        id: "u_demo_camille", email, firstName: "Camille", lastName: "Martin", createdAt: now() - 140 * DAY,
        birthday: "2001-04-12", phone: address.phone, addresses: [address],
        newsletter: { status: "confirmed", confirmedAt: now() - 130 * DAY, marketing: true },
        ledger, orders: [o3, o2, o1], routines: [routine],
        journal: { enabled: false, reminders: true, entries: [], retentionMonths: 12 },
        favorites: ["sc-sr-02", "sc-cr-01", "sc-ms-01"],
      };
    },
  },
  {
    label: "Nouvelle cliente",
    description: "Aucune commande : idéal pour tester le cadeau de 1ʳᵉ commande, le Skin Diag et la newsletter.",
    email: "lea@skinclean.test",
    password: "Glow-2026!",
    build: () => ({
      id: "u_demo_lea", email: "lea@skinclean.test", firstName: "Léa", lastName: "Durand", createdAt: now(),
      addresses: [], newsletter: { status: "none", marketing: false },
      ledger: [], orders: [], routines: [], journal: { enabled: false, reminders: true, entries: [], retentionMonths: 12 }, favorites: [],
    }),
  },
];

export const findDemoAccount = (email: string, password: string) =>
  demoAccounts.find((d) => d.email === email.trim().toLowerCase() && d.password === password);
