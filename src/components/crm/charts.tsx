"use client";
import { useMemo, useRef, useState } from "react";
import { Legend, SERIES } from "@/components/hub/charts";

/**
 * Graphiques du CRM (SVG sans dépendance), mêmes règles que le Marketing Hub :
 * palette catégorielle fixe (SERIES), une seule échelle par graphique, traits fins, info-bulle au survol,
 * séquentiel = une seule teinte du clair au foncé, textes en encre neutre (jamais la couleur de série).
 */
export { SERIES, Legend };
export const INK = "#1F3329", MUTED = "#898781", GRID = "#E3E1DC", PREV = "#A9A6A0";

export const fmtN = (n: number) => (Math.abs(n) >= 10000 ? `${Math.round(n / 1000)} k` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }));
export const eur = (n: number, d = 0) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d });
export const pctf = (n: number | null | undefined, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? "—" : `${n.toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d })} %`);
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => n <= x) ?? 10) * p;
}

/** Courbe de la période (aire) comparée à la période précédente (tirets gris). */
export function TrendChart({ labels, current, previous, height = 240, format = fmtN, names = ["Période", "Période précédente"] }: { labels: string[]; current: number[]; previous?: number[]; height?: number; format?: (n: number) => string; names?: [string, string] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 720, H = height, L = 48, R = 12, T = 14, B = 26;
  const max = useMemo(() => niceMax(Math.max(...current, ...(previous ?? []), 0)), [current, previous]);
  const x = (i: number) => L + (labels.length < 2 ? (W - L - R) / 2 : (i * (W - L - R)) / (labels.length - 1));
  const y = (v: number) => H - B - (v / max) * (H - T - B);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const i = Math.round(((((e.clientX - r.left) / r.width) * W - L) / (W - L - R)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };
  const every = Math.ceil(labels.length / 8);
  return (
    <div>
      {previous && <Legend items={[{ name: names[0], color: SERIES[0] }, { name: names[1], color: PREV }]} />}
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" role="img" aria-label={`Évolution : ${names[0]}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <defs><linearGradient id="crm-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={SERIES[0]} stopOpacity="0.18" /><stop offset="1" stopColor={SERIES[0]} stopOpacity="0" /></linearGradient></defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t * max)} y2={y(t * max)} stroke={GRID} /><text x={L - 6} y={y(t * max) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{format(t * max)}</text></g>)}
          {labels.map((l, i) => i % every === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill={MUTED}>{l}</text>)}
          {previous && <path d={path(previous)} fill="none" stroke={PREV} strokeWidth={1.5} strokeDasharray="4 4" />}
          <path d={`${path(current)} L${x(current.length - 1)},${H - B} L${x(0)},${H - B} Z`} fill="url(#crm-area)" />
          <path d={path(current)} fill="none" stroke={SERIES[0]} strokeWidth={2} strokeLinejoin="round" />
          {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#5C6862" strokeDasharray="3 3" /><circle cx={x(hover)} cy={y(current[hover] ?? 0)} r={4.5} fill={SERIES[0]} stroke="#fff" strokeWidth={2} /></>}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 z-10 min-w-[160px] rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 10px), calc(100% - 190px))` }}>
            <p className="mb-1 font-semibold">{labels[hover]}</p>
            <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: SERIES[0] }} /><span className="text-forest-soft">{names[0]}</span><span className="ml-auto pl-3 font-medium tabular-nums">{format(current[hover] ?? 0)}</span></p>
            {previous && <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: PREV }} /><span className="text-forest-soft">{names[1]}</span><span className="ml-auto pl-3 font-medium tabular-nums">{format(previous[hover] ?? 0)}</span></p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Barres empilées (ex. CA nouveaux / clients récurrents par mois). 2 px d'espace entre segments. */
export function StackedBars({ labels, series, height = 220, format = fmtN }: { labels: string[]; series: { name: string; color: string; values: number[] }[]; height?: number; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, L = 48, R = 8, T = 12, B = 26;
  const totals = labels.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const bw = (W - L - R) / Math.max(labels.length, 1);
  const y = (v: number) => H - B - (v / max) * (H - T - B);
  return (
    <div>
      <Legend items={series} />
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Barres empilées : ${series.map((s) => s.name).join(", ")}`} onPointerLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t * max)} y2={y(t * max)} stroke={GRID} /><text x={L - 6} y={y(t * max) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{format(t * max)}</text></g>)}
          {labels.map((l, i) => {
            let acc = 0;
            const bx = L + i * bw + bw * 0.18, w = bw * 0.64;
            return (
              <g key={l} onPointerEnter={() => setHover(i)}>
                <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
                {series.map((s, j) => {
                  const v = s.values[i] ?? 0;
                  const y0 = y(acc), y1 = y(acc + v);
                  acc += v;
                  const h = Math.max(0, y0 - y1 - (j < series.length - 1 ? 0 : 0));
                  const top = j === series.length - 1 || series.slice(j + 1).every((x) => !(x.values[i] ?? 0));
                  return h > 0 ? <path key={s.name} d={top ? `M${bx},${y0} V${y1 + Math.min(4, h)} Q${bx},${y1} ${bx + 4},${y1} H${bx + w - 4} Q${bx + w},${y1} ${bx + w},${y1 + Math.min(4, h)} V${y0} Z` : `M${bx},${y0} V${y1 + 1} H${bx + w} V${y0} Z`} fill={s.color} stroke="#fff" strokeWidth={j ? 1 : 0} opacity={hover === null || hover === i ? 1 : 0.55} /> : null;
                })}
                {(labels.length <= 14 || i % 2 === 0) && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill={MUTED}>{l}</text>}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 z-10 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(${((L + hover * bw + bw) / W) * 100}%, calc(100% - 200px))` }}>
            <p className="mb-1 font-semibold">{labels[hover]}</p>
            {series.map((s) => <p key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /><span className="text-forest-soft">{s.name}</span><span className="ml-auto pl-3 font-medium tabular-nums">{format(s.values[hover] ?? 0)}</span></p>)}
            <p className="mt-1 border-t border-line pt-1 font-medium tabular-nums">Total {format(totals[hover])}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Classement horizontal (une seule teinte : la longueur porte la valeur). */
export function HBars({ items, format = fmtN, color = SERIES[0], max: forced }: { items: { label: React.ReactNode; value: number; sub?: React.ReactNode; color?: string; key?: string }[]; format?: (n: number) => string; color?: string; max?: number }) {
  const max = forced ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={it.key ?? i} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate">{it.label}</span><span className="shrink-0 font-medium tabular-nums">{format(it.value)}</span></div>
          <div className="h-2 rounded-full bg-[#F1F0EC]"><div className="h-2 rounded-full transition-all group-hover:opacity-80" style={{ width: `${Math.max(1.5, (it.value / max) * 100)}%`, background: it.color ?? color }} /></div>
          {it.sub && <p className="mt-0.5 text-[0.7rem] text-forest-soft">{it.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Intensité séquentielle : une seule teinte (bleu) du clair au foncé. */
export const seq = (t: number) => {
  const a = [238, 244, 252], b = [26, 78, 150];
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;
};
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export function Heatmap({ grid }: { grid: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(...grid.flat(), 1);
  const total = grid.flat().reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="relative">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: "34px repeat(24, minmax(0, 1fr))" }} onPointerLeave={() => setHover(null)}>
        {grid.map((row, d) => [
          <span key={`l${d}`} className="pr-1 text-right text-[0.68rem] leading-[18px] text-forest-soft">{DAYS[d]}</span>,
          ...row.map((v, h) => <span key={`${d}-${h}`} onPointerEnter={() => setHover([d, h])} className="h-[18px] rounded-[3px] outline-forest" style={{ background: seq(v / max), outline: hover?.[0] === d && hover?.[1] === h ? "2px solid #1F3329" : undefined }} />),
        ])}
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-[0.6rem] text-forest-soft">{h % 3 === 0 ? `${h}h` : ""}</span>)}
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.68rem] text-forest-soft">
        <span>{hover ? <><b className="text-forest">{DAYS[hover[0]]} {hover[1]} h–{hover[1] + 1} h</b> : {grid[hover[0]][hover[1]]} commande(s), {pctf((grid[hover[0]][hover[1]] / total) * 100)} du total</> : "Survole une case pour le détail."}</span>
        <span className="flex items-center gap-1">Moins {[0.1, 0.35, 0.6, 0.85, 1].map((t) => <span key={t} className="h-2.5 w-4 rounded-sm" style={{ background: seq(t) }} />)} Plus</span>
      </div>
    </div>
  );
}

/** Tunnel de conversion : barres décroissantes + taux de passage entre étapes. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={s.label}>
          {i > 0 && <p className="py-0.5 pl-2 text-[0.7rem] text-forest-soft">↓ {pctf((s.value / (steps[i - 1].value || 1)) * 100)} passent à l'étape suivante</p>}
          <div className="flex items-center gap-3">
            <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-[#F1F0EC]">
              <div className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, background: seq(0.12 + (i / Math.max(steps.length - 1, 1)) * 0.4) }} />
              <span className="relative z-10 flex h-full items-center px-3 text-sm font-medium text-forest">{s.label}</span>
            </div>
            <span className="w-24 text-right text-sm font-semibold tabular-nums">{s.value.toLocaleString("fr-FR")}</span>
            <span className="w-16 text-right text-xs tabular-nums text-forest-soft">{pctf((s.value / max) * 100, s.value / max < 0.1 ? 2 : 1)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Nuage de points (matrice produits) : x et y sur leurs propres axes, taille = volume. */
export function Scatter({ points, xLabel, yLabel, xFormat = fmtN, yFormat = fmtN, height = 300, xRef, yRef }: { points: { label: string; x: number; y: number; size: number; color?: string }[]; xLabel: string; yLabel: string; xFormat?: (n: number) => string; yFormat?: (n: number) => string; height?: number; xRef?: number; yRef?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, L = 52, R = 16, T = 14, B = 34;
  const xmax = niceMax(Math.max(...points.map((p) => p.x), 1));
  const ymin = Math.floor(Math.min(...points.map((p) => p.y), 0) / 10) * 10;
  const ymax = niceMax(Math.max(...points.map((p) => p.y), 1));
  const smax = Math.max(...points.map((p) => p.size), 1);
  const x = (v: number) => L + (v / xmax) * (W - L - R);
  const y = (v: number) => H - B - ((v - ymin) / (ymax - ymin || 1)) * (H - T - B);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${yLabel} selon ${xLabel}`} onPointerLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(ymin + t * (ymax - ymin))} y2={y(ymin + t * (ymax - ymin))} stroke={GRID} /><text x={L - 6} y={y(ymin + t * (ymax - ymin)) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{yFormat(ymin + t * (ymax - ymin))}</text><text x={x(t * xmax)} y={H - 18} textAnchor="middle" fontSize={10} fill={MUTED}>{xFormat(t * xmax)}</text></g>)}
        {xRef !== undefined && <line x1={x(xRef)} x2={x(xRef)} y1={T} y2={H - B} stroke="#5C6862" strokeDasharray="4 4" />}
        {yRef !== undefined && <line x1={L} x2={W - R} y1={y(yRef)} y2={y(yRef)} stroke="#5C6862" strokeDasharray="4 4" />}
        <text x={W - R} y={H - 4} textAnchor="end" fontSize={10} fill={MUTED}>{xLabel} →</text>
        <text x={L} y={T - 3} fontSize={10} fill={MUTED}>↑ {yLabel}</text>
        {points.map((p, i) => <circle key={p.label} cx={x(p.x)} cy={y(p.y)} r={5 + (p.size / smax) * 13} fill={p.color ?? SERIES[0]} fillOpacity={hover === null || hover === i ? 0.75 : 0.25} stroke="#fff" strokeWidth={2} onPointerEnter={() => setHover(i)} />)}
        {points.map((p, i) => (p.size / smax > 0.55 || hover === i) && <text key={`t${i}`} x={x(p.x)} y={y(p.y) - 9 - (p.size / smax) * 13} textAnchor="middle" fontSize={10} fill={INK}>{p.label}</text>)}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 z-10 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(${(x(points[hover].x) / W) * 100}%, calc(100% - 200px))` }}>
          <p className="font-semibold">{points[hover].label}</p><p>{xLabel} : <b className="tabular-nums">{xFormat(points[hover].x)}</b></p><p>{yLabel} : <b className="tabular-nums">{yFormat(points[hover].y)}</b></p><p>Unités : <b className="tabular-nums">{points[hover].size}</b></p>
        </div>
      )}
    </div>
  );
}

/** Cascade du compte de résultat : du CA HT au résultat. */
export function Waterfall({ steps, height = 260 }: { steps: { label: string; value: number; total?: boolean }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, L = 52, R = 8, T = 14, B = 40;
  const bars = steps.reduce<(typeof steps[number] & { from: number; to: number })[]>((acc, s) => {
    const prev = acc.at(-1)?.to ?? 0;
    return [...acc, s.total ? { ...s, from: 0, to: s.value } : { ...s, from: prev, to: prev + s.value }];
  }, []);
  const max = niceMax(Math.max(...bars.map((b) => Math.max(b.from, b.to)), 1));
  const min = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to)));
  const y = (v: number) => H - B - ((v - min) / (max - min)) * (H - T - B);
  const bw = (W - L - R) / steps.length;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cascade du compte de résultat" onPointerLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(min + t * (max - min))} y2={y(min + t * (max - min))} stroke={GRID} /><text x={L - 6} y={y(min + t * (max - min)) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{fmtN(min + t * (max - min))}</text></g>)}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#5C6862" />
        {bars.map((b, i) => {
          const top = y(Math.max(b.from, b.to)), h = Math.max(1, Math.abs(y(b.from) - y(b.to)));
          const color = b.total ? (b.value >= 0 ? INK : "#B4443B") : b.value >= 0 ? SERIES[2] : SERIES[1];
          return (
            <g key={b.label} onPointerEnter={() => setHover(i)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              <rect x={L + i * bw + bw * 0.16} y={top} width={bw * 0.68} height={h} rx={3} fill={color} opacity={hover === null || hover === i ? 1 : 0.55} />
              {i < bars.length - 1 && !bars[i + 1].total && <line x1={L + i * bw + bw * 0.84} x2={L + (i + 1) * bw + bw * 0.16} y1={y(b.to)} y2={y(b.to)} stroke={MUTED} strokeDasharray="2 2" />}
              <text x={L + i * bw + bw / 2} y={H - 24} textAnchor="middle" fontSize={9.5} fill={MUTED}>{b.label.split(" ")[0]}</text>
              <text x={L + i * bw + bw / 2} y={H - 12} textAnchor="middle" fontSize={9.5} fill={MUTED}>{b.label.split(" ").slice(1).join(" ")}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 z-10 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(${((L + hover * bw + bw) / W) * 100}%, calc(100% - 170px))` }}>
          <p className="font-semibold">{steps[hover].label}</p><p className="tabular-nums">{eur(steps[hover].value)}</p>
        </div>
      )}
    </div>
  );
}

/** Mini-courbe pour les tuiles d'indicateurs (sans axes, purement décorative + titre accessible). */
export function Sparkline({ values, color = SERIES[0], height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const W = 120, H = height;
  const max = Math.max(...values), min = Math.min(...values);
  const x = (i: number) => (i * W) / (values.length - 1);
  const y = (v: number) => H - 2 - ((v - min) / (max - min || 1)) * (H - 4);
  return <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-full" aria-hidden preserveAspectRatio="none"><polyline fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} /></svg>;
}

/** Barres positives / négatives autour de zéro (ex. résultat mensuel). */
export function PosNegBars({ items, height = 220, format = (n: number) => eur(n) }: { items: { label: string; value: number }[]; height?: number; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, L = 48, R = 8, T = 12, B = 26;
  const hi = niceMax(Math.max(...items.map((i) => i.value), 0)), lo = -niceMax(Math.max(...items.map((i) => -i.value), 0));
  const y = (v: number) => T + ((hi - v) / (hi - lo || 1)) * (H - T - B);
  const bw = (W - L - R) / Math.max(items.length, 1);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Résultat mensuel" onPointerLeave={() => setHover(null)}>
        {[hi, hi / 2, 0, lo / 2, lo].filter((v, i, a) => a.indexOf(v) === i && v >= lo).map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#5C6862" : GRID} /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{fmtN(v)}</text></g>)}
        {items.map((it, i) => {
          const top = y(Math.max(0, it.value)), h = Math.max(1, Math.abs(y(it.value) - y(0)));
          return (
            <g key={it.label} onPointerEnter={() => setHover(i)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              <rect x={L + i * bw + bw * 0.2} y={top} width={bw * 0.6} height={h} rx={3} fill={it.value >= 0 ? SERIES[2] : SERIES[1]} opacity={hover === null || hover === i ? 1 : 0.55} />
              <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill={MUTED}>{it.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && <div className="pointer-events-none absolute top-1 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `min(${((L + hover * bw + bw) / W) * 100}%, calc(100% - 150px))` }}><p className="font-semibold">{items[hover].label}</p><p className="tabular-nums">{items[hover].value >= 0 ? "Bénéfice" : "Perte"} : {format(items[hover].value)}</p></div>}
    </div>
  );
}
