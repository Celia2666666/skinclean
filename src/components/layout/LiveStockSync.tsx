"use client";
import { useEffect } from "react";
import { setLiveStock } from "@/lib/live-stock";
import { useStore } from "@/lib/store";

/** Charge le stock du CRM (local) au montage, au retour sur l'onglet et toutes les 60 s, puis redessine les composants de prix/stock. */
export function LiveStockSync() {
  useEffect(() => {
    let stop = false;
    const load = () => fetch("/api/stock", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (stop || d?.source !== "crm") return;
      setLiveStock(d.stock ?? {}, "crm");
      useStore.setState((s) => ({ overrides: { ...s.overrides } })); // nouvelle référence : les abonnés se redessinent
    }).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => { stop = true; clearInterval(t); document.removeEventListener("visibilitychange", onFocus); };
  }, []);
  return null;
}
