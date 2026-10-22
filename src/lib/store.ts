"use client";
/**
 * État client SKINCLEAN (Zustand + localStorage).
 * MODE DÉMO : comptes, fidélité, commandes de test et Skin Journal sont stockés sur l'appareil.
 * En production, ces données passent par l'API + PostgreSQL (voir prisma/schema.prisma et README).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { CartLine, Review } from "./types";
import type { DiagResult, RoutineItem, Answers } from "./diag";
import type { PriceOverrides } from "./catalog";
import { loyalty, reviewsConfig, welcomeOffer } from "@/data/config";
import { uid } from "./format";
import { findDemoAccount } from "@/data/demo-accounts";

export interface LedgerEntry { id: string; date: number; delta: number; label: string; status: "credited" | "pending" | "used" | "cancelled"; orderId?: string }
export interface Address { id: string; name: string; line1: string; line2?: string; zip: string; city: string; country: string; phone?: string; isDefault?: boolean }
export interface OrderLine { productId: string; variantId: string; name: string; size: string; qty: number; unit: number; bundle?: string }
export interface Order {
  id: string; date: number; email: string; lines: OrderLine[];
  subtotal: number; discount: number; shipping: number; total: number; leaves: number;
  gift?: string; status: "test" | "payee" | "expediee" | "livree" | "remboursee" | "retour-demande";
  paymentMode: "stripe" | "test"; paymentMethod?: "card" | "apple-pay" | "google-pay"; stripeSessionId?: string; address?: Address; code?: string;
}
export interface SavedRoutine { id: string; name: string; createdAt: number; diagId?: string; items: RoutineItem[]; link?: string; summary?: string }
export interface WelcomeCode { code: string; percent: number; expiresAt: number; used: boolean; email: string; /** Bon signé par le serveur, vérifié au paiement. */ voucher?: string }
export interface JournalEntry {
  id: string; day: number; date: number;
  /** Clé de la photo dans IndexedDB (jamais envoyée sur un serveur en mode démo). */
  photoKey?: string;
  hydration: number; imperfections: number; redness: number; glow: number;
  products: string[]; note: string; routineDone?: boolean;
}
export interface Journal { enabled: boolean; consentAt?: number; startDate?: number; reminders: boolean; routineId?: string; entries: JournalEntry[]; retentionMonths: number; /** Jours où la routine a été faite (YYYY-MM-DD). */ checkins?: string[] }
export interface Account {
  id: string; email: string; firstName: string; lastName: string; passwordHash: string; createdAt: number;
  birthday?: string; phone?: string; role?: "owner" | "manager" | "editor" | "support";
  addresses: Address[];
  newsletter: { status: "none" | "pending" | "confirmed"; confirmedAt?: number; marketing: boolean };
  ledger: LedgerEntry[]; orders: Order[]; routines: SavedRoutine[]; journal: Journal; favorites: string[];
}

interface State {
  // Panier
  cart: CartLine[];
  drawerOpen: boolean;
  lastAdded?: { productId: string; at: number };
  promoCode?: string;
  rewardId?: string;
  addToCart: (productId: string, variantId?: string, qty?: number, bundle?: CartLine["bundle"]) => void;
  addMany: (lines: { productId: string; variantId?: string; qty?: number }[], bundle?: CartLine["bundle"]) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  removeBundle: (bundleId: string) => void;
  clearCart: () => void;
  setDrawer: (o: boolean) => void;
  setPromo: (code?: string) => void;
  setReward: (id?: string) => void;
  // Favoris (invité)
  favorites: string[];
  toggleFavorite: (id: string) => void;
  // Comptes (démo)
  accounts: Record<string, Account>;
  session?: string;
  guestOrders: Order[];
  register: (a: { email: string; firstName: string; lastName: string; password: string; newsletter: boolean }) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateAccount: (patch: Partial<Account>) => void;
  // Fidélité / newsletter
  welcomeCodes: WelcomeCode[];
  newsletterClaimed: string[];
  pendingLeaves: Record<string, number>;
  confirmNewsletter: (email: string, issued: { code: string; voucher: string; expiresAt: number }) => { status: "ok" | "already"; code?: string; leavesCredited: boolean };
  addLedger: (e: Omit<LedgerEntry, "id" | "date"> & { date?: number }) => void;
  // Commandes
  recordOrder: (o: Omit<Order, "id" | "date"> & { id?: string }) => Order;
  setOrderStatus: (email: string, orderId: string, status: Order["status"]) => void;
  // Diag
  diagProgress?: { answers: Answers; index: number };
  diagPrefill?: Answers;
  diagHistory: DiagResult[];
  saveDiagProgress: (p?: { answers: Answers; index: number }) => void;
  setDiagPrefill: (a?: Answers) => void;
  pushDiag: (r: DiagResult) => void;
  updateDiagItems: (diagId: string, items: RoutineItem[]) => void;
  saveRoutine: (r: Omit<SavedRoutine, "id" | "createdAt">) => SavedRoutine | null;
  deleteRoutine: (id: string) => void;
  // Journal
  updateJournal: (patch: Partial<Journal>) => void;
  upsertJournalEntry: (e: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  // Admin (démo)
  overrides: PriceOverrides;
  kitDiscounts: Record<string, number>;
  setDiscountEnabled: boolean;
  homeHero: { title: string; subtitle: string; cta: string };
  setOverride: (productId: string, variantId: string, patch: { price?: number; stock?: number }) => void;
  setKitDiscount: (kitId: string, pct: number) => void;
  setSetDiscountEnabled: (b: boolean) => void;
  setHomeHero: (h: State["homeHero"]) => void;
  // Avis clients
  userReviews: Review[];
  helpfulVotes: string[];
  addReview: (r: Omit<Review, "id" | "date" | "author" | "verified" | "helpful">) => { ok: boolean; leaves: number; error?: string };
  voteHelpful: (id: string) => void;
  // Cookies
  consent?: { analytics: boolean; marketing: boolean; at: number };
  setConsent: (c: { analytics: boolean; marketing: boolean }) => void;
}

const lineKey = (productId: string, variantId: string, bundleId?: string) => `${productId}:${variantId}${bundleId ? `@${bundleId}` : ""}`;

async function hash(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("skinclean-demo::" + s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const emptyJournal = (): Journal => ({ enabled: false, reminders: true, entries: [], retentionMonths: 12 });

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchAccount = (fn: (a: Account) => Account) => {
        const email = get().session;
        if (!email) return;
        const acc = get().accounts[email];
        if (!acc) return;
        set({ accounts: { ...get().accounts, [email]: fn(acc) } });
      };
      return {
        cart: [],
        drawerOpen: false,
        addToCart: (productId, variantId = "std", qty = 1, bundle) => {
          const key = lineKey(productId, variantId, bundle?.id);
          const cart = [...get().cart];
          const i = cart.findIndex((l) => l.key === key);
          if (i >= 0) cart[i] = { ...cart[i], qty: Math.min(cart[i].qty + qty, 10) };
          else cart.push({ key, productId, variantId, qty, bundle });
          set({ cart, lastAdded: { productId, at: Date.now() } });
        },
        addMany: (lines, bundle) => {
          lines.forEach((l) => get().addToCart(l.productId, l.variantId ?? "std", l.qty ?? 1, bundle));
          set({ drawerOpen: true });
        },
        setQty: (key, qty) => set({ cart: get().cart.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)) }),
        removeLine: (key) => set({ cart: get().cart.filter((l) => l.key !== key) }),
        removeBundle: (id) => set({ cart: get().cart.filter((l) => l.bundle?.id !== id) }),
        clearCart: () => set({ cart: [], promoCode: undefined, rewardId: undefined }),
        setDrawer: (o) => set({ drawerOpen: o }),
        setPromo: (code) => set({ promoCode: code?.trim() || undefined }),
        setReward: (id) => set({ rewardId: id }),

        favorites: [],
        toggleFavorite: (id) => {
          const email = get().session;
          if (email && get().accounts[email]) {
            patchAccount((a) => ({ ...a, favorites: a.favorites.includes(id) ? a.favorites.filter((x) => x !== id) : [...a.favorites, id] }));
          } else {
            const f = get().favorites;
            set({ favorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
          }
        },

        accounts: {},
        guestOrders: [],
        register: async ({ email, firstName, lastName, password, newsletter }) => {
          const e = email.trim().toLowerCase();
          if (get().accounts[e]) return "Un compte existe déjà avec cet e-mail.";
          const acc: Account = {
            id: uid("u_"), email: e, firstName, lastName, passwordHash: await hash(password), createdAt: Date.now(),
            addresses: [], newsletter: { status: newsletter ? "pending" : "none", marketing: newsletter },
            ledger: [], orders: [], routines: [], journal: emptyJournal(), favorites: [...get().favorites],
          };
          // Rattachement : feuilles newsletter confirmées avant la création du compte
          const pending = get().pendingLeaves[e];
          if (pending) {
            acc.ledger.push({ id: uid("l_"), date: Date.now(), delta: pending, label: "Bonus newsletter confirmée", status: "credited" });
            acc.newsletter = { status: "confirmed", confirmedAt: Date.now(), marketing: true };
          }
          const { [e]: _drop, ...rest } = get().pendingLeaves;
          void _drop;
          set({ accounts: { ...get().accounts, [e]: acc }, session: e, pendingLeaves: rest, favorites: [] });
          return null;
        },
        login: async (email, password) => {
          const e = email.trim().toLowerCase();
          let acc = get().accounts[e];
          // Comptes de test : créés avec leur historique à la première connexion (src/data/demo-accounts.ts)
          if (!acc) {
            const demo = findDemoAccount(e, password);
            if (demo) {
              acc = { ...demo.build(), passwordHash: await hash(password) };
              set({ accounts: { ...get().accounts, [e]: acc } });
            }
          }
          if (!acc || acc.passwordHash !== (await hash(password))) return "E-mail ou mot de passe incorrect.";
          const favs = Array.from(new Set([...acc.favorites, ...get().favorites]));
          set({ session: e, accounts: { ...get().accounts, [e]: { ...acc, favorites: favs } }, favorites: [] });
          return null;
        },
        logout: () => set({ session: undefined, rewardId: undefined }),
        updateAccount: (p) => patchAccount((a) => ({ ...a, ...p })),

        welcomeCodes: [],
        newsletterClaimed: [],
        pendingLeaves: {},
        confirmNewsletter: (email, issued) => {
          const e = email.trim().toLowerCase();
          if (get().newsletterClaimed.includes(e)) {
            const existing = get().welcomeCodes.find((c) => c.email === e);
            return { status: "already", code: existing?.code, leavesCredited: false };
          }
          const code = issued.code;
          const wc: WelcomeCode = { code, percent: welcomeOffer.newsletterPercent, expiresAt: issued.expiresAt, used: false, email: e, voucher: issued.voucher };
          const acc = get().accounts[e];
          let leavesCredited = false;
          if (acc) {
            leavesCredited = true;
            set({
              accounts: {
                ...get().accounts,
                [e]: {
                  ...acc,
                  newsletter: { status: "confirmed", confirmedAt: Date.now(), marketing: true },
                  ledger: [...acc.ledger, { id: uid("l_"), date: Date.now(), delta: loyalty.newsletterBonus, label: "Bonus newsletter confirmée", status: "credited" }],
                },
              },
            });
          } else {
            set({ pendingLeaves: { ...get().pendingLeaves, [e]: loyalty.newsletterBonus } });
          }
          set({ newsletterClaimed: [...get().newsletterClaimed, e], welcomeCodes: [...get().welcomeCodes, wc] });
          return { status: "ok", code, leavesCredited };
        },
        addLedger: (entry) => patchAccount((a) => ({ ...a, ledger: [...a.ledger, { id: uid("l_"), date: entry.date ?? Date.now(), ...entry }] })),

        recordOrder: (o) => {
          const order: Order = { ...o, id: o.id ?? "SC-" + Date.now().toString(36).toUpperCase(), date: Date.now() };
          const email = get().session;
          // Code de bienvenue consommé
          if (o.code) set({ welcomeCodes: get().welcomeCodes.map((c) => (c.code === o.code ? { ...c, used: true } : c)) });
          if (email && get().accounts[email]) {
            const rw = loyalty.rewards.find((r) => r.id === get().rewardId);
            patchAccount((a) => ({
              ...a,
              orders: [order, ...a.orders],
              ledger: [
                ...a.ledger,
                ...(rw && o.discount > 0 ? [{ id: uid("l_"), date: Date.now(), delta: -rw.leaves, label: `Récompense utilisée : ${rw.label}`, status: "used" as const, orderId: order.id }] : []),
                ...(order.leaves > 0 ? [{ id: uid("l_"), date: Date.now(), delta: order.leaves, label: `Commande ${order.id}${order.paymentMode === "test" ? " (test)" : ""}`, status: "pending" as const, orderId: order.id }] : []),
              ],
            }));
          } else {
            set({ guestOrders: [order, ...get().guestOrders] });
          }
          return order;
        },
        setOrderStatus: (email, orderId, status) => {
          const acc = get().accounts[email];
          if (!acc) {
            set({ guestOrders: get().guestOrders.map((o) => (o.id === orderId ? { ...o, status } : o)) });
            return;
          }
          const ledger = acc.ledger.map((l) => {
            if (l.orderId !== orderId || l.delta <= 0) return l;
            if (status === "expediee" || status === "livree") return { ...l, status: "credited" as const };
            if (status === "remboursee") return { ...l, status: "cancelled" as const };
            return l;
          });
          set({ accounts: { ...get().accounts, [email]: { ...acc, ledger, orders: acc.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) } } });
        },

        diagHistory: [],
        saveDiagProgress: (p) => set({ diagProgress: p }),
        setDiagPrefill: (a) => set({ diagPrefill: a }),
        pushDiag: (r) => set({ diagHistory: [r, ...get().diagHistory].slice(0, 20), diagProgress: undefined }),
        updateDiagItems: (id, items) => set({ diagHistory: get().diagHistory.map((d) => (d.id === id ? { ...d, items } : d)) }),
        saveRoutine: (r) => {
          const email = get().session;
          if (!email) return null;
          const saved: SavedRoutine = { ...r, id: uid("r_"), createdAt: Date.now() };
          patchAccount((a) => ({ ...a, routines: [saved, ...a.routines] }));
          return saved;
        },
        deleteRoutine: (id) => patchAccount((a) => ({ ...a, routines: a.routines.filter((r) => r.id !== id) })),

        updateJournal: (p) => patchAccount((a) => ({ ...a, journal: { ...a.journal, ...p } })),
        upsertJournalEntry: (e) =>
          patchAccount((a) => {
            const i = a.journal.entries.findIndex((x) => x.id === e.id);
            const entries = [...a.journal.entries];
            if (i >= 0) entries[i] = e;
            else entries.push(e);
            entries.sort((x, y) => x.day - y.day);
            return { ...a, journal: { ...a.journal, entries } };
          }),
        deleteJournalEntry: (id) => patchAccount((a) => ({ ...a, journal: { ...a.journal, entries: a.journal.entries.filter((x) => x.id !== id) } })),

        overrides: {},
        kitDiscounts: {},
        setDiscountEnabled: false,
        homeHero: { title: "Your skin. Your glow.", subtitle: "Une peau qui rayonne, une routine qui te ressemble.", cta: "Découvrir SKINCLEAN" },
        setOverride: (pid, vid, patch) => {
          const o = { ...get().overrides };
          o[pid] = { ...(o[pid] ?? {}), [vid]: { ...(o[pid]?.[vid] ?? {}), ...patch } };
          set({ overrides: o });
        },
        setKitDiscount: (id, pct) => set({ kitDiscounts: { ...get().kitDiscounts, [id]: pct } }),
        setSetDiscountEnabled: (b) => set({ setDiscountEnabled: b }),
        setHomeHero: (h) => set({ homeHero: h }),

        userReviews: [],
        helpfulVotes: [],
        addReview: (r) => {
          const email = get().session;
          const acc = email ? get().accounts[email] : undefined;
          if (!acc) return { ok: false, leaves: 0, error: "Connecte-toi pour publier un avis." };
          const verified = acc.orders.some((o) => o.lines.some((l) => l.productId === r.productId));
          if (reviewsConfig.requirePurchase && !verified) return { ok: false, leaves: 0, error: "Seuls les clients ayant commandé ce produit peuvent laisser un avis." };
          if (get().userReviews.some((x) => x.productId === r.productId && x.authorEmail === acc.email))
            return { ok: false, leaves: 0, error: "Tu as déjà laissé un avis sur ce produit." };
          const review: Review & { authorEmail: string } = {
            ...r, id: uid("rv_"), date: new Date().toISOString().slice(0, 10),
            author: `${acc.firstName} ${acc.lastName.charAt(0).toUpperCase()}.`, verified, helpful: 0, authorEmail: acc.email,
          };
          // Bonus fidélité : 1 fois par mois maximum
          const monthAgo = Date.now() - 30 * 864e5;
          const already = acc.ledger.some((l) => l.label.startsWith("Bonus avis") && l.date > monthAgo);
          const leaves = already ? 0 : loyalty.reviewBonus;
          set({ userReviews: [review, ...get().userReviews] });
          if (leaves) get().addLedger({ delta: leaves, label: `Bonus avis — ${r.title ?? "avis produit"}`, status: "credited" });
          return { ok: true, leaves };
        },
        voteHelpful: (id) => {
          const v = get().helpfulVotes;
          set({ helpfulVotes: v.includes(id) ? v.filter((x) => x !== id) : [...v, id] });
        },

        setConsent: (c) => set({ consent: { ...c, at: Date.now() } }),
      };
    },
    {
      name: "skinclean-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { drawerOpen, lastAdded, ...rest } = s;
        return rest;
      },
    }
  )
);

/** Évite les écarts SSR / client : rendre les données persistées seulement après hydratation. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function useAccount() {
  const session = useStore((s) => s.session);
  const accounts = useStore((s) => s.accounts);
  return session ? accounts[session] : undefined;
}

export function useFavorites() {
  const acc = useAccount();
  const guest = useStore((s) => s.favorites);
  return acc ? acc.favorites : guest;
}

export function leavesBalance(acc?: Account) {
  if (!acc) return 0;
  return acc.ledger.filter((l) => l.status === "credited" || l.status === "used").reduce((s, l) => s + l.delta, 0);
}
export function leavesEarned12m(acc?: Account) {
  if (!acc) return 0;
  const since = Date.now() - loyalty.tierWindowMonths * 30 * 864e5;
  return acc.ledger.filter((l) => l.status === "credited" && l.delta > 0 && l.date >= since).reduce((s, l) => s + l.delta, 0);
}
export function pendingLeavesOf(acc?: Account) {
  if (!acc) return 0;
  return acc.ledger.filter((l) => l.status === "pending").reduce((s, l) => s + l.delta, 0);
}

export function useIsFirstOrder() {
  const acc = useAccount();
  const guestOrders = useStore((s) => s.guestOrders);
  if (acc) return acc.orders.filter((o) => o.status !== "remboursee").length === 0;
  return guestOrders.length === 0;
}

/** Petite couche IndexedDB pour les photos du Skin Journal (restent sur l'appareil). */
const DB = "skinclean-journal";
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function putPhoto(key: string, blob: Blob) {
  const db = await idb();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function getPhoto(key: string): Promise<Blob | undefined> {
  const db = await idb();
  return new Promise((res) => {
    const r = db.transaction("photos").objectStore("photos").get(key);
    r.onsuccess = () => res(r.result as Blob | undefined);
    r.onerror = () => res(undefined);
  });
}
export async function deletePhoto(key: string) {
  const db = await idb();
  return new Promise<void>((res) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").delete(key);
    tx.oncomplete = () => res();
  });
}
