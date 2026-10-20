"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { getProduct } from "@/lib/catalog";
import { Packshot } from "@/components/product/Packshot";
import { Reveal } from "@/components/ui/Reveal";

/** SECTION 2 — trois grandes pastilles d'accès rapide. */
export function QuickCircles() {
  const set = ["sc-cl-01", "sc-sr-03", "sc-cr-01"].map((id) => getProduct(id)!);
  const items = [
    {
      href: "/creer-mon-set", title: "Créer mon set", sub: "Compose ta trousse idéale", bg: "#EFEEEA",
      visual: (
        <div className="relative h-full w-full">
          {set.map((p, i) => (
            <div key={p.id} className="absolute bottom-[14%] h-[58%] w-[34%] transition-transform duration-700 group-hover:-translate-y-2" style={{ left: `${12 + i * 26}%`, transform: `rotate(${(i - 1) * 9}deg)`, transitionDelay: `${i * 60}ms` }}>
              <Packshot product={p} className="h-full w-full" showTag={false} sizes="120px" />
            </div>
          ))}
        </div>
      ),
    },
    {
      href: "/skin-diag", title: "Faire mon Skin Diag", sub: "Ta routine en 2 minutes", bg: "#EFEEEA",
      visual: (
        <svg viewBox="0 0 200 200" className="h-full w-full p-[22%]" aria-hidden>
          <defs>
            <radialGradient id="drop" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#EFEEEA" /><stop offset="1" stopColor="#9FB2A3" /></radialGradient>
          </defs>
          <path d="M100 18 C 126 58, 150 88, 150 120 a50 50 0 0 1 -100 0 C 50 88, 74 58, 100 18Z" fill="url(#drop)" className="origin-center transition-transform duration-700 group-hover:scale-105" />
          <ellipse cx="82" cy="102" rx="10" ry="18" fill="#fff" opacity="0.7" transform="rotate(20 82 102)" />
        </svg>
      ),
    },
    {
      href: "/club", title: "SKINCLEAN Club", sub: "Gagne des feuilles ", bg: "#EFEEEA",
      visual: (
        <svg viewBox="0 0 200 200" className="h-full w-full p-[12%]" aria-hidden>
          <path d="M60 170 C 90 130, 110 90, 150 40" stroke="#6B7F6A" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[
            { x: 78, y: 140, r: -50, s: 1 }, { x: 96, y: 112, r: 35, s: 0.95 }, { x: 108, y: 92, r: -45, s: 0.9 },
            { x: 124, y: 70, r: 40, s: 0.85 }, { x: 138, y: 54, r: -40, s: 0.75 }, { x: 152, y: 38, r: 20, s: 0.7 },
          ].map((l, i) => (
            <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
              <g>
                <animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
                <path d="M0 0 C 10 -14, 34 -16, 44 0 C 34 16, 10 14, 0 0Z" fill={i % 2 ? "#6B7F6A" : "#9CB8A6"} />
                <path d="M2 0 L 40 0" stroke="#FFFEFB" strokeOpacity="0.6" strokeWidth="1.2" />
              </g>
            </g>
          ))}
          <circle cx="160" cy="150" r="6" fill="#FFFEFB" opacity="0.8"><animate attributeName="cy" values="150;140;150" dur="3s" repeatCount="indefinite" /></circle>
        </svg>
      ),
    },
  ];
  return (
    <section className="relative z-10 mt-12 px-4 md:mt-16">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-3 md:gap-10">
        {items.map((it, i) => (
          <Reveal key={it.href} delay={i * 0.12} className="text-center">
            <Link href={it.href} className="group block">
              <motion.div whileHover={{ y: -8, scale: 1.03 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-full" style={{ background: it.bg }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.7),transparent_55%)]" />
                {it.visual}
              </motion.div>
              <p className="mt-4 text-[0.72rem] font-medium uppercase tracking-[0.08em] md:text-sm">{it.title}</p>
              <p className="hidden text-sm text-forest-soft md:block">{it.sub}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
