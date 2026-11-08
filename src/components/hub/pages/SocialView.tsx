"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Platform, Post } from "@/lib/hub/types";
import { PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay } from "@/lib/hub/dates";
import { Button, Empty, PLATFORM_ICON, PageHeader, StatusBadge, Tabs, copyText, useToast } from "../ui";
import { VisualThumb } from "../design/DesignPreview";
import { PostPreview } from "../PostPreview";
import { PostDrawer, downloadPostVisual, type HubRefs } from "../PostDrawer";
import { CopyI, DownloadI, EyeI, GridI, SearchI } from "../icons";

const NETWORKS: Platform[] = ["instagram", "story", "tiktok", "facebook", "pinterest"];
type Sub = "bibliotheque" | "planifies" | "apercus" | "publies";

export function SocialView({ library, upcoming, published, refs, connections }: {
  library: Post[]; upcoming: Post[]; published: Post[]; refs: HubRefs;
  connections: { id: string; name: string; connected: boolean; capability: string; limits: string }[];
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const [net, setNet] = useState<Platform>((sp.get("platform") as Platform) || "instagram");
  const [sub, setSub] = useState<Sub>((sp.get("tab") as Sub) || "bibliotheque");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();

  // Les stories de la bibliothèque sont rangées avec Instagram, comme dans l'application
  const inNet = (p: Post) => (net === "instagram" ? p.platform === "instagram" || p.platform === "story" : p.platform === net);
  const lib = useMemo(() => library.filter(inNet).filter((p) => (!cat || p.libraryCategory === cat) && (!q || `${p.title} ${p.caption}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => Number(!!b.featured) - Number(!!a.featured)), [library, net, cat, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = [...new Set(library.filter(inNet).map((p) => p.libraryCategory ?? "Divers"))];
  const up = upcoming.filter((p) => p.platform === net);
  const pub = published.filter((p) => p.platform === net);
  const all = [...library, ...upcoming, ...published];
  const current = open ? all.find((p) => p.id === open) ?? null : null;

  const Tile = ({ p }: { p: Post }) => (
    <div className="hub-card group flex flex-col overflow-hidden">
      <button onClick={() => setOpen(p.id)} className="relative block overflow-hidden bg-sage-soft" aria-label={`Voir ${p.title}`}>
        <VisualThumb visual={p.visual} width={260} />
        <span className="absolute inset-0 grid place-items-center bg-forest/0 opacity-0 transition group-hover:bg-forest/30 group-hover:opacity-100"><span className="hub-btn hub-btn-secondary hub-btn-sm"><EyeI size={14} />Prévisualiser</span></span>
      </button>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[0.68rem] uppercase tracking-wider text-forest-soft">{p.library ? p.libraryCategory : `${frDay(p.date)} · ${p.date.slice(11, 16)}`}</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium">{p.title}</p>
        {p.script && <p className="mt-1 line-clamp-2 text-xs text-forest-soft">Hook : « {p.script.hook} »</p>}
        <div className="mt-auto flex items-center gap-1 pt-3">
          {!p.library && <StatusBadge status={p.status} />}
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="ghost" icon={<DownloadI size={14} />} aria-label="Télécharger le visuel" title="Télécharger le visuel" onClick={() => downloadPostVisual(p)} />
            <Button size="sm" variant="ghost" icon={<CopyI size={14} />} aria-label="Copier la légende" title="Copier la légende" onClick={() => copyText(p.caption, toast, "Légende copiée")} />
            <Button size="sm" variant="ghost" icon={<span className="text-xs font-bold">#</span>} aria-label="Copier les hashtags" title="Copier les hashtags" onClick={() => copyText(p.hashtags.join(" "), toast, "Hashtags copiés")} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Réseaux sociaux" title="Contenus prêts à publier" intro="Une bibliothèque de publications prêtes à l'emploi par réseau, des aperçus fidèles et une publication simplifiée : télécharger, copier, programmer ou publier si le compte est connecté."
        actions={<Link href="/hub/mes-comptes" className="hub-btn hub-btn-primary">Voir mes comptes</Link>} />

      <div className="mb-4 flex flex-wrap gap-2">
        {NETWORKS.filter((n) => n !== "story").map((n) => {
          const Icon = PLATFORM_ICON[n];
          return (
            <button key={n} onClick={() => { setNet(n); setCat(""); }} className={clsx("hub-btn", net === n ? "hub-btn-primary" : "hub-btn-secondary")}>
              <Icon size={16} />{PLATFORM_LABEL[n]}
            </button>
          );
        })}
      </div>

      <Tabs value={sub} onChange={setSub} tabs={[
        { id: "bibliotheque", label: "Bibliothèque prête à l'emploi", count: library.filter(inNet).length },
        { id: "planifies", label: "Planifiés", count: up.length },
        { id: "apercus", label: "Aperçus" },
        { id: "publies", label: "Publiés", count: pub.length },
      ]} />

      <div className="mt-5">
        {sub === "bibliotheque" && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setCat("")} className={clsx("hub-badge border py-1", !cat ? "border-forest bg-forest text-white" : "border-line bg-white")}>Toutes les catégories</button>
              {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={clsx("hub-badge border py-1", cat === c ? "border-forest bg-forest text-white" : "border-line bg-white")}>{c}</button>)}
              <label className="ml-auto flex items-center gap-2"><SearchI size={15} className="text-forest-soft" /><input className="hub-input w-56 py-1.5" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            </div>
            {!lib.length ? <Empty title="Aucun modèle pour ce filtre" /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">{lib.map((p) => <Tile key={p.id} p={p} />)}</div>
            )}
            {net === "tiktok" && <p className="mt-4 text-sm text-forest-soft">Chaque concept TikTok contient un hook, un script scène par scène (plans, texte à l&apos;écran, voix), une légende, des hashtags et un CTA : ouvre-le puis l&apos;onglet « Script vidéo ».</p>}
          </>
        )}
        {sub === "planifies" && (!up.length ? <Empty title="Rien de planifié sur ce réseau" action={<Button onClick={() => setSub("bibliotheque")}>Piocher dans la bibliothèque</Button>} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">{up.slice(0, 40).map((p) => <Tile key={p.id} p={p} />)}</div>)}
        {sub === "publies" && (!pub.length ? <Empty title="Aucune publication publiée pour l'instant" text="Les publications confirmées par la plateforme ou déclarées manuellement apparaîtront ici." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pub.map((p) => <Tile key={p.id} p={p} />)}</div>)}
        {sub === "apercus" && (
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm text-forest-soft"><GridI size={15} />Les {Math.min(up.length, 6)} prochaines publications {PLATFORM_LABEL[net]} telles qu&apos;elles apparaîtront.</p>
            {!up.length ? <Empty title="Aucune publication à prévisualiser" /> : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {up.slice(0, 6).map((p) => (
                  <div key={p.id} className="rounded-xl bg-[#ECEBE6] p-5">
                    <div className="mb-3 flex items-center justify-between text-sm"><span className="font-medium">{frDay(p.date)} · {p.date.slice(11, 16)}</span><StatusBadge status={p.status} /></div>
                    <PostPreview post={p} />
                    <Button size="sm" className="mt-3 w-full" onClick={() => setOpen(p.id)}>Ouvrir</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PostDrawer post={current} refs={refs} onClose={() => { setOpen(null); router.refresh(); }} />
    </div>
  );
}
