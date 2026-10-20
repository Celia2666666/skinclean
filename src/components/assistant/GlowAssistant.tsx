"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { contextualHint, respond, welcomeQuick, type BotMessage, type FlowState } from "@/lib/assistant";
import { getKit, getProduct, kitPricing } from "@/lib/catalog";
import { useAccount, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Packshot } from "@/components/product/Packshot";
import { AddToCartButton } from "@/components/product/AddToCart";
import { PriceTag } from "@/components/product/PriceTag";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { CloseIcon, LeafIcon, ArrowIcon } from "@/components/ui/Icons";
import { euro } from "@/lib/format";

/**
 * Glow Assistant — conseiller skincare guidé, disponible sur tout le site.
 * Historique conservé pendant la session (sessionStorage).
 */
export function GlowAssistant() {
  const open = useUI((s) => s.assistantOpen);
  const intent = useUI((s) => s.assistantIntent);
  const openA = useUI((s) => s.openAssistant);
  const close = useUI((s) => s.closeAssistant);
  const pathname = usePathname();
  const router = useRouter();
  const cart = useStore((s) => s.cart);
  const setPrefill = useStore((s) => s.setDiagPrefill);
  const acc = useAccount();
  const guestOrders = useStore((s) => s.guestOrders);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [flow, setFlow] = useState<FlowState>({ data: {} });
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [hint, setHint] = useState<{ text: string; intent: string } | null>(null);
  const [hintClosed, setHintClosed] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  // Restaurer l'historique de session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("glow-chat");
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem("glow-chat", JSON.stringify(messages.slice(-60))); } catch {}
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Suggestion contextuelle discrète (après quelques secondes sur la page)
  useEffect(() => {
    setHint(null);
    const h = contextualHint(pathname);
    if (!h || hintClosed.includes(h.intent)) return;
    const t = setTimeout(() => setHint(h), 6000);
    return () => clearTimeout(t);
  }, [pathname, hintClosed]);

  const productId = pathname.startsWith("/produits/") ? getProduct(pathname.split("/")[2])?.id : undefined;

  const send = (value: string, label?: string) => {
    const userMsg: BotMessage = { from: "user", text: label ?? value };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);
    const { messages: replies, state } = respond(value, flow, {
      cart, loggedIn: !!acc, productId,
      orders: (acc?.orders ?? guestOrders).map((o) => ({ id: o.id, status: o.status, date: o.date })),
    });
    setFlow(state);
    replies.forEach((r, i) => setTimeout(() => {
      setMessages((m) => [...m, r]);
      if (i === replies.length - 1) setTyping(false);
    }, 550 + i * 650));
  };

  // Ouverture : accueil + éventuelle intention contextuelle
  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) setMessages([{ from: "bot", text: "Hello glow!  Comment je peux t'aider aujourd'hui ?", quick: welcomeQuick }]);
    if (intent) {
      const labels: Record<string, string> = { "cart-check": "Mes produits vont-ils bien ensemble ?", "product-fit": "Ce soin correspond-il à ma peau ?", "serum-help": "Aide-moi à choisir mon sérum", "diag-help": "J'ai une question sur le Skin Diag", "club-help": "Comment gagner plus de feuilles ?", "faq-winter": "Quel kit choisir ?" };
      send(intent, labels[intent] ?? intent);
    }
    setHint(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intent]);

  const goDiag = (prefill?: Record<string, string | string[]>) => {
    if (prefill) setPrefill(prefill);
    close();
    router.push("/skin-diag" + (prefill ? "?prefill=1" : ""));
  };

  return (
    <>
      {/* Suggestion contextuelle */}
      <AnimatePresence>
        {hint && !open && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-24 right-4 z-[45] flex max-w-[260px] items-start gap-2 rounded-[2px] rounded-br-sm bg-ivory p-3 text-sm shadow-[var(--shadow-lift)] md:right-6">
            <button className="text-left" onClick={() => openA(hint.intent)}>{hint.text}</button>
            <button aria-label="Fermer la suggestion" onClick={() => { setHintClosed((h) => [...h, hint.intent]); setHint(null); }} className="shrink-0 text-forest-soft"><CloseIcon size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant */}
      <motion.button
        onClick={() => (open ? close() : openA())}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-4 z-[46] grid h-14 w-14 place-items-center rounded-full bg-sage text-forest shadow-[var(--shadow-lift)] animate-pulse-ring md:right-6"
        aria-label={open ? "Fermer le Glow Assistant" : "Ouvrir le Glow Assistant"}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><CloseIcon /></motion.span>
          ) : (
            <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1, y: [0, -3, 0] }} transition={{ y: { repeat: Infinity, duration: 2.4 } }} exit={{ scale: 0 }}><LeafIcon size={26} /></motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Fenêtre de conversation */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog" aria-label="Glow Assistant"
            initial={{ opacity: 0, y: 30, scale: 0.92, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-2 bottom-24 top-20 z-[47] flex flex-col overflow-hidden rounded-none bg-cream shadow-2xl md:inset-x-auto md:right-6 md:top-auto md:h-[min(640px,78vh)] md:w-[400px]"
          >
            <div className="relative overflow-hidden bg-sage px-5 py-4">
              <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-sky/70 blur-xl" />
              <p className="relative font-display text-xl">Glow Assistant</p>
              <p className="relative text-xs text-forest/75">Assistant guidé SKINCLEAN · réponses prédéfinies, pas une IA</p>
            </div>
            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m, i) => <Message key={i} m={m} onQuick={send} onDiag={goDiag} onNavigate={close} last={i === messages.length - 1} />)}
              {typing && (
                <div className="flex w-16 gap-1 rounded-[2px] rounded-bl-sm bg-ivory px-4 py-3">
                  {[0, 1, 2].map((d) => <motion.span key={d} className="h-2 w-2 rounded-full bg-sage-deep" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.15 }} />)}
                </div>
              )}
            </div>
            <form className="flex gap-2 border-t border-line bg-ivory p-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(text.trim()); setText(""); } }}>
              <label htmlFor="glow-input" className="sr-only">Ta question</label>
              <input id="glow-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Pose ta question…" className="input rounded-full py-2.5" />
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-ivory" aria-label="Envoyer"><ArrowIcon size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Message({ m, onQuick, onDiag, onNavigate, last }: { m: BotMessage; onQuick: (v: string, l?: string) => void; onDiag: (p?: Record<string, string | string[]>) => void; onNavigate: () => void; last: boolean }) {
  const user = m.from === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex flex-col ${user ? "items-end" : "items-start"}`}>
      <div className={`max-w-[88%] whitespace-pre-line rounded-[2px] px-4 py-2.5 text-sm leading-relaxed ${user ? "rounded-br-sm bg-forest text-ivory" : "rounded-bl-sm bg-ivory"}`}>{m.text}</div>
      {m.products && (
        <div className="mt-2 w-full space-y-2">
          {m.products.map((id) => {
            const p = getProduct(id);
            if (!p) return null;
            return (
              <div key={id} className="flex gap-3 rounded-[2px] bg-ivory p-2.5">
                <div className="relative h-20 w-16 shrink-0 rounded-[2px] p-1" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} sizes="64px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{p.name}</p>
                  <p className="text-xs text-forest-soft">{p.benefits[0]}</p>
                  <PriceTag productId={p.id} className="text-sm font-semibold" />
                  <div className="mt-1.5 flex gap-1.5">
                    <Link href={`/produits/${p.slug}`} onClick={onNavigate} className="chip bg-sage-soft">Voir le produit</Link>
                    <AddToCartButton productId={p.id} label="Ajouter" openDrawer={false} className="px-3 py-1 text-[0.7rem]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {m.kits && (
        <div className="mt-2 flex w-full gap-2">
          {m.kits.map((slug) => {
            const k = getKit(slug);
            if (!k) return null;
            const pr = kitPricing(k);
            return (
              <Link key={slug} href={`/kits/${k.slug}`} onClick={onNavigate} className="flex-1 rounded-[2px] p-3 text-sm" style={{ background: k.color }}>
                <p className="font-semibold">{k.name}</p>
                <p className="text-xs">{euro(pr.price)} <span className="line-through opacity-60">{euro(pr.separate)}</span></p>
              </Link>
            );
          })}
        </div>
      )}
      {m.form === "newsletter" && <div className="mt-2 w-full rounded-[2px] bg-ivory p-3"><NewsletterForm variant="compact" cta="Je profite de -20 %" /></div>}
      {m.links && (
        <div className="mt-2 flex flex-wrap gap-2">
          {m.links.map((l) =>
            l.href === "/skin-diag" ? (
              <button key={l.label} onClick={() => onDiag(l.prefill as Record<string, string | string[]> | undefined)} className="btn btn-primary px-4 py-2 text-xs">{l.label}</button>
            ) : (
              <Link key={l.label} href={l.href} onClick={onNavigate} className="btn btn-soft px-4 py-2 text-xs">{l.label}</Link>
            )
          )}
        </div>
      )}
      {m.quick && last && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.quick.map((q, i) => (
            <motion.button key={q.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} onClick={() => onQuick(q.value, q.label)} className="border border-forest/20 bg-cream px-3 py-1.5 text-xs font-medium transition hover:bg-sage">
              {q.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
