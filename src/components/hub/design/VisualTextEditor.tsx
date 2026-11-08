"use client";
import { useState } from "react";
import clsx from "clsx";
import type { Design, TextLayer, Visual } from "@/lib/hub/types";
import { DesignPreview } from "./DesignPreview";

/** Libellé lisible d'un calque texte, d'après son rôle dans la page. */
function labelFor(l: TextLayer, all: TextLayer[]): string {
  if (/sticker/i.test(l.text)) return "Mention du sticker";
  if (l.text.includes("·")) return "Réponses / options (séparées par « · »)";
  const biggest = Math.max(...all.map((x) => x.size));
  if (l.size === biggest) return "Titre";
  if (l.upper || l.letterSpacing) return "Surtitre";
  return "Texte";
}

/** Modifie directement les textes du visuel (titre, réponses d'un sondage, slides…) avec aperçu en direct. */
export function VisualTextEditor({ visual, onChange, disabled }: { visual: Visual; onChange: (v: Visual) => void; disabled?: boolean }) {
  const key: "design" | "poster" = visual.kind === "design" ? "design" : "poster";
  const design = visual[key];
  const [page, setPage] = useState(0);
  if (!design) return null;
  const p = Math.min(page, design.pages.length - 1);
  const texts = design.pages[p].layers.filter((l): l is TextLayer => l.type === "text");

  const edit = (id: string, text: string) => {
    const next: Design = { ...design, pages: design.pages.map((pg, i) => (i !== p ? pg : { ...pg, layers: pg.layers.map((l) => (l.id === id && l.type === "text" ? { ...l, text } : l)) })) };
    onChange({ ...visual, [key]: next });
  };

  return (
    <div className="grid gap-4 rounded-xl border border-line bg-sage-soft/40 p-4 md:col-span-2 md:grid-cols-[220px_1fr]">
      <div>
        <DesignPreview design={design} page={p} width={220} rounded />
        {design.pages.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {design.pages.map((_, i) => <button type="button" key={i} onClick={() => setPage(i)} className={clsx("h-7 min-w-7 rounded-full border px-2 text-xs", i === p ? "border-forest bg-forest text-white" : "border-line bg-white")}>{i + 1}</button>)}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <p className="hub-label">Textes du visuel{design.pages.length > 1 ? ` · page ${p + 1} / ${design.pages.length}` : ""}</p>
          <p className="text-xs text-forest-soft">Ce que tu écris ici apparaît directement sur l&apos;image publiée. La taille s&apos;ajuste automatiquement pour tenir dans le cadre.</p>
        </div>
        {!texts.length && <p className="text-sm text-forest-soft">Cette page ne contient pas de texte.</p>}
        {texts.map((l) => (
          <label key={l.id} className="block">
            <span className="mb-1 block text-xs font-medium text-forest-soft">{labelFor(l, texts)}</span>
            <textarea disabled={disabled} rows={Math.min(4, Math.max(1, Math.ceil(l.text.length / 60)))} className="hub-input" value={l.text} onChange={(e) => edit(l.id, e.target.value)} />
          </label>
        ))}
      </div>
    </div>
  );
}
