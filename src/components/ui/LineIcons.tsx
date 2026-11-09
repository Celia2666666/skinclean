import type { SVGProps } from "react";

/**
 * Pictogrammes au trait (contour seul, sans remplissage) pour les valeurs de la marque et les réponses du Skin Diag.
 * Même grammaire que Icons.tsx : grille 24 px, trait 1,5, extrémités arrondies.
 */
type P = SVGProps<SVGSVGElement> & { size?: number };
const S = ({ size = 24, children, ...p }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>{children}</svg>
);

const paths: Record<string, React.ReactNode> = {
  // Valeurs de la marque
  rabbit: <><path d="M9 11c-1.5-2-2.2-5-1.4-7.2.9.2 2.4 2.6 2.9 5.6" /><path d="M13.5 9.4c.4-3 1.9-5.3 2.9-5.6.8 2.2.1 5.2-1.4 7.2" /><path d="M6.5 15.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5-2.5 4.5-5.5 4.5-5.5-1.5-5.5-4.5Z" /><path d="M10 15h.01M14 15h.01M11.3 17.2h1.4" /></>,
  sprout: <><path d="M12 21v-8" /><path d="M12 13c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6Z" /><path d="M12 11c0-3.5 2.5-6.5 7-6.5 0 4-2.7 6.5-7 6.5Z" /><path d="M8 21h8" /></>,
  list: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" /></>,
  people: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16 14.2c2.4-.2 4 1.4 4.5 4.3" /></>,
  tag: <><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0L3.5 12.2Z" /><circle cx="8" cy="8" r="1.4" /></>,
  // Peau
  drop: <path d="M12 3.5c3 3.6 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.9 6-10.5Z" />,
  dropMinus: <><path d="M12 3.5c3 3.6 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.9 6-10.5Z" /><path d="M9.5 14.5h5" /></>,
  crack: <><path d="M4 6h16v12H4z" /><path d="m9 6 1.5 4-2 2.5 2 5.5M15 18l-1.5-3.5 2-2.5-1.5-6" /></>,
  shine: <><path d="M12 3.5c3 3.6 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.9 6-10.5Z" /><path d="M9.5 13.5c.2-1.3.9-2.4 2-3.2" /></>,
  half: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /><path d="M12 8h3.5M12 12h4.5M12 16h3.5" /></>,
  balance: <><circle cx="12" cy="12" r="8" /><path d="m8.5 12.2 2.3 2.3 4.7-5" /></>,
  feather: <><path d="M19.5 4.5c-6 0-11 4.5-11 11v4" /><path d="M8.5 15.5c5 0 9-3 11-11" /><path d="M8.5 12.5h5M10 9.5h5" /></>,
  question: <><circle cx="12" cy="12" r="8" /><path d="M9.8 9.6a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.5v.4" /><path d="M12 16.6h.01" /></>,
  dots: <><circle cx="8.5" cy="9" r="2" /><circle cx="15.5" cy="8" r="1.4" /><circle cx="13" cy="15.5" r="2.4" /></>,
  pinpoints: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01M13 9h.01M11 13.5h.01M15 13h.01M10 16h.01" /></>,
  flame: <path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1.5 2-2 3.5-2 3.5S11 7.5 11 3.5C8 6 6 9.5 6 15a6 6 0 0 0 6 6Z" />,
  grid: <><path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" strokeWidth={2.4} /></>,
  cloud: <path d="M7.5 18.5h9.5a3.5 3.5 0 0 0 .3-7 5.5 5.5 0 0 0-10.6-1.2A4.2 4.2 0 0 0 7.5 18.5Z" />,
  eye: <><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.6" /><path d="M8 19.5c1.3.6 2.6.8 4 .8s2.7-.2 4-.8" /></>,
  waves: <><path d="M4 8c2.7-2 5.3 2 8 0s5.3-2 8 0" /><path d="M4 12.5c2.7-2 5.3 2 8 0s5.3-2 8 0" /><path d="M4 17c2.7-2 5.3 2 8 0s5.3-2 8 0" /></>,
  bubble: <><circle cx="12" cy="12" r="7.5" /><path d="M8.5 10a4 4 0 0 1 3-3" /></>,
  stretch: <><path d="M4 12h16" /><path d="m7 9-3 3 3 3M17 9l3 3-3 3" /></>,
  smile: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01M15 10h.01" /><path d="M8.8 14c.8 1.2 1.9 1.8 3.2 1.8s2.4-.6 3.2-1.8" /></>,
  sparkle: <><path d="M12 3.5 13.6 9l5.4 1.5-5.4 1.6L12 17.5l-1.6-5.4L5 10.5 10.4 9 12 3.5Z" /><path d="M18.5 16v4M16.5 18h4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  leaf: <><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" /><path d="M5 19c3-4 6-7 10-10" /></>,
  even: <><circle cx="12" cy="12" r="8" /><path d="M6 9.5h12M4.5 14.5h15" /></>,
  // Temps & budget
  clock1: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l2 1.2" /></>,
  clock2: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12h4" /></>,
  clock3: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l-3 2.5" /><path d="M12 12h3.5" /></>,
  layers1: <><path d="m12 13.5 8-4-8-4-8 4 8 4Z" /></>,
  layers2: <><path d="m12 11.5 8-4-8-4-8 4 8 4Z" /><path d="m4 12 8 4 8-4" /></>,
  layers3: <><path d="m12 10 8-4-8-4-8 4 8 4Z" /><path d="m4 10.5 8 4 8-4" /><path d="m4 15 8 4 8-4" /></>,
  // Soins
  foam: <><circle cx="9" cy="14" r="4" /><circle cx="15.5" cy="10" r="3" /><circle cx="16" cy="17" r="2" /></>,
  dropper: <><path d="M10 3.5h4v3h-4z" /><path d="M11 6.5v3.5M13 6.5v3.5" /><path d="M9.5 10h5l-.5 6.5a2 2 0 0 1-4 0L9.5 10Z" /><path d="M12 20.5v.01" /></>,
  jar: <><rect x="5" y="9" width="14" height="11" rx="2" /><path d="M6 9V6.5h12V9" /><path d="M9 14h6" /></>,
  grain: <><circle cx="12" cy="12" r="8" /><path d="M9 9h.01M14 8.5h.01M10.5 13h.01M15 13.5h.01M12 16h.01M8 15h.01" strokeWidth={2} /></>,
  none: <><circle cx="12" cy="12" r="8" /><path d="m6.5 17.5 11-11" /></>,
};

export function LineIcon({ name, size = 24, ...p }: P & { name: string }) {
  const d = paths[name];
  if (!d) return null;
  return <S size={size} {...p}>{d}</S>;
}

/** Pictogramme associé à une réponse du Skin Diag (`questionId:valeur`). */
export const diagIcon: Record<string, string> = {
  "skinType:seche": "crack", "skinType:grasse": "shine", "skinType:mixte": "half", "skinType:normale": "balance", "skinType:sensible": "feather", "skinType:inconnu": "question",
  "concerns:boutons": "dots", "concerns:points-noirs": "pinpoints", "concerns:rougeurs": "flame", "concerns:secheresse": "crack", "concerns:deshydratation": "dropMinus",
  "concerns:sebum": "shine", "concerns:pores": "grid", "concerns:terne": "cloud", "concerns:cernes": "eye", "concerns:ridules": "waves", "concerns:rebondi": "bubble",
  "afterCleanse:tiraille": "stretch", "afterCleanse:confortable": "smile", "afterCleanse:brillante": "shine", "afterCleanse:rougeurs": "flame",
  "goal:nette": "sparkle", "goal:glowy": "sun", "goal:hydrater": "drop", "goal:apaiser": "leaf", "goal:pores": "grid", "goal:ridules": "waves", "goal:uniforme": "even",
  "time:1": "clock1", "time:2": "clock2", "time:3": "clock3",
  "budget:1": "layers1", "budget:2": "layers2", "budget:3": "layers3",
  "current:nettoyant": "foam", "current:serum": "dropper", "current:creme": "jar", "current:spf": "sun", "current:exfoliant": "grain", "current:aucun": "none",
};
