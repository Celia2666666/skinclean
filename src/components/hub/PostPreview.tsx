"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { EmailBlock, EmailCampaign, Post } from "@/lib/hub/types";
import { renderEmailHtml } from "@/lib/hub/email-html";
import { DesignPreview, VisualThumb } from "./design/DesignPreview";
import { designToDataUrl } from "./design/render";
import { BlogI, BookmarkI, ChevronLeftI, ChevronRightI, CommentI, HeartI, MailI, PlusI, SendI, ShareI } from "./icons";

/**
 * Simulations fidèles de l'affichage sur chaque plateforme.
 * Aucun compteur (likes, vues) n'est inventé : seuls les pictogrammes sont affichés.
 */

/** Photo de profil SKINCLEAN : symbole du logo parfaitement centré dans un cercle. */
export function BrandAvatar({ size = 32, ring }: { size?: number; ring?: boolean }) {
  return (
    <span className={clsx("relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#EDF0EA]", ring ? "ring-2 ring-white" : "ring-1 ring-black/5")} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/brand/transparent/logo-mark.png" alt="" className="block object-contain" style={{ width: size * 0.56, height: size * 0.7 }} />
    </span>
  );
}

function Caption({ text, hashtags, max = 125, name = "skinclean" }: { text: string; hashtags: string[]; max?: number; name?: string }) {
  const [open, setOpen] = useState(false);
  const full = `${text}${hashtags.length ? `\n\n${hashtags.join(" ")}` : ""}`;
  const short = full.length > max && !open ? full.slice(0, max).trimEnd() : full;
  return (
    <p className="whitespace-pre-line text-left text-[13px] leading-[1.4]">
      <span className="font-semibold">{name}</span>{" "}
      {short.split(/(#[\p{L}0-9_]+)/u).map((part, i) => (part.startsWith("#") ? <span key={i} className="text-[#00376B]">{part}</span> : part))}
      {full.length > max && !open && <button onClick={() => setOpen(true)} className="text-[#737373]">… plus</button>}
    </p>
  );
}

function Pager({ count, index, set }: { count: number; index: number; set: (n: number) => void }) {
  if (count < 2) return null;
  return (
    <>
      {index > 0 && <button aria-label="Slide précédente" onClick={() => set(index - 1)} className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronLeftI size={14} /></button>}
      {index < count - 1 && <button aria-label="Slide suivante" onClick={() => set(index + 1)} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronRightI size={14} /></button>}
      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{index + 1}/{count}</span>
    </>
  );
}

function Instagram({ post }: { post: Post }) {
  const [page, setPage] = useState(0);
  const pages = post.visual?.kind === "design" ? post.visual.design?.pages.length ?? 1 : 1;
  const isVideo = post.visual?.kind === "video";
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-[#DBDBDB] bg-white font-sans text-[#262626] shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <BrandAvatar size={32} />
        <div className="min-w-0 flex-1 leading-tight"><p className="text-[13px] font-semibold">skinclean</p><p className="text-[11px] text-[#737373]">{post.format === "reel" ? "Son original" : "SKINCLEAN"}</p></div>
        <span className="text-lg leading-none tracking-widest text-[#262626]">···</span>
      </div>
      <div className={clsx("relative overflow-hidden bg-black", isVideo && "aspect-[4/5]")}>
        <VisualThumb visual={post.visual} page={page} width={380} playable={isVideo} fill={isVideo} />
        <Pager count={pages} index={page} set={setPage} />
      </div>
      <div className="flex items-center px-3 pt-2.5">
        <div className="flex items-center gap-4"><HeartI size={22} /><CommentI size={21} /><SendI size={20} /></div>
        <div className="flex flex-1 justify-center gap-1">{pages > 1 && Array.from({ length: pages }, (_, i) => <span key={i} className={clsx("h-1.5 w-1.5 rounded-full", i === page ? "bg-[#0095F6]" : "bg-[#DBDBDB]")} />)}</div>
        <BookmarkI size={21} />
      </div>
      <div className="space-y-1 px-3 pb-3 pt-2">
        <Caption text={post.caption} hashtags={post.hashtags} />
        <p className="text-[10px] uppercase tracking-wide text-[#737373]">Aperçu avant publication</p>
      </div>
    </div>
  );
}

/** Cadre de téléphone 9:16 commun à Story et TikTok. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[22px] bg-black font-sans text-white shadow-lg ring-1 ring-black/10">{children}</div>;
}

function Story({ post }: { post: Post }) {
  return (
    <PhoneFrame>
      <div className="absolute inset-0"><VisualThumb visual={post.visual} width={300} playable={post.visual?.kind === "video"} fill /></div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-3 top-2.5 flex gap-1">{[0, 1, 2].map((i) => <span key={i} className={clsx("h-[3px] flex-1 rounded-full", i === 0 ? "bg-white" : "bg-white/40")} />)}</div>
      <div className="absolute inset-x-3 top-6 flex items-center gap-2 text-[13px]">
        <BrandAvatar size={30} />
        <span className="font-semibold">skinclean</span>
        <span className="text-white/80">maintenant</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
        <span className="flex-1 rounded-full border border-white/70 px-4 py-2 text-[12px] text-white/90">Envoyer un message</span>
        <HeartI size={22} /><SendI size={21} />
      </div>
    </PhoneFrame>
  );
}

function TikTok({ post }: { post: Post }) {
  // Carrousel photo TikTok : on fait défiler les pages comme dans l'application
  const pages = post.visual?.kind === "design" ? post.visual.design?.pages.length ?? 1 : 1;
  const [page, setPage] = useState(0);
  return (
    <PhoneFrame>
      <div className="absolute inset-0"><VisualThumb visual={post.visual} page={Math.min(page, pages - 1)} width={300} playable={post.visual?.kind === "video"} fill /></div>
      {pages > 1 && (
        <>
          <button type="button" aria-label="Photo précédente" className="absolute inset-y-16 left-0 z-10 w-1/3" onClick={() => setPage((x) => Math.max(0, x - 1))} />
          <button type="button" aria-label="Photo suivante" className="absolute inset-y-16 right-14 z-10 w-1/3" onClick={() => setPage((x) => Math.min(pages - 1, x + 1))} />
          <div className="pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-10 flex justify-center gap-1">{Array.from({ length: pages }, (_, k) => <span key={k} className={clsx("h-1 rounded-full", k === page ? "w-4 bg-white" : "w-1.5 bg-white/50")} />)}</div>
        </>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 top-3 flex items-center justify-center gap-5 text-[13px] font-semibold">
        <span className="text-white/70">Abonnements</span>
        <span className="relative">Pour toi<span className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white" /></span>
      </div>
      {/* Colonne d'actions : photo de profil centrée au-dessus des pictogrammes */}
      <div className="absolute bottom-20 right-2 flex w-12 flex-col items-center gap-5">
        <div className="relative flex flex-col items-center">
          <BrandAvatar size={44} ring />
          <span className="absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-[#FE2C55] text-white"><PlusI size={12} strokeWidth={2.5} /></span>
        </div>
        <HeartI size={28} className="drop-shadow" />
        <CommentI size={26} className="drop-shadow" />
        <BookmarkI size={26} className="drop-shadow" />
        <ShareI size={26} className="drop-shadow" />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#222] ring-4 ring-[#333]"><BrandAvatar size={22} /></span>
      </div>
      <div className="absolute bottom-4 left-3 right-16 space-y-1 text-left text-[12px] leading-snug">
        <p className="text-[14px] font-semibold">@skinclean</p>
        <p className="line-clamp-3 whitespace-pre-line">{post.caption} <span className="font-semibold">{post.hashtags.join(" ")}</span></p>
        <p className="truncate text-white/85">♫ {post.script?.sound ?? "son original — skinclean"}</p>
      </div>
    </PhoneFrame>
  );
}

function Facebook({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-[#DADDE1] bg-white text-left font-sans text-[#050505] shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pt-3">
        <BrandAvatar size={40} />
        <div className="min-w-0 flex-1 leading-tight"><p className="text-[15px] font-semibold">SKINCLEAN</p><p className="text-[12px] text-[#65676B]">Programmé · 🌍</p></div>
        <span className="text-lg leading-none tracking-widest text-[#65676B]">···</span>
      </div>
      <p className="whitespace-pre-line px-4 py-3 text-[15px] leading-[1.35]">
        {post.caption}
        {post.hashtags.length > 0 && <><br /><span className="text-[#216FDB]">{post.hashtags.join(" ")}</span></>}
      </p>
      <VisualThumb visual={post.visual} width={460} />
      <div className="mx-4 grid grid-cols-3 border-t border-[#CED0D4] py-1 text-[14px] font-semibold text-[#65676B]">
        <span className="flex items-center justify-center gap-2 py-1.5"><HeartI size={18} />J&apos;aime</span>
        <span className="flex items-center justify-center gap-2 py-1.5"><CommentI size={18} />Commenter</span>
        <span className="flex items-center justify-center gap-2 py-1.5"><ShareI size={18} />Partager</span>
      </div>
    </div>
  );
}

function Pinterest({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[300px] text-left font-sans">
      <div className="relative overflow-hidden rounded-2xl">
        <VisualThumb visual={post.visual} width={300} />
        <span className="absolute right-3 top-3 rounded-full bg-[#E60023] px-4 py-2.5 text-[13px] font-semibold text-white">Enregistrer</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[14px] font-semibold text-[#111]">{post.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[12px] text-[#5F5F5F]">{post.caption}</p>
      <div className="mt-2 flex items-center gap-2 text-[12px]"><BrandAvatar size={24} /> SKINCLEAN</div>
    </div>
  );
}

/* ───────── Newsletter : rendu réel de l'e-mail associé ───────── */
let emailsCache: Promise<EmailCampaign[]> | null = null;
const loadEmails = (): Promise<EmailCampaign[]> => (emailsCache ??= fetch("/api/hub/export?collection=emails").then((r) => (r.ok ? r.json() : [])).catch(() => []));

function Newsletter({ post }: { post: Post }) {
  const [html, setHtml] = useState<string | null>(null);
  const [email, setEmail] = useState<EmailCampaign | null>(null);
  const [height, setHeight] = useState(900);
  useEffect(() => {
    let alive = true;
    emailsCache = null; // toujours la dernière version de l'e-mail
    loadEmails().then(async (list) => {
      const m = (list as EmailCampaign[]).find((x) => x.id === post.emailId);
      if (!alive || !m) return;
      const images: Record<string, string> = {};
      for (const b of m.blocks) if (b.type === "hero" && (b as Extract<EmailBlock, { type: "hero" }>).design) images[b.id] = await designToDataUrl((b as Extract<EmailBlock, { type: "hero" }>).design!, 0, 1, "image/jpeg");
      if (!alive) return;
      setEmail(m);
      setHtml(renderEmailHtml(m, { baseUrl: window.location.origin, images }));
    });
    return () => { alive = false; };
  }, [post.emailId]);
  const [subject, pre] = post.caption.split("\n");
  const scale = 380 / 600;
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm">
      <div className="flex items-start gap-3 border-b border-line p-3">
        <BrandAvatar size={36} />
        <div className="min-w-0 text-[13px] leading-snug">
          <p className="font-semibold">SKINCLEAN</p>
          <p className="truncate font-medium">{email?.subject ?? subject?.replace("Objet : ", "")}</p>
          <p className="truncate text-forest-soft">{email?.preheader ?? pre?.replace("Préheader : ", "")}</p>
        </div>
        <MailI size={16} className="ml-auto mt-1 shrink-0 text-forest-soft" />
      </div>
      {html ? (
        <div className="relative overflow-hidden" style={{ height: height * scale }}>
          <iframe title="Aperçu de la newsletter" srcDoc={html} sandbox="allow-same-origin" scrolling="no" className="absolute left-0 top-0 origin-top-left border-0" style={{ width: 600, height, transform: `scale(${scale})` }}
            onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) setHeight(Math.min(d.documentElement.scrollHeight, 2400)); }} />
        </div>
      ) : post.visual?.design ? <DesignPreview design={post.visual.design} width={380} /> : <p className="p-4 text-sm text-forest-soft">Chargement de la newsletter…</p>}
    </div>
  );
}

function Blog({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-line bg-white text-left">
      {post.visual?.design && <DesignPreview design={post.visual.design} width={460} />}
      <div className="p-4"><p className="flex items-center gap-1 text-xs uppercase tracking-wider text-forest-soft"><BlogI size={13} /> Conseils SKINCLEAN</p><p className="mt-1 font-display text-lg font-semibold">{post.title}</p><p className="mt-1 whitespace-pre-line text-sm text-forest-soft">{post.caption}</p></div>
    </div>
  );
}

export function PostPreview({ post }: { post: Post }) {
  switch (post.platform) {
    case "instagram": return <Instagram post={post} />;
    case "story": return <Story post={post} />;
    case "tiktok": return <TikTok post={post} />;
    case "facebook": return <Facebook post={post} />;
    case "pinterest": return <Pinterest post={post} />;
    case "newsletter": return <Newsletter post={post} />;
    case "blog": return <Blog post={post} />;
  }
}
