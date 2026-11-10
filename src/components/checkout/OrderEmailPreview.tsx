"use client";
import { useState, useSyncExternalStore } from "react";
import type { Order } from "@/lib/store";
import { orderEmail } from "@/lib/order-email";

const noop = () => () => {};

/** Aperçu de l'e-mail de confirmation, tel qu'il arriverait dans la boîte de réception. */
export function OrderEmailPreview({ order, firstName, maxHeight = 1400 }: { order: Order; firstName?: string; maxHeight?: number }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const [h, setH] = useState(760);
  if (!origin) return null;
  const m = orderEmail(order, origin, firstName);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white text-left shadow-sm">
      <div className="flex items-start gap-3 border-b border-line px-4 py-3 text-sm">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-soft font-display">S</span>
        <div className="min-w-0 flex-1">
          <p className="flex justify-between gap-2"><b className="font-semibold">SKINCLEAN</b><span className="text-xs text-forest-soft">{new Date(order.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></p>
          <p className="truncate font-medium">{m.subject}</p>
          <p className="truncate text-xs text-forest-soft">À : {m.to || "client"}</p>
        </div>
      </div>
      <iframe title={`E-mail : ${m.subject}`} srcDoc={m.html} sandbox="allow-same-origin" scrolling="no" className="block w-full border-0 bg-[#F4F3EF]" style={{ height: h }}
        onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) setH(Math.min(d.documentElement.scrollHeight + 4, maxHeight)); }} />
    </div>
  );
}
