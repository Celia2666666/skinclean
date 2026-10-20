"use client";
import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import type { Post } from "@/lib/hub/types";
import { DesignPreview, VisualThumb } from "./design/DesignPreview";
import { BookmarkI, ChevronLeftI, ChevronRightI, CommentI, HeartI, SendI, MailI, BlogI, ShareI } from "./icons";

/**
 * Simulations fidèles de l'affichage sur chaque plateforme.
 * Aucun compteur (likes, vues) n'est inventé : les emplacements restent neutres.
 */

const Avatar = ({ size = 32 }: { size?: number }) => (
  <span className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#EDF0EA] ring-1 ring-black/5" style={{ width: size, height: size }}>
    <Image src="/media/brand/transparent/logo-mark.png" alt="" width={size} height={size} className="h-[80%] w-auto object-contain" />
  </span>
);

function Caption({ text, hashtags, max = 125, name = "skinclean" }: { text: string; hashtags: string[]; max?: number; name?: string }) {
  const [open, setOpen] = useState(false);
  const full = `${text}${hashtags.length ? `\n\n${hashtags.join(" ")}` : ""}`;
  const short = full.length > max && !open ? full.slice(0, max).trimEnd() : full;
  return (
    <p className="whitespace-pre-line text-[13px] leading-[1.35]">
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

function Media({ post, page, width, playable }: { post: Post; page: number; width: number; playable?: boolean }) {
  return <VisualThumb visual={post.visual} page={page} width={width} playable={playable} />;
}

function Instagram({ post }: { post: Post }) {
  const [page, setPage] = useState(0);
  const pages = post.visual?.kind === "design" ? post.visual.design?.pages.length ?? 1 : 1;
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-[#DBDBDB] bg-white font-sans text-[#262626] shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar />
        <div className="flex-1 leading-tight"><p className="text-[13px] font-semibold">skinclean</p><p className="text-[11px] text-[#737373]">{post.format === "reel" ? "Son original" : "SKINCLEAN"}</p></div>
        <span className="text-lg leading-none">···</span>
      </div>
      <div className="relative bg-black">
        <Media post={post} page={page} width={380} playable={post.visual?.kind === "video"} />
        <Pager count={pages} index={page} set={setPage} />
      </div>
      <div className="flex items-center gap-4 px-3 pt-2.5">
        <HeartI size={22} /><CommentI size={21} /><SendI size={20} />
        {pages > 1 && <div className="mx-auto flex gap-1">{Array.from({ length: pages }, (_, i) => <span key={i} className={clsx("h-1.5 w-1.5 rounded-full", i === page ? "bg-[#0095F6]" : "bg-[#DBDBDB]")} />)}</div>}
        <BookmarkI size={21} className="ml-auto" />
      </div>
      <div className="space-y-1 px-3 pb-3 pt-2">
        <Caption text={post.caption} hashtags={post.hashtags} />
        <p className="text-[11px] uppercase text-[#737373]">Aperçu avant publication</p>
      </div>
    </div>
  );
}

function Story({ post }: { post: Post }) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black font-sans text-white shadow-lg">
      <div className="absolute inset-0"><Media post={post} page={0} width={300} playable={post.visual?.kind === "video"} /></div>
      <div className="absolute inset-x-2 top-2 flex gap-1">{[0, 1, 2].map((i) => <span key={i} className={clsx("h-0.5 flex-1 rounded", i === 0 ? "bg-white" : "bg-white/40")} />)}</div>
      <div className="absolute inset-x-3 top-5 flex items-center gap-2 text-[13px]"><Avatar size={28} /><span className="font-semibold drop-shadow">skinclean</span><span className="text-white/80 drop-shadow">maintenant</span></div>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
        <span className="flex-1 rounded-full border border-white/70 px-4 py-2 text-[12px] text-white/90">Envoyer un message</span>
        <HeartI size={22} /><SendI size={21} />
      </div>
    </div>
  );
}

function TikTok({ post }: { post: Post }) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black font-sans text-white shadow-lg">
      <div className="absolute inset-0 flex items-center"><Media post={post} page={0} width={300} playable={post.visual?.kind === "video"} /></div>
      <div className="absolute inset-x-0 top-3 flex justify-center gap-4 text-[13px] font-semibold drop-shadow"><span className="text-white/70">Abonnements</span><span className="border-b-2 border-white pb-1">Pour toi</span></div>
      <div className="absolute bottom-16 right-2 flex flex-col items-center gap-4 text-[10px]">
        <Avatar size={38} />
        <span className="flex flex-col items-center"><HeartI size={26} />—</span>
        <span className="flex flex-col items-center"><CommentI size={24} />—</span>
        <span className="flex flex-col items-center"><BookmarkI size={24} />—</span>
        <span className="flex flex-col items-center"><ShareI size={24} />—</span>
      </div>
      <div className="absolute bottom-3 left-3 right-14 text-[12px] leading-snug drop-shadow">
        <p className="font-semibold">@skinclean</p>
        <p className="line-clamp-3 whitespace-pre-line">{post.caption} {post.hashtags.join(" ")}</p>
        <p className="mt-1 text-white/80">♫ {post.script?.sound ?? "son original — skinclean"}</p>
      </div>
    </div>
  );
}

function Facebook({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-[#DADDE1] bg-white font-sans text-[#050505] shadow-sm">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Avatar size={38} />
        <div className="leading-tight"><p className="text-[14px] font-semibold">SKINCLEAN</p><p className="text-[12px] text-[#65676B]">Programmé · 🌍</p></div>
      </div>
      <p className="whitespace-pre-line px-3 py-2.5 text-[14px] leading-snug">{post.caption}{post.hashtags.length ? `\n${post.hashtags.join(" ")}` : ""}</p>
      <Media post={post} page={0} width={460} />
      <div className="mx-3 flex justify-around border-t border-[#CED0D4] py-1.5 text-[13px] font-semibold text-[#65676B]">
        <span className="flex items-center gap-1.5 px-2 py-1"><HeartI size={17} />J'aime</span>
        <span className="flex items-center gap-1.5 px-2 py-1"><CommentI size={17} />Commenter</span>
        <span className="flex items-center gap-1.5 px-2 py-1"><ShareI size={17} />Partager</span>
      </div>
    </div>
  );
}

function Pinterest({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[300px] font-sans">
      <div className="relative overflow-hidden rounded-2xl">
        <Media post={post} page={0} width={300} />
        <span className="absolute right-3 top-3 rounded-full bg-[#E60023] px-4 py-2.5 text-[13px] font-semibold text-white">Enregistrer</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[14px] font-semibold text-[#111]">{post.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[12px] text-[#5F5F5F]">{post.caption}</p>
      <div className="mt-2 flex items-center gap-2 text-[12px]"><Avatar size={24} /> SKINCLEAN</div>
    </div>
  );
}

function Newsletter({ post }: { post: Post }) {
  const [subject, pre] = post.caption.split("\n");
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-start gap-3 border-b border-line p-4">
        <MailI size={20} />
        <div className="min-w-0 text-sm"><p className="font-semibold">SKINCLEAN</p><p className="truncate">{subject?.replace("Objet : ", "")}</p><p className="truncate text-forest-soft">{pre?.replace("Préheader : ", "")}</p></div>
      </div>
      {post.visual?.design && <DesignPreview design={post.visual.design} width={460} />}
      <p className="p-4 text-xs text-forest-soft">Aperçu complet (mobile et ordinateur) dans le module E-mailing.</p>
    </div>
  );
}

function Blog({ post }: { post: Post }) {
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-line bg-white">
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
