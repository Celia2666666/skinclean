import Link from "next/link";
import { SplitTitle, Reveal } from "@/components/ui/Reveal";

/** En-tête de page (catégories, pages éditoriales) avec fond pastel et bulles. */
export function PageHero({ eyebrow, title, intro, bg = "#EFEEEA", crumbs, children }: { eyebrow?: string; title: string; intro?: string; bg?: string; crumbs?: { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14" style={{ background: bg }}>
      <div className="relative mx-auto max-w-[1400px]">
        {crumbs && (
          <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-forest-soft">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Accueil</Link></li>
              {crumbs.map((c) => <li key={c.href} className="flex items-center gap-1.5"><span>/</span><Link href={c.href} className="hover:underline">{c.label}</Link></li>)}
            </ol>
          </nav>
        )}
        {eyebrow && <Reveal><p className="eyebrow mb-3 text-forest/60">{eyebrow}</p></Reveal>}
        <h1 className="max-w-4xl font-display title-caps text-[clamp(2.2rem,5vw,3.8rem)]"><SplitTitle text={title} /></h1>
        {intro && <Reveal delay={0.2}><p className="mt-5 max-w-2xl text-base text-forest/80 md:text-lg">{intro}</p></Reveal>}
        {children}
      </div>
    </section>
  );
}
