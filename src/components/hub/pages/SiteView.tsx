"use client";
import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { announcements as currentAnnouncements } from "@/data/config";
import type { SiteOverrides, HomeSlide } from "@/lib/site-overrides";
import type { ProductMedia, ProductType } from "@/lib/types";
import type { Asset } from "@/lib/hub/types";
import { Button, Card, Drawer, Empty, Field, Modal, Notice, PageHeader, Tabs, hubApi, copyText, euro, uploadFiles, useAction, useCan, useConfirm, useOnline, useToast } from "../ui";
import { ArrowRightI, CopyI, EditI, EyeI, FolderI, PaletteI, PlusI, SearchI, TrashI, UploadI, ChevronDownI } from "../icons";
import { tplProductHero } from "@/lib/hub/templates";

interface P { id: string; slug: string; name: string; kind: string; tagline: string; description: string; benefits: string[]; tips: string[]; textureLabel: string; isNew: boolean; hidden: boolean; media: ProductMedia; price: number; size: string; bestseller?: number; added: boolean; color: string }
interface K { id: string; slug: string; name: string; group: string; season?: string; tagline: string; items: string[]; discountPercent: number; added: boolean }
type Tab = "produits" | "accueil" | "collection" | "bestsellers" | "textes" | "kits" | "medias";

/** Médiathèque (imports + créations du Studio) accessible depuis chaque champ d'image. */
const AssetsCtx = createContext<Asset[]>([]);

function LibraryPicker({ open, onClose, onPick, video }: { open: boolean; onClose: () => void; onPick: (url: string) => void; video?: boolean }) {
  const assets = useContext(AssetsCtx);
  const [q, setQ] = useState("");
  const list = assets.filter((a) => a.url && (video ? a.kind === "video" : a.kind !== "video") && (!q || `${a.name} ${a.folder}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <Modal open={open} onClose={onClose} title="Choisir dans la bibliothèque" size="lg">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2"><SearchI size={15} className="text-forest-soft" /><input className="hub-input" placeholder="Rechercher un visuel" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Link href="/hub/studio" className="hub-btn hub-btn-secondary">Créer un visuel dans le Studio</Link>
      </div>
      {!list.length ? <Empty title="Aucun visuel" text="Crée un visuel dans le Studio créatif (bouton « Enregistrer dans la bibliothèque ») ou importe des photos." /> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {list.map((a) => (
            <button key={a.id} type="button" onClick={() => { onPick(a.url!); onClose(); }} className="overflow-hidden rounded-md border border-line text-left hover:border-forest">
              {a.kind === "video" ? <video src={a.url} className="aspect-square w-full object-cover" muted /> : // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="aspect-square w-full bg-sage-soft object-contain" loading="lazy" />}
              <span className="block truncate px-2 py-1 text-xs">{a.name}<span className="block text-[0.65rem] text-forest-soft">{a.source === "studio" ? "Studio créatif" : a.folder}</span></span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/** Champ d'import d'un média (image ou vidéo) avec aperçu, enregistré dans /public/media/uploads. */
function MediaInput({ label, value, onChange, accept = "image/*", folder = "site" }: { label: string; value?: string; onChange: (url: string | undefined) => void; accept?: string; folder?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const isVideo = !!value && /\.(mp4|webm|mov)$/i.test(value);
  return (
    <div>
      <p className="hub-label">{label}</p>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-sage-soft">
          {value ? (isVideo ? <video src={value} className="h-full w-full object-cover" muted /> : // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />) : <span className="text-xs text-forest-soft">Aucun</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={clsx("hub-btn hub-btn-secondary hub-btn-sm cursor-pointer", busy && "opacity-50")}><UploadI size={13} />{busy ? "Import…" : value ? "Remplacer" : "Importer"}
            <input type="file" accept={accept} className="sr-only" onChange={async (e) => { if (!e.target.files?.length) return; setBusy(true); try { const up = await uploadFiles(e.target.files, folder, true, "Site"); onChange(up[0].url); } catch (err) { toast("err", (err as Error).message); } finally { setBusy(false); } }} />
          </label>
          <button type="button" className="hub-btn hub-btn-ghost hub-btn-sm" onClick={() => setPicker(true)}><FolderI size={13} />Bibliothèque / Studio</button>
          {value && <button type="button" className="text-left text-xs underline" onClick={() => onChange(undefined)}>Retirer</button>}
          <LibraryPicker open={picker} onClose={() => setPicker(false)} onPick={(u) => onChange(u)} video={accept.startsWith("video")} />
        </div>
      </div>
    </div>
  );
}

export function SiteView({ overrides, products, kits, assets, defaults }: { overrides: SiteOverrides; products: P[]; kits: K[]; assets: Asset[]; defaults: { heroVideo?: string; heroPoster?: string; heroBackground: string } }) {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "accueil");
  const allowed = useCan();
  const online = useOnline();
  return (
    <div>
      <PageHeader eyebrow="Site e-commerce" title="Gestion du site et des visuels" intro={<>Modifie les contenus marketing du site SKINCLEAN : fiches et visuels produits, slider, bannières, collection mise en avant, best-sellers, textes promotionnels et kits saisonniers. Les changements sont publiés immédiatement sur le site (mêmes données produits). Commandes et clients ne sont pas gérés ici.</>}
        actions={<Link href="/" target="_blank" className="hub-btn hub-btn-secondary"><EyeI size={15} />Voir le site</Link>} />
      {!allowed("site.edit") && <div className="mb-4"><Notice tone="warn">Ton rôle permet de consulter cette page, pas de modifier le site.</Notice></div>}
      {online && <div className="mb-4"><Notice>Version en ligne de démonstration : tes modifications sont enregistrées dans l&apos;Admin pour la visite, mais <strong>la boutique publiée ne change pas</strong>. La mise à jour réelle du site se fait depuis l&apos;Admin en local.</Notice></div>}
      {overrides.updatedAt && <p className="mb-3 text-xs text-forest-soft">Dernière publication sur le site : {new Date(overrides.updatedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} par {overrides.updatedBy}.</p>}
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "accueil", label: "Accueil, slider & bannières" }, { id: "produits", label: "Produits : ajouter, descriptions, images", count: products.length }, { id: "collection", label: "Collection mise en avant" },
        { id: "bestsellers", label: "Best-sellers" }, { id: "textes", label: "Textes promotionnels" }, { id: "kits", label: "Kits saisonniers", count: kits.filter((k) => k.group === "saison").length }, { id: "medias", label: "Médiathèque", count: assets.length },
      ]} />
      <AssetsCtx.Provider value={assets}>
      <fieldset disabled={!allowed("site.edit")} className="mt-5">
        {tab === "produits" && <ProductsTab products={products} />}
        {tab === "accueil" && <HomeTab overrides={overrides} defaults={defaults} />}
        {tab === "collection" && <FeaturedTab overrides={overrides} products={products} />}
        {tab === "bestsellers" && <BestsellersTab products={products} overrides={overrides} />}
        {tab === "textes" && <AnnouncementsTab initial={overrides.announcements?.length ? overrides.announcements : currentAnnouncements} />}
        {tab === "kits" && <KitsTab kits={kits} products={products} />}
        {tab === "medias" && <MediaLibrary assets={assets} />}
      </fieldset>
      </AssetsCtx.Provider>
    </div>
  );
}

function ProductsTab({ products }: { products: P[] }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<P | null>(null);
  const [add, setAdd] = useState(false);
  const shown = products.filter((p) => !q || `${p.name} ${p.kind}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2"><SearchI size={15} className="text-forest-soft" /><input className="hub-input w-64 py-1.5" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Button variant="primary" className="ml-auto" icon={<PlusI size={15} />} onClick={() => setAdd(true)}>Ajouter un produit</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((p) => (
          <div key={p.id} className={clsx("hub-card overflow-hidden", p.hidden && "opacity-60")}>
            <div className="relative aspect-square" style={{ background: p.color }}>
              {p.media.packshot && // eslint-disable-next-line @next/next/no-img-element
                <img src={p.media.packshot} alt={p.name} className="h-full w-full object-contain p-4" loading="lazy" />}
              <div className="absolute left-2 top-2 flex flex-wrap gap-1">{p.isNew && <span className="hub-badge bg-forest text-white">Nouveau</span>}{p.bestseller && <span className="hub-badge bg-white">Best-seller #{p.bestseller}</span>}{p.added && <span className="hub-badge bg-[#E2ECF8] text-[#1F4E86]">Ajouté via l&apos;Admin</span>}{p.hidden && <span className="hub-badge bg-[#F8E1E1] text-[#8A2B2B]">Masqué</span>}</div>
            </div>
            <div className="p-3">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-forest-soft">{p.kind} · {p.size} · {euro(p.price)}</p>
              <div className="mt-2 flex gap-1.5"><Button size="sm" icon={<EditI size={13} />} onClick={() => setEdit(p)}>Modifier la fiche</Button><Link href={`/produits/${p.slug}`} target="_blank" className="hub-btn hub-btn-ghost hub-btn-sm"><EyeI size={13} /></Link></div>
            </div>
          </div>
        ))}
      </div>
      {edit && <ProductModal product={edit} onClose={() => setEdit(null)} />}
      {add && <AddProductModal onClose={() => setAdd(false)} />}
    </div>
  );
}

function ProductModal({ product, onClose }: { product: P; onClose: () => void }) {
  const [d, setD] = useState(product);
  const [tab, setTab] = useState<"infos" | "description" | "photos" | "videos">("infos");
  const [galleryPicker, setGalleryPicker] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { run, busy } = useAction();
  const dirty = JSON.stringify(d) !== JSON.stringify(product);
  const save = async () => {
    const patch: Record<string, unknown> = {};
    for (const k of ["name", "kind", "tagline", "description", "benefits", "tips", "textureLabel", "isNew", "hidden", "media"] as const) if (JSON.stringify(d[k]) !== JSON.stringify(product[k])) patch[k] = d[k];
    if (!Object.keys(patch).length) return onClose();
    const r = await run("site/product", { id: product.id, patch }, "Fiche produit mise à jour sur le site");
    if (r) onClose();
  };
  const m = d.media;
  const setM = (patch: Partial<ProductMedia>) => setD({ ...d, media: { ...m, ...patch } });
  return (
    <Drawer open onClose={onClose} width="max-w-4xl"
      title={<span className="flex items-center gap-3">{m.packshot && // eslint-disable-next-line @next/next/no-img-element
        <img src={m.packshot} alt="" className="h-9 w-9 rounded bg-sage-soft object-contain" />}<span>{d.name}<span className="block text-xs font-normal text-forest-soft">{d.kind} · {euro(product.price)} · {product.size}</span></span></span>}
      footer={<><Link href={`/produits/${product.slug}`} target="_blank" className="hub-btn hub-btn-ghost"><EyeI size={15} />Voir sur le site</Link>
        <Link href={`/hub/studio?product=${product.id}`} className="hub-btn hub-btn-secondary"><PaletteI size={15} />Créer un visuel</Link>
        <Button icon={<PlusI size={15} />} className="mr-auto" onClick={async () => {
          try {
            const date = `${new Date(Date.now() + 864e5).toISOString().slice(0, 10)}T18:00`;
            const r = await hubApi<{ id: string }>("posts/create", {
              title: `${d.name} — présentation`, platform: "instagram", format: "post", date, productIds: [product.id], objective: "Notoriété", pillar: "Produits",
              caption: `${d.tagline} ✨\n\n${d.name}, ${d.kind.toLowerCase()} :\n${d.benefits.filter(Boolean).map((b) => `✔︎ ${b}`).join("\n")}\n\n${d.description}`, hashtags: ["#skinclean", "#skincare", "#nouveaute"], cta: "Découvre-le sur skinclean.fr",
              visual: { kind: "design", design: tplProductHero({ headline: d.tagline || d.name, eyebrow: `${d.isNew ? "Nouveau · " : ""}${d.name}`, sub: d.benefits[0], packshot: m.packshot, bg: product.color }) },
            });
            toast("ok", "Publication créée (brouillon) : tu peux la modifier puis la valider.");
            router.push(`/hub/calendrier?post=${r.id}`);
          } catch (e) { toast("err", (e as Error).message); }
        }}>Créer une publication</Button><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy || !dirty} onClick={save}>Publier sur le site</Button></>}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "infos", label: "Informations" }, { id: "description", label: "Description & conseils" }, { id: "photos", label: "Photos", count: [m.packshot, m.hover, ...(m.gallery ?? [])].filter(Boolean).length }, { id: "videos", label: "Vidéos", count: [m.hoverVideo, m.howToVideo].filter(Boolean).length }]} />
      <div className="mt-5">
        {tab === "infos" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom du produit"><input className="hub-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
            <Field label="Nature du soin"><input className="hub-input" value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })} /></Field>
            <Field label="Accroche" className="md:col-span-2"><input className="hub-input" value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} /></Field>
            <Field label="Texture"><input className="hub-input" value={d.textureLabel} onChange={(e) => setD({ ...d, textureLabel: e.target.value })} /></Field>
            <div className="flex flex-col justify-end gap-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-forest" checked={d.isNew} onChange={(e) => setD({ ...d, isNew: e.target.checked })} />Afficher le badge « Nouveau »</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-forest" checked={d.hidden} onChange={(e) => setD({ ...d, hidden: e.target.checked })} />Masquer ce produit du site</label>
            </div>
            <p className="text-xs text-forest-soft md:col-span-2">Prix et stock ({euro(product.price)} · {product.size}) : gérés par la gestion commerciale (futur CRM), non modifiables ici.</p>
          </div>
        )}
        {tab === "description" && (
          <div className="grid gap-4">
            <Field label="Description (fiche produit)"><textarea className="hub-input min-h-40" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
            <Field label="Bénéfices (un par ligne)" hint="Uniquement des bénéfices justifiables (règlement UE 655/2013)."><textarea className="hub-input min-h-28" value={d.benefits.join("\n")} onChange={(e) => setD({ ...d, benefits: e.target.value.split("\n") })} /></Field>
            <Field label="Conseils d'utilisation (un par ligne)"><textarea className="hub-input min-h-24" value={d.tips.join("\n")} onChange={(e) => setD({ ...d, tips: e.target.value.split("\n") })} /></Field>
          </div>
        )}
        {tab === "photos" && (
          <div className="grid gap-6 md:grid-cols-2">
            <MediaInput label="Packshot principal (fond transparent idéal)" value={m.packshot} onChange={(v) => setM({ packshot: v })} folder="produits" />
            <MediaInput label="Visuel au survol (lifestyle / texture)" value={m.hover} onChange={(v) => setM({ hover: v })} folder="produits" />
            <div className="md:col-span-2">
              <p className="hub-label">Galerie de la fiche ({m.gallery?.length ?? 0})</p>
              <div className="flex flex-wrap gap-3">
                {(m.gallery ?? []).map((g, i) => (
                  <div key={g + i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-24 w-24 rounded-md border border-line object-cover" />
                    <button type="button" aria-label="Retirer la photo" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-forest text-white" onClick={() => setM({ gallery: m.gallery!.filter((_, j) => j !== i) })}><TrashI size={12} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setGalleryPicker(true)} className="grid h-24 w-24 place-items-center rounded-md border border-dashed border-line text-xs text-forest-soft hover:border-forest"><span className="flex flex-col items-center gap-1"><FolderI size={18} />Bibliothèque</span></button>
                <LibraryPicker open={galleryPicker} onClose={() => setGalleryPicker(false)} onPick={(u) => setM({ gallery: [...(m.gallery ?? []), u] })} />
                <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-md border border-dashed border-line text-xs text-forest-soft hover:border-forest"><span className="flex flex-col items-center gap-1"><PlusI size={18} />Ajouter</span><input type="file" accept="image/*" multiple className="sr-only" onChange={async (e) => { if (!e.target.files?.length) return; const up = await uploadFiles(e.target.files, "produits", true, "Site"); setM({ gallery: [...(m.gallery ?? []), ...up.map((u) => u.url)] }); }} /></label>
              </div>
            </div>
            <div className="md:col-span-2"><Notice>Avant/après : uniquement de vraies photos fournies par la marque (règle d&apos;honnêteté du site).</Notice></div>
          </div>
        )}
        {tab === "videos" && (
          <div className="grid gap-6 md:grid-cols-2">
            <MediaInput label="Vidéo d'application au survol (MP4 court, muet)" value={m.hoverVideo} onChange={(v) => setM({ hoverVideo: v })} accept="video/*" folder="produits" />
            <MediaInput label="Vidéo tutoriel « Comment l'utiliser ? »" value={m.howToVideo} onChange={(v) => setM({ howToVideo: v })} accept="video/*" folder="produits" />
          </div>
        )}
      </div>
    </Drawer>
  );
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const [d, setD] = useState({ name: "", kind: "", tagline: "", type: "serum" as ProductType, price: 0, size: "30 ml", stock: 0, description: "", benefits: "", usage: "", textureLabel: "", packshot: undefined as string | undefined });
  const { run, busy } = useAction();
  const types: ProductType[] = ["nettoyant", "demaquillant", "toner", "serum", "creme", "brume", "contour-yeux", "patchs", "masque", "toner-pads", "exfoliant", "soin-cible", "spf", "accessoire"];
  return (
    <Modal open onClose={onClose} title="Ajouter un produit au site" size="lg"
      footer={<><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy || !d.name || !(d.price > 0)} onClick={async () => { const r = await run("site/product-create", { ...d, benefits: d.benefits.split("\n").filter(Boolean) }, "Produit ajouté au catalogue du site"); if (r) onClose(); }}>Ajouter au site</Button></>}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nom"><input className="hub-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Nature du soin"><input className="hub-input" value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })} placeholder="Sérum hydratant" /></Field>
        <Field label="Catégorie"><select className="hub-input" value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as ProductType })}>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Accroche"><input className="hub-input" value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} /></Field>
        <Field label="Prix (€)"><input type="number" step={0.1} min={0} className="hub-input" value={d.price} onChange={(e) => setD({ ...d, price: Number(e.target.value) })} /></Field>
        <div className="grid grid-cols-2 gap-2"><Field label="Contenance"><input className="hub-input" value={d.size} onChange={(e) => setD({ ...d, size: e.target.value })} /></Field><Field label="Stock"><input type="number" min={0} className="hub-input" value={d.stock} onChange={(e) => setD({ ...d, stock: Number(e.target.value) })} /></Field></div>
        <Field label="Description" className="md:col-span-2"><textarea className="hub-input" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
        <Field label="Bénéfices (un par ligne)"><textarea className="hub-input" value={d.benefits} onChange={(e) => setD({ ...d, benefits: e.target.value })} /></Field>
        <Field label="Mode d'emploi"><textarea className="hub-input" value={d.usage} onChange={(e) => setD({ ...d, usage: e.target.value })} /></Field>
        <MediaInput label="Packshot" value={d.packshot} onChange={(v) => setD({ ...d, packshot: v })} folder="produits" />
        <p className="text-xs text-forest-soft">La liste INCI sera à compléter avec la formule validée. Le produit apparaît dans le catalogue, les catégories et la recherche du site, marqué « Nouveau ».</p>
      </div>
    </Modal>
  );
}

function HomeTab({ overrides, defaults }: { overrides: SiteOverrides; defaults: { heroVideo?: string; heroPoster?: string; heroBackground: string } }) {
  const h = overrides.home ?? {};
  const [hero, setHero] = useState(h.hero ?? { title: "Your skin. Your glow.", subtitle: "Une peau qui rayonne, une routine qui te ressemble.", cta: "Découvrir SKINCLEAN", ctaHref: "/soins-visage" });
  const [media, setMedia] = useState({ heroVideo: h.heroVideo ?? defaults.heroVideo, heroPoster: h.heroPoster ?? defaults.heroPoster, heroBackground: h.heroBackground ?? defaults.heroBackground });
  const [slides, setSlides] = useState<HomeSlide[]>(h.slides ?? []);
  const [banner, setBanner] = useState(h.promoBanner ?? { enabled: false, text: "-20 % sur ta 1ʳᵉ commande avec la newsletter", href: "/club", bg: "#1F3329", color: "#FFFFFF" });
  const { run, busy } = useAction();
  const save = (home: NonNullable<SiteOverrides["home"]>, msg: string) => run("site/home", { home }, msg);
  return (
    <div className="space-y-5">
      <Card title="Hero de l'accueil" subtitle="Texte et visuels de la première section du site." action={<Button size="sm" variant="primary" disabled={busy} onClick={() => save({ hero, ...media }, "Hero publié sur le site")}>Publier</Button>}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <Field label="Titre"><input className="hub-input" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></Field>
            <Field label="Sous-titre"><input className="hub-input" value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Bouton"><input className="hub-input" value={hero.cta} onChange={(e) => setHero({ ...hero, cta: e.target.value })} /></Field><Field label="Lien du bouton"><input className="hub-input" value={hero.ctaHref ?? ""} onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })} /></Field></div>
            <Field label="Couleur de fond"><input type="color" className="hub-input h-10 w-24 p-1" value={media.heroBackground} onChange={(e) => setMedia({ ...media, heroBackground: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4">
            <MediaInput label="Vidéo du hero (verticale, MP4 muet)" value={media.heroVideo} onChange={(v) => setMedia({ ...media, heroVideo: v })} accept="video/*" />
            <MediaInput label="Image de secours (poster)" value={media.heroPoster} onChange={(v) => setMedia({ ...media, heroPoster: v })} />
          </div>
        </div>
      </Card>

      <Card title="Bannière promotionnelle" subtitle="Bandeau affiché sous le hero." action={<Button size="sm" variant="primary" disabled={busy} onClick={() => save({ promoBanner: banner }, banner.enabled ? "Bannière publiée" : "Bannière désactivée")}>Publier</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" className="accent-forest" checked={banner.enabled} onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })} />Afficher la bannière sur le site</label>
          <Field label="Texte"><input className="hub-input" value={banner.text} onChange={(e) => setBanner({ ...banner, text: e.target.value })} /></Field>
          <Field label="Lien"><input className="hub-input" value={banner.href ?? ""} onChange={(e) => setBanner({ ...banner, href: e.target.value })} /></Field>
          <div className="flex gap-3"><Field label="Fond"><input type="color" className="hub-input h-10 w-20 p-1" value={banner.bg ?? "#1F3329"} onChange={(e) => setBanner({ ...banner, bg: e.target.value })} /></Field><Field label="Texte"><input type="color" className="hub-input h-10 w-20 p-1" value={banner.color ?? "#FFFFFF"} onChange={(e) => setBanner({ ...banner, color: e.target.value })} /></Field></div>
          <MediaInput label="Image de fond (facultative)" value={banner.image} onChange={(v) => setBanner({ ...banner, image: v })} />
          <div className="md:col-span-2"><p className="hub-label">Aperçu</p><div className="px-4 py-4 text-center text-sm font-medium" style={{ background: banner.bg, color: banner.color, backgroundImage: banner.image ? `linear-gradient(rgb(0 0 0 / .25), rgb(0 0 0 / .25)), url(${banner.image})` : undefined, backgroundSize: "cover" }}>{banner.text}</div></div>
        </div>
      </Card>

      <Card title="Slider de visuels" subtitle="Carrousel « À la une » affiché après la bannière (masqué s'il est vide)." action={<><Button size="sm" icon={<PlusI size={13} />} onClick={() => setSlides([...slides, { id: `s${Date.now()}`, image: "/media/videos/hero-poster.webp", title: "Nouveau visuel", text: "", cta: "Découvrir", href: "/soins-visage" }])}>Ajouter</Button><Button size="sm" variant="primary" disabled={busy} onClick={() => save({ slides }, "Slider publié")}>Publier</Button></>}>
        {!slides.length ? <p className="text-sm text-forest-soft">Aucun visuel : le slider n&apos;apparaît pas sur le site.</p> : (
          <div className="space-y-3">
            {slides.map((s, i) => (
              <div key={s.id} className="grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[220px_1fr_auto]">
                <MediaInput label={`Visuel ${i + 1}`} value={s.image} onChange={(v) => setSlides(slides.map((x, j) => (j === i ? { ...x, image: v ?? x.image } : x)))} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="hub-input" placeholder="Titre" value={s.title} onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="hub-input" placeholder="Texte" value={s.text ?? ""} onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                  <input className="hub-input" placeholder="Bouton" value={s.cta ?? ""} onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, cta: e.target.value } : x)))} />
                  <input className="hub-input" placeholder="Lien" value={s.href ?? ""} onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" aria-label="Monter" disabled={i === 0} onClick={() => setSlides(slides.map((x, j) => (j === i - 1 ? slides[i] : j === i ? slides[i - 1] : x)))}><span className="rotate-180"><ChevronDownI size={14} /></span></Button>
                  <Button size="sm" variant="ghost" aria-label="Descendre" disabled={i === slides.length - 1} onClick={() => setSlides(slides.map((x, j) => (j === i + 1 ? slides[i] : j === i ? slides[i + 1] : x)))}><ChevronDownI size={14} /></Button>
                  <Button size="sm" variant="ghost" icon={<TrashI size={14} />} aria-label="Retirer" onClick={() => setSlides(slides.filter((_, j) => j !== i))} />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-forest-soft">Astuce : crée tes bannières dans le Studio créatif (modèle « Bannière de site »), télécharge-les puis importe-les ici.</p>
      </Card>
    </div>
  );
}

function FeaturedTab({ overrides, products }: { overrides: SiteOverrides; products: P[] }) {
  const [f, setF] = useState(overrides.home?.featured ?? { enabled: false, eyebrow: "Collection hiver", title: "Cocon d'hiver", text: "Textures riches et gestes lents pour une peau protégée du froid.", href: "/kits/winter-rescue", productIds: ["sc-dm-02", "sc-sr-03", "sc-cr-02", "sc-ms-01"] });
  const { run, busy } = useAction();
  return (
    <Card title="Collection mise en avant" subtitle="Section affichée sur l'accueil, après les best-sellers." action={<Button size="sm" variant="primary" disabled={busy} onClick={() => run("site/home", { home: { featured: f } }, f.enabled ? "Collection publiée sur l'accueil" : "Section désactivée")}>Publier</Button>}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" className="accent-forest" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} />Afficher sur le site</label>
        <Field label="Surtitre"><input className="hub-input" value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })} /></Field>
        <Field label="Titre"><input className="hub-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Texte" className="md:col-span-2"><textarea className="hub-input" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        <Field label="Lien du bouton"><input className="hub-input" value={f.href} onChange={(e) => setF({ ...f, href: e.target.value })} /></Field>
        <MediaInput label="Image (facultative)" value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        <Field label="Produits (4 max)" className="md:col-span-2">
          <div className="flex flex-wrap gap-1.5">{products.filter((p) => !p.hidden).map((p) => { const on = f.productIds.includes(p.id); return <button type="button" key={p.id} onClick={() => setF({ ...f, productIds: on ? f.productIds.filter((x) => x !== p.id) : [...f.productIds, p.id].slice(0, 4) })} className={clsx("rounded-full border px-2.5 py-1 text-xs", on ? "border-forest bg-forest text-white" : "border-line")}>{p.name}</button>; })}</div>
        </Field>
      </div>
    </Card>
  );
}

function BestsellersTab({ products, overrides }: { products: P[]; overrides: SiteOverrides }) {
  const initial = overrides.bestsellers ?? products.filter((p) => p.bestseller).sort((a, b) => (a.bestseller ?? 0) - (b.bestseller ?? 0)).map((p) => p.id);
  const [ids, setIds] = useState<string[]>(initial);
  const { run, busy } = useAction();
  const name = (id: string) => products.find((p) => p.id === id);
  return (
    <Card title="Best-sellers (7 maximum)" subtitle="Ordre d'affichage de la section « The Glow Favorites » et de la page Best-sellers." action={<Button size="sm" variant="primary" disabled={busy} onClick={() => run("site/bestsellers", { ids }, "Best-sellers publiés")}>Publier</Button>}>
      <div className="grid gap-5 lg:grid-cols-2">
        <ol className="space-y-2">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-2">
              <span className="w-6 text-center font-display font-semibold">{i + 1}</span>
              {name(id)?.media.packshot && // eslint-disable-next-line @next/next/no-img-element
                <img src={name(id)!.media.packshot} alt="" className="h-10 w-10 object-contain" />}
              <span className="flex-1 text-sm font-medium">{name(id)?.name ?? id}</span>
              <Button size="sm" variant="ghost" aria-label="Monter" disabled={i === 0} onClick={() => setIds(ids.map((x, j) => (j === i - 1 ? ids[i] : j === i ? ids[i - 1] : x)))}><span className="rotate-180"><ChevronDownI size={14} /></span></Button>
              <Button size="sm" variant="ghost" aria-label="Descendre" disabled={i === ids.length - 1} onClick={() => setIds(ids.map((x, j) => (j === i + 1 ? ids[i] : j === i ? ids[i + 1] : x)))}><ChevronDownI size={14} /></Button>
              <Button size="sm" variant="ghost" icon={<TrashI size={14} />} aria-label="Retirer" onClick={() => setIds(ids.filter((x) => x !== id))} />
            </li>
          ))}
        </ol>
        <div>
          <p className="hub-label">Ajouter un produit {ids.length >= 7 && "(maximum atteint)"}</p>
          <div className="flex flex-wrap gap-1.5">{products.filter((p) => !ids.includes(p.id) && !p.hidden).map((p) => <button type="button" key={p.id} disabled={ids.length >= 7} onClick={() => setIds([...ids, p.id])} className="rounded-full border border-line px-2.5 py-1 text-xs enabled:hover:border-forest disabled:opacity-40">{p.name}</button>)}</div>
        </div>
      </div>
    </Card>
  );
}

function AnnouncementsTab({ initial }: { initial: string[] }) {
  const [items, setItems] = useState(initial);
  const { run, busy } = useAction();
  return (
    <Card title="Bandeau d'annonces" subtitle="Messages qui défilent en haut de toutes les pages du site." action={<Button size="sm" variant="primary" disabled={busy} onClick={() => run("site/announcements", { items }, "Textes promotionnels publiés")}>Publier</Button>}>
      <div className="space-y-2">
        {items.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input className="hub-input" value={t} maxLength={140} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <Button variant="ghost" icon={<TrashI size={14} />} aria-label="Retirer" onClick={() => setItems(items.filter((_, j) => j !== i))} />
          </div>
        ))}
        <Button size="sm" icon={<PlusI size={13} />} disabled={items.length >= 10} onClick={() => setItems([...items, ""])}>Ajouter un message</Button>
      </div>
      <div className="mt-4 overflow-hidden bg-forest py-2 text-[0.72rem] font-medium text-ivory"><div className="flex gap-12 whitespace-nowrap px-4">{items.filter(Boolean).map((a, i) => <span key={i}>{a}</span>)}</div></div>
      <p className="mt-2 text-xs text-forest-soft">Rappel : toute offre affichée doit correspondre à des conditions réelles (page Conditions des offres).</p>
    </Card>
  );
}

function KitsTab({ kits, products }: { kits: K[]; products: P[] }) {
  const [add, setAdd] = useState<null | { name: string; tagline: string; description: string; season: string; productIds: string[]; discountPercent: number; routine: string }>(null);
  const { run, busy } = useAction();
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" icon={<PlusI size={15} />} onClick={() => setAdd({ name: "", tagline: "", description: "", season: "hiver", productIds: [], discountPercent: 10, routine: "" })}>Ajouter un kit saisonnier</Button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kits.map((k) => (
          <Card key={k.id} title={k.name} subtitle={`${k.group === "saison" ? `Kit de saison${k.season ? ` · ${k.season}` : ""}` : k.group === "routine" ? "Routine" : "Voyage"} · -${k.discountPercent} %`} action={<Link href={`/kits/${k.slug}`} target="_blank" className="hub-btn hub-btn-ghost hub-btn-sm"><EyeI size={13} /></Link>}>
            <p className="text-sm">{k.tagline}</p>
            <p className="mt-2 text-xs text-forest-soft">{k.items.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean).join(" · ")}</p>
            {k.added && <span className="hub-badge mt-2 bg-[#E2ECF8] text-[#1F4E86]">Ajouté via l&apos;Admin</span>}
          </Card>
        ))}
      </div>
      <Modal open={!!add} onClose={() => setAdd(null)} title="Nouveau kit saisonnier" size="lg"
        footer={<><Button onClick={() => setAdd(null)}>Annuler</Button><Button variant="primary" disabled={busy || !add?.name || (add?.productIds.length ?? 0) < 2} onClick={async () => { const r = await run("site/kit-create", { ...add, routine: add!.routine.split("\n").filter(Boolean) }, "Kit publié sur le site (page Kits de saison)"); if (r) setAdd(null); }}>Publier le kit</Button></>}>
        {add && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nom"><input className="hub-input" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} /></Field>
            <Field label="Saison"><select className="hub-input" value={add.season} onChange={(e) => setAdd({ ...add, season: e.target.value })}><option value="hiver">Hiver</option><option value="printemps">Printemps</option><option value="ete">Été</option><option value="automne">Automne</option></select></Field>
            <Field label="Accroche" className="md:col-span-2"><input className="hub-input" value={add.tagline} onChange={(e) => setAdd({ ...add, tagline: e.target.value })} /></Field>
            <Field label="Description" className="md:col-span-2"><textarea className="hub-input" value={add.description} onChange={(e) => setAdd({ ...add, description: e.target.value })} /></Field>
            <Field label="Remise du kit (%)" hint="Le prix est calculé automatiquement à partir des prix catalogue."><input type="number" min={0} max={30} className="hub-input" value={add.discountPercent} onChange={(e) => setAdd({ ...add, discountPercent: Number(e.target.value) })} /></Field>
            <Field label="Routine (une étape par ligne)"><textarea className="hub-input" value={add.routine} onChange={(e) => setAdd({ ...add, routine: e.target.value })} /></Field>
            <Field label={`Produits (${add.productIds.length}, 2 à 6)`} className="md:col-span-2"><div className="flex flex-wrap gap-1.5">{products.filter((p) => !p.hidden).map((p) => { const on = add.productIds.includes(p.id); return <button type="button" key={p.id} onClick={() => setAdd({ ...add, productIds: on ? add.productIds.filter((x) => x !== p.id) : [...add.productIds, p.id].slice(0, 6) })} className={clsx("rounded-full border px-2.5 py-1 text-xs", on ? "border-forest bg-forest text-white" : "border-line")}>{p.name}</button>; })}</div></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MediaLibrary({ assets }: { assets: Asset[] }) {
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("");
  const [busyUp, setBusyUp] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("Imports");
  const toast = useToast();
  const { run, refresh } = useAction();
  const { ask, dialog } = useConfirm();
  const folders = [...new Set(assets.map((a) => a.folder))];
  const shown = useMemo(() => assets.filter((a) => (!folder || a.folder === folder) && (!kind || a.kind === kind) && (!q || `${a.name} ${a.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [assets, folder, kind, q]);
  return (
    <div>
      {dialog}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2"><SearchI size={15} className="text-forest-soft" /><input className="hub-input w-56 py-1.5" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select className="hub-input w-auto py-1.5" value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Dossier"><option value="">Tous les dossiers</option>{folders.map((f) => <option key={f}>{f}</option>)}</select>
        <select className="hub-input w-auto py-1.5" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option value="">Tous les types</option><option value="image">Images</option><option value="video">Vidéos</option><option value="design">Visuels Studio</option></select>
        <div className="ml-auto flex items-center gap-2">
          <input className="hub-input w-36 py-1.5" list="media-folders" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} aria-label="Dossier d'import" />
          <datalist id="media-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
          <label className={clsx("hub-btn hub-btn-primary cursor-pointer", busyUp && "opacity-50")}><UploadI size={15} />{busyUp ? "Import…" : "Importer"}<input type="file" multiple accept="image/*,video/*" className="sr-only" onChange={async (e) => { if (!e.target.files?.length) return; setBusyUp(true); try { const up = await uploadFiles(e.target.files, "bibliotheque", true, uploadFolder); toast("ok", `${up.length} fichier(s) importé(s)`); refresh(); } catch (err) { toast("err", (err as Error).message); } finally { setBusyUp(false); } }} /></label>
        </div>
      </div>
      {!shown.length ? <Empty title="Médiathèque vide" text="Importe photos et vidéos, ou enregistre des visuels depuis le Studio créatif." /> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((a) => (
            <div key={a.id} className="hub-card overflow-hidden">
              <div className="aspect-square bg-sage-soft">
                {a.kind === "video" && a.url ? <video src={a.url} className="h-full w-full object-cover" muted /> : a.url ? // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={a.name}>{a.name}</p>
                <p className="text-[0.65rem] text-forest-soft">{a.folder} · {a.kind === "design" ? "Studio" : a.kind}{a.size ? ` · ${Math.round(a.size / 1024)} Ko` : ""}</p>
                <div className="mt-1 flex gap-1">
                  {a.url && <Button size="sm" variant="ghost" icon={<CopyI size={12} />} aria-label="Copier l'URL" title="Copier l'URL" onClick={() => copyText(a.url!, toast, "URL copiée")} />}
                  {a.design && <Link href={`/hub/studio?asset=${a.id}`} className="hub-btn hub-btn-ghost hub-btn-sm" title="Ouvrir dans le Studio"><ArrowRightI size={12} /></Link>}
                  <Button size="sm" variant="ghost" icon={<TrashI size={12} />} aria-label="Retirer de la médiathèque" onClick={async () => { if (await ask("Retirer ce média de la médiathèque ?", "Le fichier reste disponible pour les contenus qui l'utilisent déjà.", "Retirer", true)) run("assets/delete", { id: a.id }, "Média retiré"); }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
