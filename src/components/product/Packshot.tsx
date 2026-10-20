import Image from "next/image";
import type { Product } from "@/lib/types";

/**
 * Packshot produit.
 * - Si `media.packshot` est renseigné → vraie photo (optimisée par next/image).
 * - Sinon → flacon SVG provisoire aux couleurs du produit, étiqueté « visuel provisoire ».
 */
export function Packshot({ product, className = "", priority = false, sizes = "(max-width: 768px) 60vw, 25vw", showTag = true, shadow = false }: { product: Product; className?: string; priority?: boolean; sizes?: string; showTag?: boolean; shadow?: boolean }) {
  if (product.media.packshot) {
    return (
      <div className={`relative ${className}`}>
        {/* Pas de filtre CSS ici : il isolerait le mix-blend-mode qui fond le fond de la photo */}
        {shadow && <div className="absolute inset-x-[15%] bottom-0 h-[6%] rounded-[50%] bg-forest/25 blur-md" />}
        <Image src={product.media.packshot} alt={`${product.name} — ${product.kind}`} fill sizes={sizes} priority={priority} className="object-contain" />
      </div>
    );
  }
  return (
    <div className={`relative ${className} ${shadow ? "drop-shadow-[0_30px_30px_rgba(52,77,67,0.25)]" : ""}`}>
      <BottleSVG product={product} />
      {showTag && <span className="placeholder-tag text-forest/70">Visuel provisoire</span>}
    </div>
  );
}

export function BottleSVG({ product }: { product: Product }) {
  const id = product.id.replace(/[^a-z0-9]/gi, "");
  const { accent, liquid } = product.color;
  const name = product.name.length > 16 ? product.name.split(" ").slice(0, 2).join(" ") : product.name;
  const kind = product.kind.length > 30 ? product.kind.slice(0, 28) + "…" : product.kind;

  const defs = (
    <defs>
      <linearGradient id={`g-${id}`} x1="0" x2="1">
        <stop offset="0" stopColor={accent} stopOpacity="0.95" />
        <stop offset="0.45" stopColor={liquid} stopOpacity="0.95" />
        <stop offset="1" stopColor={accent} stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id={`hl-${id}`} x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.65" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`cap-${id}`} x1="0" x2="1">
        <stop offset="0" stopColor="#2a3f37" />
        <stop offset="0.5" stopColor="#4c6a5e" />
        <stop offset="1" stopColor="#22352e" />
      </linearGradient>
      <radialGradient id={`sh-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#24392F" stopOpacity="0.22" />
        <stop offset="1" stopColor="#24392F" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  const label = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill="#FFFEFB" />
      <path d={`M${x + w / 2 - 6} ${y + 12} q 8 -6 4 4 q -6 8 4 6`} stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x={x + w / 2} y={y + 30} textAnchor="middle" fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700" fontSize="11" fill="#6B7F6A" letterSpacing="-0.3">skinclean</text>
      <line x1={x + w / 2 - 10} x2={x + w / 2 + 10} y1={y + 37} y2={y + 37} stroke="#C9C2B0" strokeWidth="0.6" />
      <text x={x + w / 2} y={y + 49} textAnchor="middle" fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="600" fontSize="7.4" fill="#24392F" letterSpacing="0.6">{name.toUpperCase()}</text>
      {h > 62 && (
        <foreignObject x={x + 6} y={y + 53} width={w - 12} height={h - 56}>
          <div style={{ fontSize: 5.4, lineHeight: 1.3, textAlign: "center", color: "#5b7368", fontFamily: "Helvetica Neue, Arial, sans-serif" }}>{kind}</div>
        </foreignObject>
      )}
    </g>
  );

  const shadow = <ellipse cx="100" cy="246" rx="62" ry="8" fill={`url(#sh-${id})`} />;
  const shine = (x: number, y: number, h: number) => <rect x={x} y={y} width="10" height={h} rx="5" fill={`url(#hl-${id})`} opacity="0.8" />;

  let body: React.ReactNode;
  switch (product.pack) {
    case "dropper":
      body = (
        <g>
          {shadow}
          <rect x="54" y="104" width="92" height="138" rx="12" fill={`url(#g-${id})`} />
          <rect x="84" y="88" width="32" height="20" rx="3" fill={`url(#g-${id})`} />
          <rect x="78" y="58" width="44" height="34" rx="5" fill={`url(#cap-${id})`} />
          <path d="M86 58 C86 22, 114 22, 114 58 Z" fill={`url(#cap-${id})`} />
          {label(64, 132, 72, 84)}
          {shine(60, 110, 120)}
        </g>
      );
      break;
    case "tube":
      body = (
        <g>
          {shadow}
          <path d="M66 40 L134 40 L128 200 Q100 208 72 200 Z" fill={product.color.liquid} stroke={accent} strokeOpacity="0.35" />
          <rect x="62" y="30" width="76" height="12" rx="2" fill={accent} opacity="0.55" />
          <rect x="74" y="200" width="52" height="42" rx="8" fill={`url(#cap-${id})`} />
          {label(76, 86, 48, 70)}
          {shine(72, 50, 140)}
        </g>
      );
      break;
    case "jar":
      body = (
        <g>
          {shadow}
          <rect x="44" y="150" width="112" height="92" rx="18" fill={`url(#g-${id})`} />
          <rect x="40" y="118" width="120" height="38" rx="10" fill={`url(#cap-${id})`} />
          {label(66, 168, 68, 60)}
          {shine(50, 158, 74)}
        </g>
      );
      break;
    case "pump":
      body = (
        <g>
          {shadow}
          <rect x="58" y="96" width="84" height="146" rx="30" fill={`url(#g-${id})`} />
          <rect x="88" y="62" width="24" height="36" rx="3" fill={`url(#cap-${id})`} />
          <path d="M84 62 h48 v10 h-14 v-4 h-34 z" fill={`url(#cap-${id})`} />
          {label(68, 136, 64, 76)}
          {shine(64, 110, 118)}
        </g>
      );
      break;
    case "mist":
      body = (
        <g>
          {shadow}
          <rect x="68" y="82" width="64" height="160" rx="22" fill={`url(#g-${id})`} />
          <rect x="86" y="50" width="28" height="34" rx="5" fill={`url(#cap-${id})`} />
          <circle cx="114" cy="62" r="2" fill="#fff" opacity="0.8" />
          {label(74, 128, 52, 80)}
          {shine(72, 96, 130)}
        </g>
      );
      break;
    case "pads":
      body = (
        <g>
          {shadow}
          <rect x="40" y="152" width="120" height="90" rx="20" fill={`url(#g-${id})`} />
          <ellipse cx="100" cy="152" rx="56" ry="12" fill="#fff" opacity="0.9" />
          <ellipse cx="100" cy="150" rx="46" ry="8" fill={product.color.bg} />
          <rect x="36" y="120" width="128" height="34" rx="10" fill={accent} opacity="0.35" />
          {label(66, 172, 68, 56)}
        </g>
      );
      break;
    case "patch":
      body = (
        <g>
          {shadow}
          <rect x="40" y="70" width="120" height="172" rx="16" fill={product.color.liquid} stroke={accent} strokeOpacity="0.4" />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={66 + c * 34} cy={172 + r * 22} r={8 - r} fill="#fff" stroke={accent} strokeOpacity="0.5" />))}
          {label(62, 84, 76, 70)}
        </g>
      );
      break;
    default:
      body = (
        <g>
          {shadow}
          <rect x="62" y="92" width="76" height="150" rx="16" fill={`url(#g-${id})`} />
          <rect x="82" y="64" width="36" height="32" rx="6" fill={`url(#cap-${id})`} />
          {label(70, 134, 60, 80)}
          {shine(68, 100, 130)}
        </g>
      );
  }

  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" role="img" aria-label={`${product.name} — visuel provisoire`}>
      {defs}
      {body}
    </svg>
  );
}
