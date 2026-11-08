"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Platform, SandboxPost } from "@/lib/hub/types";
import { PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay } from "@/lib/hub/dates";
import { Button, Empty, Modal, PLATFORM_ICON, PageHeader, useAction, useConfirm } from "../ui";
import { BrandAvatar } from "../PostPreview";
import { ChevronLeftI, ChevronRightI, ClockI, CommentI, HeartI, PlayI, SendI, TrashI, BookmarkI } from "../icons";

type Net = "instagram" | "tiktok" | "facebook" | "pinterest";
const NETS: Net[] = ["instagram", "tiktok", "facebook", "pinterest"];
const netOf = (p: Platform): Net => (p === "story" ? "instagram" : (p as Net));
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Profils des réseaux avec les publications du Hub (simulés en local tant que le vrai compte n'est pas connecté). */
export function SandboxView({ posts, handle, enabled, queue }: { posts: SandboxPost[]; handle: string; enabled: boolean; queue: { id: string; title: string; date: string; platform: Platform }[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [net, setNet] = useState<Net>((sp.get("reseau") as Net) || "instagram");
  const [open, setOpen] = useState<string | null>(sp.get("publication"));
  const { run } = useAction();
  const { ask, dialog } = useConfirm();

  // Actualisation automatique : les publications programmées apparaissent d'elles-mêmes
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [router]);

  const mine = posts.filter((p) => netOf(p.platform) === net);
  const feed = mine.filter((p) => p.platform !== "story");
  const stories = mine.filter((p) => p.platform === "story");
  const current = open ? posts.find((p) => p.id === open) ?? null : null;
  const upcoming = queue.filter((q) => netOf(q.platform) === net);
  const Icon = PLATFORM_ICON[net];

  return (
    <div>
      {dialog}
      <PageHeader eyebrow="Réseaux sociaux" title="Mes comptes" intro="Tes profils Instagram, TikTok, Facebook et Pinterest tels qu'ils apparaissent avec tes publications : les contenus validés s'y ajoutent automatiquement à l'heure prévue du calendrier."
        actions={<Link href="/hub/reseaux-sociaux" className="hub-btn hub-btn-secondary">Contenus prêts à publier</Link>} />

      <div className="mb-5 flex flex-wrap gap-2">
        {NETS.map((n) => { const I = PLATFORM_ICON[n]; const c = posts.filter((p) => netOf(p.platform) === n).length; return <button key={n} onClick={() => setNet(n)} className={clsx("hub-btn", net === n ? "hub-btn-primary" : "hub-btn-secondary")}><I size={16} />{PLATFORM_LABEL[n]}<span className="rounded-full bg-white/20 px-1.5 text-xs">{c}</span></button>; })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="hub-card overflow-hidden">
          {/* En-tête de profil */}
          <div className="flex flex-wrap items-center gap-6 border-b border-line p-6">
            <span className={clsx("rounded-full p-[3px]", stories.length ? "bg-gradient-to-tr from-[#F9CE34] via-[#EE2A7B] to-[#6228D7]" : "bg-line")}><span className="block rounded-full bg-white p-[3px]"><BrandAvatar size={84} /></span></span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xl font-semibold">{net === "facebook" ? "SKINCLEAN" : handle}</p>
              <p className="mt-1 text-sm text-forest-soft">{PLATFORM_LABEL[net]} · {feed.length} publication(s){net === "instagram" ? ` · ${stories.length} story(s)` : ""}</p>
              <p className="mt-2 text-sm">SKINCLEAN — Your skin. Your glow. 🌿<br />Skincare efficace, routines simples. Fais ton Skin Diag ↓</p>
            </div>
            <Icon size={28} />
          </div>

          {net === "instagram" && stories.length > 0 && (
            <div className="flex gap-4 overflow-x-auto border-b border-line px-6 py-4">
              {stories.map((s) => (
                <button key={s.id} onClick={() => setOpen(s.id)} className="flex w-20 shrink-0 flex-col items-center gap-1 text-[11px]">
                  <span className="rounded-full bg-gradient-to-tr from-[#F9CE34] via-[#EE2A7B] to-[#6228D7] p-[2px]"><span className="block overflow-hidden rounded-full border-2 border-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.images[0] ? <img src={s.images[0]} alt="" className="h-16 w-16 object-cover" /> : <span className="grid h-16 w-16 place-items-center bg-black text-white"><PlayI size={16} /></span>}
                  </span></span>
                  <span className="w-full truncate text-center">{frDay(s.publishedAt.slice(0, 10)).split(" ").slice(0, 3).join(" ")}</span>
                </button>
              ))}
            </div>
          )}

          {!feed.length ? <div className="p-6"><Empty title="Aucune publication sur ce compte pour l'instant" text="Valide un contenu de ce réseau : il sera publié ici à l'heure prévue, ou tout de suite avec le bouton « Publier »." /></div> : net === "facebook" ? (
            <div className="mx-auto max-w-xl space-y-4 p-4">
              {feed.map((p) => (
                <button key={p.id} onClick={() => setOpen(p.id)} className="block w-full overflow-hidden rounded-lg border border-[#DADDE1] bg-white text-left">
                  <div className="flex items-center gap-2.5 px-4 pt-3"><BrandAvatar size={36} /><div className="leading-tight"><p className="text-sm font-semibold">SKINCLEAN</p><p className="text-xs text-[#65676B]">{when(p.publishedAt)} · 🌍</p></div></div>
                  <p className="line-clamp-3 whitespace-pre-line px-4 py-2.5 text-sm">{p.caption}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0] && <img src={p.images[0]} alt="" className="block w-full" />}
                </button>
              ))}
            </div>
          ) : net === "pinterest" ? (
            <div className="columns-2 gap-3 p-4 md:columns-3 lg:columns-4">
              {feed.map((p) => (
                <button key={p.id} onClick={() => setOpen(p.id)} className="mb-3 block w-full break-inside-avoid text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0] && <img src={p.images[0]} alt="" className="w-full rounded-2xl" />}
                  <p className="mt-1.5 line-clamp-2 text-xs font-semibold">{p.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className={clsx("grid gap-0.5 bg-white p-0.5", net === "tiktok" ? "grid-cols-3 md:grid-cols-4" : "grid-cols-3")}>
              {feed.map((p) => (
                <button key={p.id} onClick={() => setOpen(p.id)} className={clsx("group relative block overflow-hidden bg-black", net === "tiktok" ? "aspect-[9/16]" : "aspect-[4/5]")}>
                  {p.video ? <video src={p.video} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  {(p.video || p.images.length > 1) && <span className="absolute right-2 top-2 text-white drop-shadow">{p.video ? <PlayI size={16} /> : <span className="text-xs font-semibold">{p.images.length} ▣</span>}</span>}
                  <span className="absolute inset-0 grid place-items-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">{when(p.publishedAt)}</span>
                </button>
              ))}
            </div>
          )}
          <p className="border-t border-line px-6 py-2.5 text-[0.7rem] text-forest-soft">Simulé en local tant que ce compte {PLATFORM_LABEL[net]} n&apos;est pas connecté (Mon compte → Intégrations).</p>
        </div>

        <aside className="space-y-4">
          <div className="hub-card p-4">
            <p className="flex items-center gap-2 font-display font-semibold"><ClockI size={16} />Prochaines publications automatiques</p>
            <p className="mt-1 text-xs text-forest-soft">Contenus validés et programmés sur {PLATFORM_LABEL[net]} : ils partiront seuls à l&apos;heure prévue, même si tu n&apos;es pas connecté (le serveur local doit rester allumé).</p>
            {!upcoming.length ? <p className="mt-3 text-sm text-forest-soft">Rien de programmé.</p> : (
              <ul className="mt-3 space-y-2">{upcoming.map((q) => <li key={q.id}><Link href={`/hub/calendrier?post=${q.id}`} className="block rounded-md border border-line p-2 text-sm hover:border-forest"><span className="block text-xs text-forest-soft">{frDay(q.date)} · {q.date.slice(11, 16)}{q.platform === "story" ? " · story" : ""}</span><span className="line-clamp-2 font-medium">{q.title}</span></Link></li>)}</ul>
            )}
          </div>
        </aside>
      </div>

      <Modal open={!!current} onClose={() => { setOpen(null); if (sp.get("publication")) router.replace(`/hub/mes-comptes?reseau=${net}`); }} title={current ? `${PLATFORM_LABEL[current.platform]} — publication` : ""} size="lg"
        footer={current && <>
          <Link href={`/hub/calendrier?post=${current.postId}`} className="hub-btn hub-btn-ghost mr-auto">Voir le contenu dans le calendrier</Link>
          <Button variant="danger" icon={<TrashI size={14} />} onClick={async () => { if (await ask("Retirer cette publication du compte ?", "Le contenu reste dans ton calendrier avec son statut.", "Retirer", true)) { await run("sandbox/delete", { id: current.id }, "Publication retirée"); setOpen(null); } }}>Retirer la publication</Button>
        </>}>
        {current && <SandboxDetail post={current} handle={handle} />}
      </Modal>
    </div>
  );
}

function SandboxDetail({ post, handle }: { post: SandboxPost; handle: string }) {
  const [i, setI] = useState(0);
  const vertical = post.platform === "tiktok" || post.platform === "story";
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className={clsx("relative mx-auto w-full overflow-hidden rounded-lg bg-black", vertical ? "aspect-[9/16] max-w-[300px]" : "max-w-[420px]")}>
        {post.video ? <video src={post.video} className="h-full w-full object-cover" autoPlay muted loop playsInline /> : post.images[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.images[i]} alt="" className={clsx("block w-full", vertical && "h-full object-cover")} />
        ) : null}
        {post.images.length > 1 && !post.video && (
          <>
            {i > 0 && <button aria-label="Image précédente" onClick={() => setI(i - 1)} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90"><ChevronLeftI size={15} /></button>}
            {i < post.images.length - 1 && <button aria-label="Image suivante" onClick={() => setI(i + 1)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90"><ChevronRightI size={15} /></button>}
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1}/{post.images.length}</span>
          </>
        )}
      </div>
      <div className="text-sm">
        <div className="flex items-center gap-2"><BrandAvatar size={34} /><span className="font-semibold">{handle}</span></div>
        <div className="mt-3 flex gap-4 text-forest"><HeartI size={20} /><CommentI size={20} /><SendI size={19} /><BookmarkI size={20} className="ml-auto" /></div>
        <p className="mt-3 whitespace-pre-line leading-relaxed">{post.caption}</p>
        {post.hashtags.length > 0 && <p className="mt-2 text-[#00376B]">{post.hashtags.join(" ")}</p>}
        <dl className="mt-4 space-y-1 rounded-lg bg-sage-soft p-3 text-xs">
          <div className="flex justify-between gap-3"><dt className="text-forest-soft">Prévu dans le calendrier</dt><dd>{frDay(post.scheduledFor)} à {post.scheduledFor.slice(11, 16)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-forest-soft">Publié le</dt><dd>{when(post.publishedAt)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-forest-soft">Par</dt><dd>{post.by}</dd></div>
          {post.late && <p className="pt-1 text-[#8A3D1E]">Publié avec retard : le serveur local était éteint à l&apos;heure prévue.</p>}
        </dl>
        <p className="mt-3 text-xs text-forest-soft">Simulé en local tant que le compte n&apos;est pas connecté.</p>
      </div>
    </div>
  );
}
