"use client";
import { Button } from "@/components/hub/ui";
import { AlertI, CheckI, RefreshI, SparkI } from "@/components/hub/icons";
import { Pill } from "./ui";
import type { Ticket } from "@/lib/crm/types";

const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;

/** Badge de tri dans les listes. */
export function AiBadge({ t }: { t: Ticket }) {
  if (!t.ai) return t.status === "ouvert" ? <Pill tone="neutral">Tri en cours…</Pill> : null;
  if (t.ai.autoSent && !t.ai.checked) return <Pill tone="info">Répondu auto · à vérifier</Pill>;
  if (t.ai.autoSent) return <Pill tone="ok">Réponse auto vérifiée</Pill>;
  if (t.ai.triage === "humain" && t.status !== "resolu") return <Pill tone="bad">⚠ À toi de répondre</Pill>;
  return null;
}

/** Panneau de l'assistant SAV dans le détail d'une demande. */
export function AiPanel({ t, busy, onUseDraft, onCheck, onRegenerate }: { t: Ticket; busy: boolean; onUseDraft: (d: string) => void; onCheck: () => void; onRegenerate: () => void }) {
  const ai = t.ai;
  if (!ai) return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-3 text-sm">
      <span className="text-forest-soft">Pas encore analysée par l'assistant SAV.</span>
      <Button size="sm" icon={<SparkI size={13} />} disabled={busy} onClick={onRegenerate}>Analyser</Button>
    </div>
  );
  const engine = ai.engine === "ia" ? "rédigé par l'IA (Claude)" : "réponse type complétée avec la commande";
  if (ai.autoSent) return (
    <div className={`mt-4 rounded-lg border p-3 text-sm ${ai.checked ? "border-sage bg-sage-soft" : "border-[#BFD3EC] bg-[#EEF4FB]"}`}>
      <p className="flex items-center gap-2 font-semibold"><SparkI size={15} />Réponse envoyée automatiquement le {dt(ai.at)}</p>
      <p className="mt-1 text-xs text-forest-soft">Tri : {ai.reason} Texte {engine}.</p>
      {!ai.checked ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" icon={<CheckI size={13} />} disabled={busy} onClick={onCheck}>C'est bon, vérifié</Button>
          <Button size="sm" onClick={() => onUseDraft("Bonjour,\n\nPetit complément à notre réponse précédente : ")}>Compléter la réponse</Button>
        </div>
      ) : <p className="mt-1 text-xs font-medium text-[#2E5E3E]">✓ Vérifiée</p>}
    </div>
  );
  if (ai.triage === "humain" && t.status !== "resolu") return (
    <div className="mt-4 rounded-lg border border-[#E8C8C8] bg-[#FBF1F1] p-3 text-sm text-[#7A2B2B]">
      <p className="flex items-center gap-2 font-semibold"><AlertI size={15} />Attention : c'est à toi de répondre</p>
      <p className="mt-1">{ai.reason}</p>
      <p className="mt-1 text-xs opacity-80">Un brouillon ({engine}) est prêt dans la zone de réponse : relis-le, complète les passages entre crochets puis envoie.</p>
      <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => onUseDraft(ai.draft)}>Remettre le brouillon</Button><Button size="sm" icon={<RefreshI size={13} />} disabled={busy} onClick={onRegenerate}>Régénérer</Button></div>
    </div>
  );
  return null;
}

/** Brouillon proposé à l'ouverture : uniquement pour les demandes encore à traiter par l'équipe. */
export const initialDraft = (t: Ticket) => (t.ai?.triage === "humain" && t.status !== "resolu" && !t.ai.autoSent ? t.ai.draft : "");
