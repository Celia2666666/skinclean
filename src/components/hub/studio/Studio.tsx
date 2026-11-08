"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { products } from "@/data/products";
import type { Asset, Design, DesignPage, Layer, TextLayer } from "@/lib/hub/types";
import { BRAND, BRAND_SWATCHES, FORMATS, TEMPLATE_GALLERY, tplProductHero, type FormatKey } from "@/lib/hub/templates";
import { Button, Field, Modal, Tabs, hubApi, uploadFiles, useCan, useConfirm, useToast } from "../ui";
import { DesignPreview } from "../design/DesignPreview";
import { designToDataUrl, downloadDesign, measureTextLayer, renderPage, slug } from "../design/render";
import {
  ChevronLeftI, ChevronRightI, CopyI, DownloadI, FolderI, ImageI, LayersI, PlusI, SearchI, SquareI, TextI, TrashI, UndoI, UploadI, ArrowRightI,
} from "../icons";

interface Initial { design: Design; name: string; assetId?: string; postId?: string; postTitle?: string }
const uid = () => `l${Math.random().toString(36).slice(2, 9)}`;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const blank = (): Design => tplProductHero({ headline: "Ton titre ici", eyebrow: "SKINCLEAN", sub: "Ton sous-titre", packshot: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png" });

/** Studio créatif : éditeur de visuels multipages (carrousels) aux couleurs SKINCLEAN. */
export interface StudioProduct { id: string; name: string; kind: string; tagline: string; description: string; benefits: string[]; packshot?: string; gallery: string[] }

export function Studio({ assets, initial, products: siteProducts = [], productId }: { assets: Asset[]; initial?: Initial; products?: StudioProduct[]; productId?: string }) {
  const [design, setDesignRaw] = useState<Design>(() => clone(initial?.design ?? blank()));
  const [name, setName] = useState(initial?.name ?? "Nouveau visuel");
  const [assetId, setAssetId] = useState(initial?.assetId);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [panel, setPanel] = useState<"modeles" | "elements" | "images" | "bibliotheque">(initial ? "elements" : "modeles");
  const [history, setHistory] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [folder, setFolder] = useState("Studio");
  const [tags, setTags] = useState("");
  const toast = useToast();
  const router = useRouter();
  const allowed = useCan();
  const { ask, dialog } = useConfirm();

  const setDesign = useCallback((fn: (d: Design) => Design, record = true) => {
    setDesignRaw((d) => {
      if (record) { setHistory((h) => [...h.slice(-40), d]); setFuture([]); }
      return fn(clone(d));
    });
  }, []);
  const undo = () => { const prev = history.at(-1); if (!prev) return; setFuture((f) => [design, ...f]); setHistory((h) => h.slice(0, -1)); setDesignRaw(prev); };
  const redo = () => { const next = future[0]; if (!next) return; setHistory((h) => [...h, design]); setFuture((f) => f.slice(1)); setDesignRaw(next); };

  const pg: DesignPage = design.pages[page] ?? design.pages[0];
  const layer = pg.layers.find((l) => l.id === sel);
  const updLayer = (patch: Partial<Layer>, record = true) => setDesign((d) => { const l = d.pages[page].layers.find((x) => x.id === sel); if (l) Object.assign(l, patch); return d; }, record);
  const updBg = (patch: Partial<DesignPage["bg"]>) => setDesign((d) => { d.pages[page].bg = { ...d.pages[page].bg, ...patch }; return d; });
  const addLayer = (l: Layer) => { setDesign((d) => { d.pages[page].layers.push(l); return d; }); setSel(l.id); };
  const removeLayer = () => { if (!sel) return; setDesign((d) => { d.pages[page].layers = d.pages[page].layers.filter((l) => l.id !== sel); return d; }); setSel(null); };
  const moveLayer = (dir: 1 | -1) => setDesign((d) => { const ls = d.pages[page].layers; const i = ls.findIndex((l) => l.id === sel); const j = i + dir; if (i < 0 || j < 0 || j >= ls.length) return d; [ls[i], ls[j]] = [ls[j], ls[i]]; return d; });
  const dupLayer = () => { if (!layer) return; const c = { ...clone(layer), id: uid(), x: layer.x + 30, y: layer.y + 30 }; addLayer(c); };

  // Clavier : suppression, flèches, annuler
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (!sel) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeLayer(); }
      const step = e.shiftKey ? 20 : 4;
      const mv: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (mv[e.key]) { e.preventDefault(); const l = layer!; updLayer({ x: l.x + mv[e.key][0], y: l.y + mv[e.key][1] }); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const changeFormat = (f: FormatKey) => {
    const { w, h } = FORMATS[f];
    setDesign((d) => {
      const sx = w / d.w, sy = h / d.h, s = Math.min(sx, sy);
      for (const p of d.pages) for (const l of p.layers) {
        l.x *= sx; l.y *= sy;
        if (l.type === "text") { l.w *= sx; l.size *= s; }
        else if (l.type === "logo") l.w *= s;
        else { l.w *= sx; l.h *= sy; if (l.type === "image") { const r = Math.min(sx, sy); l.w = (l.w / sx) * r; l.h = (l.h / sy) * r; } }
      }
      d.w = w; d.h = h;
      return d;
    });
  };

  const loadTemplate = async (build: () => Design) => {
    if (history.length && !(await ask("Remplacer le visuel en cours ?", "Le visuel actuel sera remplacé par le modèle (tu peux annuler avec Ctrl/⌘ Z).", "Remplacer"))) return;
    setDesign(() => build());
    setPage(0);
    setSel(null);
  };

  const [siteOpen, setSiteOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [target, setTarget] = useState({ productId: productId ?? siteProducts[0]?.id ?? "", slot: "packshot" as "packshot" | "hover" | "gallery" });
  const [newPost, setNewPost] = useState({ platform: "instagram" as "instagram" | "story" | "facebook" | "pinterest", date: "", title: "", productId: productId ?? "" });

  /** Enregistre le visuel en pleine résolution dans la bibliothèque (image utilisable sur le site, en e-mail, etc.). */
  const persist = async (toPost = false) => {
    const thumbnail = await designToDataUrl(design, page, 1);
    const a = await hubApi<Asset>("assets/save-design", { id: assetId, name, folder, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), design, thumbnail, postId: toPost ? initial?.postId : undefined });
    setAssetId(a.id);
    return a;
  };

  /** Envoie le visuel sur la fiche d'un produit du site (photo principale, survol ou galerie). */
  const useOnSite = async () => {
    const p = siteProducts.find((x) => x.id === target.productId);
    if (!p) return toast("err", "Choisis un produit.");
    setSaving(true);
    try {
      const a = await persist();
      const media = target.slot === "gallery" ? { gallery: [...p.gallery, a.url!] } : { [target.slot]: a.url };
      await hubApi("site/product", { id: p.id, patch: { media } });
      toast("ok", `Visuel publié sur la fiche « ${p.name} » (${target.slot === "packshot" ? "photo principale" : target.slot === "hover" ? "visuel au survol" : "galerie"}).`);
      setSiteOpen(false);
      router.refresh();
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /** Crée une publication (brouillon) dans le calendrier avec ce visuel. */
  const createPost = async () => {
    setSaving(true);
    try {
      const a = await persist();
      const p = siteProducts.find((x) => x.id === newPost.productId);
      const caption = p ? `${p.tagline} ✨\n\n${p.name}, ${p.kind.toLowerCase()} :\n${p.benefits.map((b) => `✔︎ ${b}`).join("\n")}\n\n${p.description}` : "";
      const created = await hubApi<{ id: string }>("posts/create", {
        title: newPost.title || name, platform: newPost.platform, format: newPost.platform === "pinterest" ? "epingle" : newPost.platform === "story" ? "story" : design.pages.length > 1 ? "carrousel" : "post",
        date: newPost.date, caption, hashtags: ["#skinclean", "#skincare"], cta: p ? "Découvre-le sur skinclean.fr" : "", productIds: p ? [p.id] : [],
        visual: { kind: "design", design, assetId: a.id },
      });
      toast("ok", "Publication créée (brouillon) dans le calendrier.");
      router.push(`/hub/calendrier?post=${created.id}`);
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const save = async (toPost: boolean) => {
    setSaving(true);
    try {
      await persist(toPost);
      toast("ok", toPost ? "Visuel enregistré dans la publication (renvoyée en validation si elle était validée)." : "Visuel enregistré dans la bibliothèque.");
      setSaveOpen(false);
      router.refresh();
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (files: FileList | null, asBackground = false) => {
    if (!files?.length) return;
    try {
      const up = await uploadFiles(files, "studio", true, "Imports");
      const img = up[0];
      if (asBackground) updBg({ type: "image", src: img.url, overlay: undefined });
      else addLayer({ id: uid(), type: "image", x: design.w * 0.15, y: design.h * 0.2, w: design.w * 0.7, h: design.h * 0.5, src: img.url, fit: "cover", radius: 0 });
      toast("ok", `${up.length} image(s) importée(s) dans la bibliothèque`);
      router.refresh();
    } catch (e) {
      toast("err", (e as Error).message);
    }
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-56px)] min-h-[640px] flex-col md:-mx-8 md:-my-8">
      {dialog}
      {/* Barre supérieure */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2">
        <input className="hub-input w-56 py-1.5 font-medium" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nom du visuel" />
        <select className="hub-input w-auto py-1.5" value={(Object.entries(FORMATS).find(([, f]) => f.w === design.w && f.h === design.h)?.[0] as string) ?? ""} onChange={(e) => changeFormat(e.target.value as FormatKey)} aria-label="Format">
          {!Object.values(FORMATS).some((f) => f.w === design.w && f.h === design.h) && <option value="">{design.w} × {design.h}</option>}
          {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label} ({f.w}×{f.h})</option>)}
        </select>
        <Button size="sm" variant="ghost" icon={<UndoI size={15} />} onClick={undo} disabled={!history.length} title="Annuler (Ctrl/⌘ Z)">Annuler</Button>
        <Button size="sm" variant="ghost" onClick={redo} disabled={!future.length} title="Rétablir (Ctrl/⌘ Maj Z)">Rétablir</Button>
        {initial?.postId && <Link href={`/hub/calendrier?post=${initial.postId}`} className="ml-2 inline-flex items-center gap-1 text-xs text-forest-soft underline">Publication : {initial.postTitle} <ArrowRightI size={12} /></Link>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" icon={<DownloadI size={15} />} onClick={async () => { const u = await designToDataUrl(design, page); const a = document.createElement("a"); a.href = u; a.download = `${slug(name)}-${page + 1}.png`; a.click(); }}>Télécharger cette page</Button>
          {design.pages.length > 1 && <Button size="sm" icon={<DownloadI size={15} />} onClick={() => downloadDesign(design, slug(name))}>Tout le carrousel ({design.pages.length})</Button>}
          {allowed("site.edit") && siteProducts.length > 0 && <Button size="sm" onClick={() => setSiteOpen(true)}>Utiliser sur une fiche produit</Button>}
          {allowed("content.edit") && !initial?.postId && <Button size="sm" onClick={() => { const d = new Date(Date.now() + 864e5); setNewPost({ ...newPost, title: name, date: `${d.toISOString().slice(0, 10)}T18:00` }); setPostOpen(true); }}>Créer une publication</Button>}
          {allowed("content.edit") && <Button size="sm" variant={initial?.postId ? "secondary" : "primary"} onClick={() => setSaveOpen(true)}>Enregistrer dans la bibliothèque</Button>}
          {allowed("content.edit") && initial?.postId && <Button size="sm" variant="primary" disabled={saving} onClick={() => save(true)}>Enregistrer dans la publication</Button>}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Panneau gauche */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-white md:flex">
          <div className="grid grid-cols-4 border-b border-line">
            {([["modeles", "Modèles", LayersI], ["elements", "Éléments", TextI], ["images", "Images", ImageI], ["bibliotheque", "Biblio.", FolderI]] as const).map(([id, l, I]) => (
              <button key={id} onClick={() => setPanel(id)} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[0.7rem]", panel === id ? "bg-sage-soft font-semibold" : "text-forest-soft hover:bg-sage-soft/50")}><I size={17} />{l}</button>
            ))}
          </div>
          <div className="hub-scroll flex-1 overflow-y-auto p-3">
            {panel === "modeles" && <Templates onPick={loadTemplate} />}
            {panel === "elements" && (
              <div className="space-y-4">
                <div>
                  <p className="hub-label">Texte</p>
                  <div className="space-y-1.5">
                    <button className="w-full rounded-md border border-line px-3 py-2 text-left font-display text-lg font-semibold uppercase hover:border-forest" onClick={() => addLayer({ id: uid(), type: "text", x: design.w * 0.08, y: design.h * 0.4, w: design.w * 0.84, text: "Ton titre", size: design.w * 0.08, weight: 500, color: BRAND.forest, align: "left", font: "display", upper: true, lineHeight: 1.05 })}>Ajouter un titre</button>
                    <button className="w-full rounded-md border border-line px-3 py-2 text-left font-medium hover:border-forest" onClick={() => addLayer({ id: uid(), type: "text", x: design.w * 0.08, y: design.h * 0.55, w: design.w * 0.84, text: "Ton sous-titre", size: design.w * 0.045, weight: 500, color: BRAND.forest, align: "left", font: "body", lineHeight: 1.25 })}>Ajouter un sous-titre</button>
                    <button className="w-full rounded-md border border-line px-3 py-2 text-left text-sm hover:border-forest" onClick={() => addLayer({ id: uid(), type: "text", x: design.w * 0.08, y: design.h * 0.65, w: design.w * 0.7, text: "Un paragraphe de texte.", size: design.w * 0.03, weight: 400, color: BRAND.forestSoft, align: "left", font: "body", lineHeight: 1.4 })}>Ajouter un paragraphe</button>
                    <button className="w-full rounded-md border border-line px-3 py-2 text-left text-sm hover:border-forest" onClick={() => addLayer({ id: uid(), type: "text", x: design.w * 0.08, y: design.h * 0.8, w: design.w * 0.4, text: "DÉCOUVRIR", size: design.w * 0.028, weight: 600, color: BRAND.white, align: "center", font: "body", letterSpacing: 2, bg: BRAND.forest, pad: design.w * 0.025 })}>Ajouter un bouton (CTA)</button>
                  </div>
                </div>
                <div>
                  <p className="hub-label">Logo SKINCLEAN</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([["wordmark", "Logotype"], ["mark", "Symbole"], ["full", "Signature"]] as const).map(([v, l]) => (
                      <button key={v} className="rounded-md border border-line p-2 text-xs hover:border-forest" onClick={() => addLayer({ id: uid(), type: "logo", x: design.w * 0.08, y: design.h * 0.85, w: design.w * (v === "mark" ? 0.12 : 0.3), variant: v, tint: "dark" })}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="hub-label">Formes</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button className="grid h-14 place-items-center rounded-md border border-line hover:border-forest" onClick={() => addLayer({ id: uid(), type: "shape", x: design.w * 0.1, y: design.h * 0.1, w: design.w * 0.4, h: design.w * 0.25, color: BRAND.sage, radius: 0 })} aria-label="Rectangle"><SquareI /></button>
                    <button className="grid h-14 place-items-center rounded-md border border-line hover:border-forest" onClick={() => addLayer({ id: uid(), type: "shape", x: design.w * 0.1, y: design.h * 0.1, w: design.w * 0.4, h: design.w * 0.12, color: BRAND.forest, radius: design.w * 0.06 })} aria-label="Pastille"><span className="h-4 w-10 rounded-full bg-forest" /></button>
                    <button className="grid h-14 place-items-center rounded-md border border-line hover:border-forest" onClick={() => addLayer({ id: uid(), type: "shape", x: design.w * 0.3, y: design.h * 0.3, w: design.w * 0.3, h: design.w * 0.3, color: BRAND.blush, radius: design.w * 0.15 })} aria-label="Cercle"><span className="h-8 w-8 rounded-full bg-[#EBDDD5]" /></button>
                  </div>
                </div>
              </div>
            )}
            {panel === "images" && (
              <div className="space-y-4">
                <label className="hub-btn hub-btn-primary w-full cursor-pointer"><UploadI size={15} />Importer une photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files)} /></label>
                <div>
                  <p className="hub-label">Packshots produits</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {products.filter((p) => p.media.packshot).map((p) => (
                      <button key={p.id} title={p.name} className="rounded-md border border-line bg-sage-soft p-1 hover:border-forest" onClick={() => addLayer({ id: uid(), type: "image", x: design.w * 0.25, y: design.h * 0.3, w: design.w * 0.5, h: design.h * 0.45, src: p.media.packshot!, fit: "contain", shadow: true })}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.media.packshot} alt={p.name} className="aspect-square w-full object-contain" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="hub-label">Images de la bibliothèque</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {assets.filter((a) => a.kind === "image" && a.url).slice(0, 30).map((a) => (
                      <button key={a.id} title={a.name} className="overflow-hidden rounded-md border border-line hover:border-forest" onClick={() => addLayer({ id: uid(), type: "image", x: design.w * 0.1, y: design.h * 0.15, w: design.w * 0.8, h: design.h * 0.55, src: a.url!, fit: "cover" })}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt={a.name} className="aspect-square w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                  {!assets.some((a) => a.kind === "image") && <p className="text-xs text-forest-soft">Importe une photo pour la retrouver ici.</p>}
                </div>
              </div>
            )}
            {panel === "bibliotheque" && <Library assets={assets} onOpen={(a) => { if (a.design) { setDesign(() => clone(a.design!)); setName(a.name); setAssetId(a.id); setPage(0); setSel(null); } }} />}
          </div>
        </aside>

        {/* Zone de travail */}
        <section className="flex min-w-0 flex-1 flex-col bg-[#E9E8E3]">
          <div className="min-h-0 flex-1 overflow-auto p-6" onMouseDown={(e) => e.target === e.currentTarget && setSel(null)}>
            <Canvas design={design} page={page} sel={sel} onSelect={setSel} onChange={(l, record) => setDesign((d) => { const i = d.pages[page].layers.findIndex((x) => x.id === l.id); if (i >= 0) d.pages[page].layers[i] = l; return d; }, record)} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto border-t border-line bg-white px-4 py-2">
            {design.pages.map((p, i) => (
              <button key={i} onClick={() => { setPage(i); setSel(null); }} className={clsx("relative w-16 shrink-0 overflow-hidden rounded border-2", i === page ? "border-forest" : "border-transparent")} aria-label={`Page ${i + 1}`}>
                <DesignPreview design={{ ...design, pages: [p] }} width={64} />
                <span className="absolute bottom-0 left-0 bg-black/60 px-1 text-[0.6rem] text-white">{i + 1}</span>
              </button>
            ))}
            <Button size="sm" icon={<PlusI size={14} />} onClick={() => { setDesign((d) => { d.pages.splice(page + 1, 0, clone(d.pages[page])); return d; }); setPage(page + 1); }}>Dupliquer la page</Button>
            <Button size="sm" icon={<PlusI size={14} />} onClick={() => { setDesign((d) => { d.pages.splice(page + 1, 0, { bg: { type: "color", color: BRAND.cream }, layers: [] }); return d; }); setPage(page + 1); }}>Page vierge</Button>
            {design.pages.length > 1 && <>
              <Button size="sm" variant="ghost" icon={<ChevronLeftI size={14} />} aria-label="Déplacer la page à gauche" disabled={page === 0} onClick={() => { setDesign((d) => { [d.pages[page - 1], d.pages[page]] = [d.pages[page], d.pages[page - 1]]; return d; }); setPage(page - 1); }} />
              <Button size="sm" variant="ghost" icon={<ChevronRightI size={14} />} aria-label="Déplacer la page à droite" disabled={page === design.pages.length - 1} onClick={() => { setDesign((d) => { [d.pages[page + 1], d.pages[page]] = [d.pages[page], d.pages[page + 1]]; return d; }); setPage(page + 1); }} />
              <Button size="sm" variant="danger" icon={<TrashI size={14} />} onClick={() => { setDesign((d) => { d.pages.splice(page, 1); return d; }); setPage(Math.max(0, page - 1)); }}>Supprimer la page</Button>
            </>}
            <span className="ml-auto text-xs text-forest-soft">{design.pages.length > 1 ? `Carrousel : ${design.pages.length} pages` : "1 page"} · {design.w}×{design.h}</span>
          </div>
        </section>

        {/* Propriétés */}
        <aside className="hub-scroll hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-white p-4 lg:block">
          {!layer ? (
            <div className="space-y-4">
              <p className="font-display font-semibold">Arrière-plan de la page</p>
              <Field label="Type">
                <select className="hub-input" value={pg.bg.type} onChange={(e) => updBg({ type: e.target.value as DesignPage["bg"]["type"] })}>
                  <option value="color">Couleur unie</option><option value="gradient">Dégradé</option><option value="image">Photo</option>
                </select>
              </Field>
              <ColorPicker label={pg.bg.type === "gradient" ? "Couleur 1" : "Couleur"} value={pg.bg.color} onChange={(c) => updBg({ color: c })} />
              {pg.bg.type === "gradient" && <ColorPicker label="Couleur 2" value={pg.bg.color2 ?? BRAND.sage} onChange={(c) => updBg({ color2: c })} />}
              {pg.bg.type === "image" && (
                <>
                  <label className="hub-btn hub-btn-secondary w-full cursor-pointer"><UploadI size={15} />{pg.bg.src ? "Remplacer la photo" : "Importer une photo"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files, true)} /></label>
                  <Filters value={pg.bg.filter ?? {}} onChange={(f) => updBg({ filter: f })} />
                  <Field label="Voile sombre (lisibilité du texte)"><input type="range" min={0} max={70} value={Number(/[\d.]+\)$/.exec(pg.bg.overlay ?? "")?.[0]?.replace(")", "") ?? 0) * 100} onChange={(e) => updBg({ overlay: `rgba(0,0,0,${Number(e.target.value) / 100})` })} className="w-full accent-forest" /></Field>
                </>
              )}
              <p className="pt-2 text-xs text-forest-soft">Clique sur un élément du visuel pour le modifier. Raccourcis : flèches pour déplacer, Suppr pour supprimer, Ctrl/⌘ Z pour annuler.</p>
              <div>
                <p className="hub-label">Calques ({pg.layers.length})</p>
                <ul className="space-y-1">{[...pg.layers].reverse().map((l) => <li key={l.id}><button onClick={() => setSel(l.id)} className="w-full truncate rounded border border-line px-2 py-1 text-left text-xs hover:border-forest">{l.type === "text" ? `Texte — ${l.text.slice(0, 30)}` : l.type === "image" ? "Image" : l.type === "logo" ? "Logo" : "Forme"}</button></li>)}</ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><p className="font-display font-semibold">{{ text: "Texte", image: "Image", shape: "Forme", logo: "Logo" }[layer.type]}</p><button className="text-xs underline" onClick={() => setSel(null)}>Arrière-plan</button></div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" onClick={() => moveLayer(1)}>Avant</Button>
                <Button size="sm" onClick={() => moveLayer(-1)}>Arrière</Button>
                <Button size="sm" icon={<CopyI size={13} />} onClick={dupLayer}>Dupliquer</Button>
                <Button size="sm" variant="danger" icon={<TrashI size={13} />} onClick={removeLayer} aria-label="Supprimer" />
              </div>
              {layer.type === "text" && (
                <>
                  <Field label="Texte"><textarea className="hub-input min-h-24" value={layer.text} onChange={(e) => updLayer({ text: e.target.value }, false)} onFocus={() => setDesign((d) => d)} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Taille"><input type="number" className="hub-input" value={Math.round(layer.size)} onChange={(e) => updLayer({ size: Number(e.target.value) })} /></Field>
                    <Field label="Graisse"><select className="hub-input" value={layer.weight} onChange={(e) => updLayer({ weight: Number(e.target.value) as TextLayer["weight"] })}><option value={400}>Normal</option><option value={500}>Medium</option><option value={600}>Semi-gras</option><option value={700}>Gras</option></select></Field>
                    <Field label="Police"><select className="hub-input" value={layer.font} onChange={(e) => updLayer({ font: e.target.value as TextLayer["font"] })}><option value="display">Inter Tight (titres)</option><option value="body">Inter (texte)</option></select></Field>
                    <Field label="Alignement"><select className="hub-input" value={layer.align} onChange={(e) => updLayer({ align: e.target.value as TextLayer["align"] })}><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select></Field>
                    <Field label="Interligne"><input type="number" step={0.05} className="hub-input" value={layer.lineHeight ?? 1.15} onChange={(e) => updLayer({ lineHeight: Number(e.target.value) })} /></Field>
                    <Field label="Espacement"><input type="number" className="hub-input" value={layer.letterSpacing ?? 0} onChange={(e) => updLayer({ letterSpacing: Number(e.target.value) })} /></Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={!!layer.upper} onChange={(e) => updLayer({ upper: e.target.checked })} />Capitales</label>
                  <ColorPicker label="Couleur du texte" value={layer.color} onChange={(c) => updLayer({ color: c })} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={!!layer.bg} onChange={(e) => updLayer({ bg: e.target.checked ? BRAND.forest : undefined, pad: e.target.checked ? layer.pad ?? 20 : layer.pad })} />Fond derrière le texte</label>
                  {layer.bg && <ColorPicker label="Couleur du fond" value={layer.bg} onChange={(c) => updLayer({ bg: c })} />}
                </>
              )}
              {layer.type === "image" && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={layer.src} alt="" className="max-h-32 w-full rounded bg-sage-soft object-contain" />
                  <label className="hub-btn hub-btn-secondary w-full cursor-pointer"><UploadI size={15} />Remplacer l&apos;image<input type="file" accept="image/*" className="sr-only" onChange={async (e) => { if (!e.target.files?.length) return; const up = await uploadFiles(e.target.files, "studio", true, "Imports"); updLayer({ src: up[0].url }); }} /></label>
                  <Field label="Cadrage"><select className="hub-input" value={layer.fit} onChange={(e) => updLayer({ fit: e.target.value as "cover" | "contain" })}><option value="contain">Image entière</option><option value="cover">Remplir le cadre</option></select></Field>
                  <Field label={`Arrondi (${layer.radius ?? 0})`}><input type="range" min={0} max={Math.round(Math.min(layer.w, layer.h) / 2)} value={layer.radius ?? 0} onChange={(e) => updLayer({ radius: Number(e.target.value) }, false)} className="w-full accent-forest" /></Field>
                  <Field label={`Opacité (${Math.round((layer.opacity ?? 1) * 100)} %)`}><input type="range" min={10} max={100} value={(layer.opacity ?? 1) * 100} onChange={(e) => updLayer({ opacity: Number(e.target.value) / 100 }, false)} className="w-full accent-forest" /></Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={!!layer.shadow} onChange={(e) => updLayer({ shadow: e.target.checked })} />Ombre portée</label>
                  <Filters value={layer.filter ?? {}} onChange={(f) => updLayer({ filter: f })} />
                </>
              )}
              {layer.type === "shape" && (
                <>
                  <ColorPicker label="Couleur" value={layer.color} onChange={(c) => updLayer({ color: c })} />
                  <Field label={`Arrondi (${Math.round(layer.radius ?? 0)})`}><input type="range" min={0} max={Math.round(Math.min(layer.w, layer.h) / 2)} value={layer.radius ?? 0} onChange={(e) => updLayer({ radius: Number(e.target.value) }, false)} className="w-full accent-forest" /></Field>
                  <Field label={`Opacité (${Math.round((layer.opacity ?? 1) * 100)} %)`}><input type="range" min={5} max={100} value={(layer.opacity ?? 1) * 100} onChange={(e) => updLayer({ opacity: Number(e.target.value) / 100 }, false)} className="w-full accent-forest" /></Field>
                </>
              )}
              {layer.type === "logo" && (
                <>
                  <Field label="Version"><select className="hub-input" value={layer.variant} onChange={(e) => updLayer({ variant: e.target.value as "wordmark" })}><option value="wordmark">Logotype</option><option value="mark">Symbole</option><option value="full">Logotype + signature</option></select></Field>
                  <Field label="Couleur"><select className="hub-input" value={layer.tint ?? "dark"} onChange={(e) => updLayer({ tint: e.target.value as "dark" | "light" })}><option value="dark">Originale</option><option value="light">Blanc (fond foncé)</option></select></Field>
                </>
              )}
              <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
                <Field label="X"><input type="number" className="hub-input" value={Math.round(layer.x)} onChange={(e) => updLayer({ x: Number(e.target.value) })} /></Field>
                <Field label="Y"><input type="number" className="hub-input" value={Math.round(layer.y)} onChange={(e) => updLayer({ y: Number(e.target.value) })} /></Field>
                <Field label="Largeur"><input type="number" className="hub-input" value={Math.round(layer.w)} onChange={(e) => updLayer({ w: Number(e.target.value) })} /></Field>
                {"h" in layer && <Field label="Hauteur"><input type="number" className="hub-input" value={Math.round(layer.h)} onChange={(e) => updLayer({ h: Number(e.target.value) } as Partial<Layer>)} /></Field>}
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal open={siteOpen} onClose={() => setSiteOpen(false)} title="Utiliser ce visuel sur une fiche produit" size="sm"
        footer={<><Button onClick={() => setSiteOpen(false)}>Annuler</Button><Button variant="primary" disabled={saving || !target.productId} onClick={useOnSite}>Publier sur le site</Button></>}>
        <div className="space-y-3">
          <Field label="Produit"><select className="hub-input" value={target.productId} onChange={(e) => setTarget({ ...target, productId: e.target.value })}>{siteProducts.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.kind}</option>)}</select></Field>
          <Field label="Emplacement sur la fiche">
            <select className="hub-input" value={target.slot} onChange={(e) => setTarget({ ...target, slot: e.target.value as typeof target.slot })}>
              <option value="packshot">Photo principale (remplace l&apos;actuelle)</option>
              <option value="hover">Visuel au survol</option>
              <option value="gallery">Ajouter à la galerie</option>
            </select>
          </Field>
          <p className="text-xs text-forest-soft">Le visuel ({design.pages.length > 1 ? `page ${page + 1}` : "page affichée"}) est enregistré dans la bibliothèque puis appliqué à la fiche. Astuce : pour la photo principale, utilise le modèle « Photo produit (fond uni) ».</p>
        </div>
      </Modal>

      <Modal open={postOpen} onClose={() => setPostOpen(false)} title="Créer une publication avec ce visuel" size="sm"
        footer={<><Button onClick={() => setPostOpen(false)}>Annuler</Button><Button variant="primary" disabled={saving || !newPost.date} onClick={createPost}>Créer le brouillon</Button></>}>
        <div className="space-y-3">
          <Field label="Titre"><input className="hub-input" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} /></Field>
          <Field label="Réseau"><select className="hub-input" value={newPost.platform} onChange={(e) => setNewPost({ ...newPost, platform: e.target.value as typeof newPost.platform })}><option value="instagram">Instagram</option><option value="story">Story Instagram</option><option value="facebook">Facebook</option><option value="pinterest">Pinterest</option></select></Field>
          <Field label="Date et heure"><input type="datetime-local" className="hub-input" value={newPost.date} onChange={(e) => setNewPost({ ...newPost, date: e.target.value })} /></Field>
          <Field label="Produit mis en avant" hint="La légende est préremplie à partir de la fiche produit."><select className="hub-input" value={newPost.productId} onChange={(e) => setNewPost({ ...newPost, productId: e.target.value })}><option value="">Aucun</option>{siteProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        </div>
      </Modal>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Enregistrer dans la bibliothèque" size="sm"
        footer={<><Button onClick={() => setSaveOpen(false)}>Annuler</Button><Button variant="primary" disabled={saving || !name.trim()} onClick={() => save(false)}>{assetId ? "Mettre à jour" : "Enregistrer"}</Button></>}>
        <div className="space-y-3">
          <Field label="Nom"><input className="hub-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Dossier"><input className="hub-input" list="studio-folders" value={folder} onChange={(e) => setFolder(e.target.value)} /><datalist id="studio-folders">{[...new Set(["Studio", "Instagram", "TikTok", "Pinterest", "Bannières", "Publicités", "Newsletters", ...assets.map((a) => a.folder)])].map((f) => <option key={f} value={f} />)}</datalist></Field>
          <Field label="Mots-clés (séparés par des virgules)"><input className="hub-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="glow, hiver, carrousel" /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ───────── Zone d'édition ───────── */
function Canvas({ design, page, sel, onSelect, onChange }: { design: Design; page: number; sel: string | null; onSelect: (id: string | null) => void; onChange: (l: Layer, record: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [boxes, setBoxes] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const drag = useRef<null | { id: string; mode: "move" | "resize"; sx: number; sy: number; orig: Layer; moved: boolean }>(null);
  const pg = design.pages[page] ?? design.pages[0];

  useEffect(() => {
    const el = wrap.current?.parentElement;
    if (!el) return;
    const fit = () => setScale(Math.min((el.clientWidth - 48) / design.w, (el.clientHeight - 48) / design.h, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [design.w, design.h]);

  useEffect(() => {
    if (!ref.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderPage(ref.current, design, page, scale * dpr);
    const ctx = document.createElement("canvas").getContext("2d")!;
    const b: typeof boxes = {};
    for (const l of pg.layers) {
      if (l.type === "text") b[l.id] = { x: l.x, y: l.y, w: l.w, h: measureTextLayer(ctx, l).height };
      else if (l.type === "logo") b[l.id] = { x: l.x, y: l.y, w: l.w, h: l.w * (l.variant === "mark" ? 1.25 : l.variant === "full" ? 0.27 : 0.23) };
      else b[l.id] = { x: l.x, y: l.y, w: l.w, h: l.h };
    }
    setBoxes(b);
  }, [design, page, scale, pg.layers]);

  const toDesign = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  const hit = (x: number, y: number) => [...pg.layers].reverse().find((l) => { const b = boxes[l.id]; return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; });

  const down = (e: React.PointerEvent, mode: "move" | "resize" = "move", id?: string) => {
    e.stopPropagation();
    const p = toDesign(e);
    const l = id ? pg.layers.find((x) => x.id === id) : hit(p.x, p.y);
    onSelect(l?.id ?? null);
    if (!l) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: l.id, mode, sx: p.x, sy: p.y, orig: JSON.parse(JSON.stringify(l)), moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toDesign(e);
    const dx = p.x - d.sx, dy = p.y - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
    const o = d.orig;
    let next: Layer;
    if (d.mode === "move") next = { ...o, x: o.x + dx, y: o.y + dy };
    else if (o.type === "text") next = { ...o, w: Math.max(40, o.w + dx) };
    else if (o.type === "logo") next = { ...o, w: Math.max(30, o.w + dx) };
    else {
      const ratio = o.h / o.w;
      next = e.shiftKey || o.type === "shape" ? { ...o, w: Math.max(20, o.w + dx), h: Math.max(20, o.h + dy) } : { ...o, w: Math.max(20, o.w + dx), h: Math.max(20, (o.w + dx) * ratio) };
    }
    onChange(next, !d.moved);
    d.moved = true;
  };
  const up = () => { drag.current = null; };

  const b = sel ? boxes[sel] : undefined;
  return (
    <div className="flex min-h-full items-center justify-center">
      <div ref={wrap} className="relative shadow-xl" style={{ width: design.w * scale, height: design.h * scale }} onPointerDown={(e) => down(e)} onPointerMove={move} onPointerUp={up}>
        <canvas ref={ref} className="block h-full w-full" />
        {b && (
          <div className="pointer-events-none absolute border-2 border-[#2F6FB5]" style={{ left: b.x * scale - 2, top: b.y * scale - 2, width: b.w * scale + 4, height: b.h * scale + 4 }}>
            <span className="pointer-events-auto absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-[#2F6FB5]" onPointerDown={(e) => down(e, "resize", sel!)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Templates({ onPick }: { onPick: (build: () => Design) => void }) {
  const cats = [...new Set(TEMPLATE_GALLERY.map((t) => t.category))];
  const [cat, setCat] = useState(cats[0]);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={clsx("rounded-full border px-2 py-0.5 text-[0.7rem]", cat === c ? "border-forest bg-forest text-white" : "border-line")}>{c}</button>)}</div>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATE_GALLERY.filter((t) => t.category === cat).map((t) => {
          const d = t.build({ ...t.sample, format: t.sample.format ?? t.format });
          return (
            <button key={t.id} onClick={() => onPick(() => t.build({ ...t.sample, format: t.sample.format ?? t.format }))} className="overflow-hidden rounded-md border border-line text-left hover:border-forest">
              <DesignPreview design={d} width={130} />
              <span className="block px-2 py-1 text-[0.7rem] font-medium">{t.name}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[0.7rem] text-forest-soft">Tous les modèles respectent la charte SKINCLEAN (couleurs, typographies, logo). Textes et images sont entièrement modifiables.</p>
    </div>
  );
}

function Library({ assets, onOpen }: { assets: Asset[]; onOpen: (a: Asset) => void }) {
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("");
  const folders = [...new Set(assets.map((a) => a.folder))];
  const shown = useMemo(() => assets.filter((a) => (!folder || a.folder === folder) && (!kind || a.kind === kind) && (!q || `${a.name} ${a.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [assets, folder, kind, q]);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2"><SearchI size={14} /><input className="hub-input py-1.5" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-1.5">
        <select className="hub-input py-1 text-xs" value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Dossier"><option value="">Tous les dossiers</option>{folders.map((f) => <option key={f}>{f}</option>)}</select>
        <select className="hub-input py-1 text-xs" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option value="">Tous les types</option><option value="design">Visuels Studio</option><option value="image">Images</option><option value="video">Vidéos</option></select>
      </div>
      {!shown.length && <p className="py-4 text-center text-xs text-forest-soft">Aucun élément. Enregistre un visuel ou importe des photos.</p>}
      <div className="grid grid-cols-2 gap-1.5">
        {shown.map((a) => (
          <button key={a.id} onClick={() => a.design && onOpen(a)} disabled={!a.design} title={a.design ? `Ouvrir ${a.name}` : a.name} className="overflow-hidden rounded-md border border-line text-left enabled:hover:border-forest">
            {a.url && a.kind !== "video"
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={a.url} alt="" className="aspect-square w-full bg-sage-soft object-cover" loading="lazy" />
              : <span className="grid aspect-square place-items-center bg-sage-soft text-xs">{a.kind}</span>}
            <span className="block truncate px-1.5 py-1 text-[0.65rem]">{a.name}</span>
          </button>
        ))}
      </div>
      <Link href="/hub/site?tab=medias" className="block pt-2 text-xs underline">Gérer toute la médiathèque</Link>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <p className="hub-label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {BRAND_SWATCHES.map((s) => (
          <button key={s.hex} title={s.name} aria-label={s.name} onClick={() => onChange(s.hex)} className={clsx("h-7 w-7 rounded-full border", value.toLowerCase() === s.hex.toLowerCase() ? "ring-2 ring-forest ring-offset-2" : "border-line")} style={{ background: s.hex }} />
        ))}
        <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-line" title="Couleur personnalisée" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0" aria-label="Couleur personnalisée" />
        </label>
      </div>
    </div>
  );
}

function Filters({ value, onChange }: { value: { brightness?: number; contrast?: number; saturate?: number; blur?: number }; onChange: (v: typeof value) => void }) {
  const row = (k: keyof typeof value, label: string, min: number, max: number, def: number) => (
    <Field label={`${label} (${value[k] ?? def})`}><input type="range" min={min} max={max} value={value[k] ?? def} onChange={(e) => onChange({ ...value, [k]: Number(e.target.value) })} className="w-full accent-forest" /></Field>
  );
  return (
    <div className="space-y-2 rounded-lg border border-line p-3">
      <p className="hub-label">Retouche de l&apos;image</p>
      {row("brightness", "Luminosité", 50, 150, 100)}
      {row("contrast", "Contraste", 50, 150, 100)}
      {row("saturate", "Saturation", 0, 200, 100)}
      {row("blur", "Flou", 0, 20, 0)}
      <button className="text-xs underline" onClick={() => onChange({})}>Réinitialiser</button>
    </div>
  );
}
