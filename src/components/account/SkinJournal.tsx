"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { deletePhoto, getPhoto, putPhoto, useAccount, useStore, type JournalEntry } from "@/lib/store";
import { getProduct } from "@/lib/catalog";
import { frDate, uid } from "@/lib/format";
import { BeforeAfter } from "@/components/product/BeforeAfter";
import { CameraIcon, CheckIcon, LockIcon, TrashIcon } from "@/components/ui/Icons";

const MILESTONES = [0, 7, 14, 30];
const MEASURES: { k: "hydration" | "imperfections" | "redness" | "glow"; label: string; hint: string }[] = [
  { k: "hydration", label: "Hydratation", hint: "1 = tiraille · 5 = très confortable" },
  { k: "imperfections", label: "Imperfections", hint: "1 = aucune · 5 = nombreuses" },
  { k: "redness", label: "Rougeurs", hint: "1 = aucune · 5 = très présentes" },
  { k: "glow", label: "Éclat", hint: "1 = terne · 5 = lumineux" },
];
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

/** Charge une photo du journal depuis IndexedDB (jamais envoyée à un serveur en mode démo). */
function usePhoto(key?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined;
    if (key) getPhoto(key).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } });
    else setUrl(undefined);
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [key]);
  return url;
}

async function resize(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const s = Math.min(1, 1200 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.85));
}

export function SkinJournal() {
  const acc = useAccount()!;
  const j = acc.journal;
  const update = useStore((s) => s.updateJournal);
  const diags = useStore((s) => s.diagHistory);
  const [consent, setConsent] = useState(false);
  const [routineId, setRoutineId] = useState(acc.routines[0]?.id ?? "");
  const [editing, setEditing] = useState<number | null>(null);

  if (!j.enabled) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl md:text-5xl">Mon Skin Journal </h1>
        <div className="overflow-hidden rounded-none bg-blush-soft p-6 md:p-10">
          <p className="max-w-2xl text-lg">Suis l&apos;évolution de ta peau pendant ta routine : un état initial (J0), puis des bilans à J7, J14 et J30 — et au-delà si tu le souhaites. Photos, ressentis, régularité : tout reste privé.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {MILESTONES.map((d, i) => (
              <motion.div key={d} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }} className="rounded-none bg-ivory p-4 text-center">
                <p className="font-display text-3xl">J{d}</p>
                <p className="text-xs text-forest-soft">{d === 0 ? "État initial" : d === 30 ? "Bilan complet" : d === 7 ? "Premier bilan" : "Deuxième bilan"}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 space-y-3 rounded-none bg-ivory p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold"><LockIcon size={18} /> Tes données, ton contrôle</p>
            <ul className="list-disc space-y-1 pl-5 text-forest-soft">
              <li>Les photos de visage et observations cutanées sont des données sensibles : elles ne sont accessibles qu&apos;à toi.</li>
              <li>En mode démo, elles restent uniquement sur cet appareil (stockage local du navigateur). En production : stockage chiffré, accès réservé à ton compte.</li>
              <li>Conservation : {j.retentionMonths} mois maximum, suppression possible à tout moment, photo par photo ou en totalité.</li>
              <li>Le Skin Journal n&apos;établit aucun diagnostic médical et ne mesure pas automatiquement ta peau : il affiche uniquement ce que tu déclares.</li>
            </ul>
            {acc.routines.length > 0 && (
              <div><label className="label" htmlFor="jr">Routine suivie</label>
                <select id="jr" className="input" value={routineId} onChange={(e) => setRoutineId(e.target.value)}>
                  {acc.routines.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
            {acc.routines.length === 0 && <p className="text-xs">Astuce : enregistre d&apos;abord une routine depuis ton <Link href="/skin-diag" className="underline">Skin Diag</Link>{diags.length ? " (tes résultats sont prêts)" : ""} pour suivre ses produits.</p>}
            <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#24392F]" /><span>Je consens explicitement au traitement de mes photos et observations cutanées pour mon suivi personnel. Je peux retirer ce consentement à tout moment.</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={j.reminders} onChange={(e) => update({ reminders: e.target.checked })} className="mt-1 accent-[#24392F]" /><span>Recevoir des rappels facultatifs par e-mail à J7, J14 et J30.</span></label>
            <button disabled={!consent} onClick={() => update({ enabled: true, consentAt: Date.now(), startDate: Date.now(), routineId: routineId || undefined, checkins: [] })} className="btn btn-primary">Activer mon Skin Journal</button>
          </div>
        </div>
      </div>
    );
  }

  const day = Math.floor((Date.now() - (j.startDate ?? Date.now())) / 864e5);
  const routine = acc.routines.find((r) => r.id === j.routineId);
  const routineProducts = (routine?.items.filter((i) => i.selected).map((i) => i.productId) ?? []).filter((v, i, a) => a.indexOf(v) === i);
  const extra = j.entries.filter((e) => !MILESTONES.includes(e.day)).map((e) => e.day);
  const days = [...MILESTONES, ...extra].sort((a, b) => a - b);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Mon Skin Journal </h1>
          <p className="mt-1 text-forest-soft">Jour {day} de ton suivi{routine ? ` · ${routine.name}` : ""}</p>
        </div>
        <CheckinButton />
      </div>

      {/* Frise des bilans */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-8 h-1 rounded-full bg-line" />
        <motion.div className="absolute left-0 top-8 h-1 rounded-full bg-forest" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (day / 30) * 100)}%` }} transition={{ duration: 1.4 }} />
        <div className="no-scrollbar relative flex justify-between gap-4 overflow-x-auto pb-2">
          {days.map((d) => {
            const e = j.entries.find((x) => x.day === d);
            const due = d <= day;
            return (
              <button key={d} onClick={() => setEditing(d)} className="flex shrink-0 flex-col items-center gap-2">
                <motion.span whileHover={{ scale: 1.08 }} className={`grid h-16 w-16 place-items-center rounded-full border-4 border-cream font-display text-lg shadow ${e ? "bg-forest text-ivory" : due ? "bg-butter" : "bg-ivory"}`}>{e ? <CheckIcon /> : `J${d}`}</motion.span>
                <span className="text-xs">{e ? `J${d} · fait` : due ? `J${d} · à faire` : `J${d} · le ${frDate((j.startDate ?? 0) + d * 864e5)}`}</span>
              </button>
            );
          })}
          <button onClick={() => setEditing(Math.max(31, day, ...days.map((d) => d + 1)))} className="flex shrink-0 flex-col items-center gap-2">
            <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-forest/30 bg-cream text-2xl">+</span>
            <span className="text-xs">Suivi libre</span>
          </button>
        </div>
      </div>

      <AnimatePresence>{editing !== null && <EntryEditor day={editing} existing={j.entries.find((e) => e.day === editing)} products={routineProducts} onClose={() => setEditing(null)} />}</AnimatePresence>

      <Comparator entries={j.entries} />
      <Evolution entries={j.entries} />
      <Calendar start={j.startDate ?? Date.now()} checkins={j.checkins ?? []} entries={j.entries} />

      {/* Produits & ressentis */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-none bg-ivory p-6">
          <p className="font-display text-2xl">Produits utilisés</p>
          <ul className="mt-3 space-y-1 text-sm">
            {Array.from(new Set(j.entries.flatMap((e) => e.products))).map((id) => <li key={id}>• {getProduct(id)?.name ?? id}</li>)}
            {j.entries.every((e) => !e.products.length) && <li className="text-forest-soft">Coche les produits utilisés dans chaque bilan.</li>}
          </ul>
        </div>
        <div className="rounded-none bg-ivory p-6">
          <p className="font-display text-2xl">Journal des ressentis</p>
          <ul className="mt-3 space-y-3 text-sm">
            {j.entries.filter((e) => e.note).map((e) => <li key={e.id}><b>J{e.day}</b> — {e.note}</li>)}
            {!j.entries.some((e) => e.note) && <li className="text-forest-soft">Tes notes apparaîtront ici.</li>}
          </ul>
        </div>
      </div>

      <Privacy />
    </div>
  );
}

function CheckinButton() {
  const acc = useAccount()!;
  const update = useStore((s) => s.updateJournal);
  const today = dayKey();
  const done = acc.journal.checkins?.includes(today);
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={() => update({ checkins: done ? acc.journal.checkins!.filter((d) => d !== today) : [...(acc.journal.checkins ?? []), today] })} className={`btn ${done ? "btn-soft" : "btn-primary"}`}>
      {done ? <><CheckIcon size={18} /> Routine faite aujourd&apos;hui</> : "J'ai fait ma routine aujourd'hui"}
    </motion.button>
  );
}

function EntryEditor({ day, existing, products, onClose }: { day: number; existing?: JournalEntry; products: string[]; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertJournalEntry);
  const [e, setE] = useState<JournalEntry>(existing ?? { id: uid("j_"), day, date: Date.now(), hydration: 3, imperfections: 3, redness: 3, glow: 3, products: [...products], note: "", routineDone: true });
  const [saving, setSaving] = useState(false);
  const preview = usePhoto(e.photoKey);

  const onFile = async (f?: File) => {
    if (!f) return;
    setSaving(true);
    const key = `photo-${e.id}-${Date.now()}`;
    await putPhoto(key, await resize(f));
    if (e.photoKey) await deletePhoto(e.photoKey);
    setE({ ...e, photoKey: key });
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-end bg-forest/30 backdrop-blur-sm md:place-items-center" onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(x) => x.stopPropagation()} role="dialog" aria-label={`Bilan J${day}`} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-cream p-6 md:rounded-none">
        <p className="font-display text-3xl">Bilan J{day}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-[200px_1fr]">
          <label className="relative grid aspect-[4/5] cursor-pointer place-items-center overflow-hidden rounded-none bg-ivory text-center text-sm">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={`Photo J${day}`} className="absolute inset-0 h-full w-full object-cover" />
            ) : <span className="p-4"><CameraIcon className="mx-auto" size={30} /><span className="mt-2 block">{saving ? "Enregistrement…" : "Ajouter une photo (lumière naturelle, de face)"}</span></span>}
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(x) => onFile(x.target.files?.[0])} />
          </label>
          <div className="space-y-4">
            {MEASURES.map((m) => (
              <div key={m.k}>
                <div className="flex justify-between text-sm"><label htmlFor={`m-${m.k}`} className="font-semibold">{m.label}</label><span>{e[m.k]} / 5</span></div>
                <input id={`m-${m.k}`} type="range" min={1} max={5} value={e[m.k]} onChange={(x) => setE({ ...e, [m.k]: Number(x.target.value) })} className="w-full accent-[#24392F]" />
                <p className="text-[0.7rem] text-forest-soft">{m.hint}</p>
              </div>
            ))}
          </div>
        </div>
        {products.length > 0 && (
          <fieldset className="mt-5">
            <legend className="label">Produits utilisés</legend>
            <div className="flex flex-wrap gap-2">
              {products.map((id) => {
                const on = e.products.includes(id);
                return <button key={id} type="button" onClick={() => setE({ ...e, products: on ? e.products.filter((x) => x !== id) : [...e.products, id] })} className={`chip px-3 py-1.5 ${on ? "bg-forest text-ivory" : "bg-ivory"}`}>{getProduct(id)?.name}</button>;
              })}
            </div>
          </fieldset>
        )}
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!e.routineDone} onChange={(x) => setE({ ...e, routineDone: x.target.checked })} className="accent-[#24392F]" /> J&apos;ai suivi ma routine régulièrement depuis le dernier bilan</label>
        <div className="mt-4"><label className="label" htmlFor="note">Mon ressenti</label><textarea id="note" rows={3} className="input" value={e.note} onChange={(x) => setE({ ...e, note: x.target.value })} placeholder="Comment se sent ta peau ?" /></div>
        <div className="mt-5 flex gap-2">
          <button className="btn btn-primary" onClick={() => { upsert({ ...e, date: Date.now() }); onClose(); }} disabled={saving}>Enregistrer le bilan</button>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Comparator({ entries }: { entries: JournalEntry[] }) {
  const withPhoto = entries.filter((e) => e.photoKey);
  const [a, setA] = useState<string>();
  const [b, setB] = useState<string>();
  const ea = withPhoto.find((e) => e.id === a) ?? withPhoto[0];
  const eb = withPhoto.find((e) => e.id === b) ?? withPhoto[withPhoto.length - 1];
  const ua = usePhoto(ea?.photoKey);
  const ub = usePhoto(eb?.photoKey);
  return (
    <section className="rounded-none bg-sky-soft p-6">
      <p className="font-display text-3xl">Comparer mes photos</p>
      {withPhoto.length < 2 ? (
        <p className="mt-2 text-sm text-forest-soft">Ajoute une photo à au moins deux bilans (par exemple J0 et J7) pour les comparer avec le curseur.</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_260px]">
          <BeforeAfter labelBefore={`J${ea.day}`} labelAfter={`J${eb.day}`} beforeNode={ua ? <img src={ua} alt={`J${ea.day}`} className="h-full w-full object-cover" /> : <div />} afterNode={ub ? <img src={ub} alt={`J${eb.day}`} className="h-full w-full object-cover" /> : <div />} hoverFollow />
          <div className="space-y-3 text-sm">
            <div><label className="label" htmlFor="ca">Avant</label><select id="ca" className="input" value={ea.id} onChange={(x) => setA(x.target.value)}>{withPhoto.map((e) => <option key={e.id} value={e.id}>J{e.day} — {frDate(e.date)}</option>)}</select></div>
            <div><label className="label" htmlFor="cb">Après</label><select id="cb" className="input" value={eb.id} onChange={(x) => setB(x.target.value)}>{withPhoto.map((e) => <option key={e.id} value={e.id}>J{e.day} — {frDate(e.date)}</option>)}</select></div>
            <p className="text-xs text-forest-soft">Les différences observées dépendent aussi de la lumière et de l&apos;angle : prends tes photos dans les mêmes conditions. Aucune analyse automatique n&apos;est réalisée.</p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Petits multiples : une courbe par observation déclarée (échelle 1-5 commune). */
function Evolution({ entries }: { entries: JournalEntry[] }) {
  const [table, setTable] = useState(false);
  const pts = [...entries].sort((x, y) => x.day - y.day);
  const maxDay = Math.max(30, ...pts.map((p) => p.day));
  return (
    <section className="rounded-none bg-ivory p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-3xl">Évolution de mes observations</p>
          <p className="text-xs text-forest-soft">Uniquement ce que tu as déclaré (1 à 5). Aucun pourcentage calculé.</p>
        </div>
        <button onClick={() => setTable(!table)} className="chip bg-cream px-3 py-1.5">{table ? "Voir les graphiques" : "Voir le tableau"}</button>
      </div>
      {pts.length === 0 ? <p className="mt-4 text-sm text-forest-soft">Fais ton premier bilan (J0) pour voir apparaître tes courbes.</p> : table ? (
        <table className="mt-4 w-full text-sm">
          <thead><tr className="text-left text-forest-soft"><th className="py-2">Jour</th>{MEASURES.map((m) => <th key={m.k}>{m.label}</th>)}</tr></thead>
          <tbody>{pts.map((p) => <tr key={p.id} className="border-t border-line"><td className="py-2">J{p.day}</td>{MEASURES.map((m) => <td key={m.k}>{p[m.k]}</td>)}</tr>)}</tbody>
        </table>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEASURES.map((m) => <MiniLine key={m.k} title={m.label} hint={m.hint} points={pts.map((p) => ({ x: p.day, y: p[m.k] }))} maxX={maxDay} />)}
        </div>
      )}
    </section>
  );
}

function MiniLine({ title, hint, points, maxX }: { title: string; hint: string; points: { x: number; y: number }[]; maxX: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 240, Hh = 120, P = 18;
  const sx = (x: number) => P + (x / maxX) * (W - 2 * P);
  const sy = (y: number) => Hh - P - ((y - 1) / 4) * (Hh - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.y)}`).join(" ");
  return (
    <figure className="rounded-none bg-cream p-4">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <p className="text-[0.65rem] text-forest-soft">{hint}</p>
      <svg viewBox={`0 0 ${W} ${Hh}`} className="mt-2 w-full" role="img" aria-label={`${title} : ${points.map((p) => `J${p.x} = ${p.y}`).join(", ")}`}>
        {[1, 3, 5].map((g) => <g key={g}><line x1={P} x2={W - P} y1={sy(g)} y2={sy(g)} stroke="#E8E3D6" strokeWidth="1" /><text x={2} y={sy(g) + 3} fontSize="8" fill="#5b7368">{g}</text></g>)}
        <motion.path d={d} fill="none" stroke="#24392F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r="12" fill="transparent" />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={hover === i ? 5.5 : 4} fill="#24392F" stroke="#F4F3EF" strokeWidth="2" />
          </g>
        ))}
        {hover !== null && (
          <g>
            <rect x={Math.min(sx(points[hover].x) - 26, W - 58)} y={Math.max(sy(points[hover].y) - 30, 0)} width="52" height="20" rx="6" fill="#FFFEFB" stroke="#E8E3D6" />
            <text x={Math.min(sx(points[hover].x), W - 32)} y={Math.max(sy(points[hover].y) - 16, 14)} fontSize="9" textAnchor="middle" fill="#24392F">J{points[hover].x} : {points[hover].y}/5</text>
          </g>
        )}
      </svg>
    </figure>
  );
}

function Calendar({ start, checkins, entries }: { start: number; checkins: string[]; entries: JournalEntry[] }) {
  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => new Date(start + i * 864e5)), [start]);
  const done = checkins.length;
  const elapsed = Math.max(1, Math.min(35, Math.floor((Date.now() - start) / 864e5) + 1));
  return (
    <section className="rounded-none bg-ivory p-6">
      <p className="font-display text-3xl">Calendrier & régularité</p>
      <p className="text-sm text-forest-soft">Routine faite {done} jour{done > 1 ? "s" : ""} sur {elapsed} depuis le début du suivi.</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const k = dayKey(d);
          const isEntry = entries.some((e) => e.day === i);
          const isDone = checkins.includes(k);
          const future = d.getTime() > Date.now();
          return (
            <div key={k} title={`J${i} — ${d.toLocaleDateString("fr-FR")}${isDone ? " · routine faite" : ""}${isEntry ? " · bilan" : ""}`} className={`relative grid aspect-square place-items-center rounded-[2px] text-xs ${isDone ? "bg-sage" : future ? "bg-cream/60 text-forest/40" : "bg-cream"} ${isEntry ? "ring-2 ring-forest" : ""}`}>
              {d.getDate()}
              {MILESTONES.includes(i) && <span className="absolute -top-1 right-0 text-[0.55rem] font-bold">J{i}</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-forest-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sage" /> Routine faite</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-forest" /> Bilan enregistré</span>
      </div>
    </section>
  );
}

function Privacy() {
  const acc = useAccount()!;
  const update = useStore((s) => s.updateJournal);
  const upsert = useStore((s) => s.upsertJournalEntry);
  const wipePhotos = async () => {
    if (!confirm("Supprimer toutes les photos du Skin Journal ?")) return;
    for (const e of acc.journal.entries) if (e.photoKey) { await deletePhoto(e.photoKey); upsert({ ...e, photoKey: undefined }); }
  };
  const wipeAll = async () => {
    if (!confirm("Désactiver le Skin Journal et supprimer toutes ses données ?")) return;
    for (const e of acc.journal.entries) if (e.photoKey) await deletePhoto(e.photoKey);
    update({ enabled: false, entries: [], checkins: [], consentAt: undefined, startDate: undefined });
  };
  return (
    <section className="rounded-none bg-blush-soft p-6 text-sm">
      <p className="flex items-center gap-2 font-display text-2xl"><LockIcon /> Confidentialité & rappels</p>
      <p className="mt-2">Consentement donné le {acc.journal.consentAt ? frDate(acc.journal.consentAt) : "—"} · conservation {acc.journal.retentionMonths} mois maximum.</p>
      <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={acc.journal.reminders} onChange={(e) => update({ reminders: e.target.checked })} className="accent-[#24392F]" /> Rappels e-mail à J7, J14 et J30</label>
      <p className="mt-1 text-xs text-forest-soft">J7 : « Et si on faisait un premier point sur ta peau ? » · J14 : « Ta routine avance, prends un moment pour observer ta peau ! » · J30 : « 30 jours de glow : découvre ton Skin Journal ! »</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={wipePhotos} className="btn btn-ghost px-4 py-2"><TrashIcon size={16} /> Supprimer mes photos</button>
        <button onClick={wipeAll} className="btn px-4 py-2 text-[#a14d5f] underline">Désactiver et tout supprimer</button>
      </div>
    </section>
  );
}
