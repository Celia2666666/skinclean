"use client";
import { useMemo, useRef, useState } from "react";

/**
 * Graphiques SVG légers (sans dépendance).
 * Palette catégorielle validée, ordre fixe : la couleur suit l'entité, jamais le rang.
 * Une seule échelle verticale par graphique, traits fins, info-bulle au survol, légende dès 2 séries.
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const ENTITY_COLOR: Record<string, string> = { instagram: SERIES[0], tiktok: SERIES[1], facebook: SERIES[2], pinterest: SERIES[3], story: SERIES[4] };

const fmt = (n: number) => (Math.abs(n) >= 10000 ? `${Math.round(n / 1000)} k` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export interface Series { name: string; color: string; values: number[] }

export function LineChart({ labels, series, height = 220, unit = "", invert = false }: { labels: string[]; series: Series[]; height?: number; unit?: string; invert?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 640, H = height, L = 44, R = 12, T = 12, B = 26;
  const max = useMemo(() => niceMax(Math.max(...series.flatMap((s) => s.values), 0)), [series]);
  const x = (i: number) => L + (labels.length < 2 ? (W - L - R) / 2 : (i * (W - L - R)) / (labels.length - 1));
  const y = (v: number) => (invert ? T + (v / max) * (H - T - B) : H - B - (v / max) * (H - T - B));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };
  return (
    <div>
      {series.length > 1 && <Legend items={series} />}
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Graphique : ${series.map((s) => s.name).join(", ")}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#E3E1DC" strokeWidth={1} /><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#898781">{fmt(t)}</text></g>)}
          {labels.map((l, i) => (labels.length <= 12 || i % Math.ceil(labels.length / 8) === 0) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#898781">{l}</text>)}
          {series.map((s) => (
            <g key={s.name}>
              <polyline fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
              {s.values.map((v, i) => (hover === i || s.values.length <= 12) && <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 3} fill={s.color} stroke="#fff" strokeWidth={2} />)}
            </g>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#5C6862" strokeWidth={1} strokeDasharray="3 3" />}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 z-10 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 10px), calc(100% - 170px))` }}>
            <p className="mb-1 font-semibold">{labels[hover]}</p>
            {series.map((s) => <p key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /><span className="text-forest-soft">{s.name}</span><span className="ml-auto pl-3 font-medium tabular-nums">{fmt(s.values[hover] ?? 0)}{unit}</span></p>)}
          </div>
        )}
      </div>
    </div>
  );
}

export function BarChart({ items, height = 200, unit = "" }: { items: { label: string; value: number; color: string }[]; height?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, L = 44, R = 8, T = 12, B = 26;
  const max = niceMax(Math.max(...items.map((i) => i.value), 0));
  const bw = (W - L - R) / Math.max(items.length, 1);
  const y = (v: number) => H - B - (v / max) * (H - T - B);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Graphique en barres" onPointerLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t * max)} y2={y(t * max)} stroke="#E3E1DC" /><text x={L - 6} y={y(t * max) + 4} textAnchor="end" fontSize={10} fill="#898781">{fmt(t * max)}</text></g>)}
        {items.map((it, i) => {
          const h = H - B - y(it.value);
          const bx = L + i * bw + bw * 0.2, w = bw * 0.6;
          return (
            <g key={it.label} onPointerEnter={() => setHover(i)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              <path d={`M${bx},${H - B} V${H - B - h + Math.min(4, h)} Q${bx},${H - B - h} ${bx + Math.min(4, h)},${H - B - h} H${bx + w - Math.min(4, h)} Q${bx + w},${H - B - h} ${bx + w},${H - B - h + Math.min(4, h)} V${H - B} Z`} fill={it.color} opacity={hover === null || hover === i ? 1 : 0.55} />
              <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#898781">{it.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && items[hover] && (
        <div className="pointer-events-none absolute top-1 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(${((L + hover * bw + bw) / W) * 100}%, calc(100% - 150px))` }}>
          <p className="font-semibold">{items[hover].label}</p><p className="tabular-nums">{fmt(items[hover].value)}{unit}</p>
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-forest-soft">{items.map((s) => <span key={s.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>)}</div>;
}
