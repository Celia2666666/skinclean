"use client";
import { useId, useState } from "react";

/** Une feuille (remplissage partiel possible : 0 → 1). */
function Leaf({ fill, size, id }: { fill: number; size: number; id: string }) {
  const clip = `leaf-${id}`;
  const d = "M3 21C3 11 9 4 21 3c-1 12-8 18-18 18Z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs><clipPath id={clip}><rect x="0" y="0" width={24 * fill} height="24" /></clipPath></defs>
      <path d={d} fill="currentColor" opacity="0.18" />
      <path d={d} fill="currentColor" clipPath={`url(#${clip})`} />
      <path d="M3.5 20.5C8 15 12 11 17 7" stroke="#fff" strokeOpacity={fill > 0.5 ? 0.55 : 0} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Notation en feuilles (remplace les étoiles). Valeur décimale acceptée (ex. 4,3). */
export function LeafRating({ value, size = 16, className = "", label = true }: { value: number; size?: number; className?: string; label?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={`inline-flex items-center gap-[2px] text-sage-deep ${className}`} role="img" aria-label={label ? `Note : ${value.toFixed(1).replace(".", ",")} feuilles sur 5` : undefined}>
      {[0, 1, 2, 3, 4].map((i) => <Leaf key={i} id={`${id}${i}`} size={size} fill={Math.max(0, Math.min(1, value - i))} />)}
    </span>
  );
}

/** Sélecteur de note en feuilles (formulaire d'avis). */
export function LeafInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent"];
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Ta note" className="flex gap-1 text-sage-deep" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} feuille${n > 1 ? "s" : ""} — ${labels[n]}`} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} className="transition-transform hover:scale-110">
            <Leaf id={`in${n}`} size={30} fill={n <= shown ? 1 : 0} />
          </button>
        ))}
      </div>
      <span className="text-sm text-forest-soft">{labels[shown]}</span>
    </div>
  );
}
