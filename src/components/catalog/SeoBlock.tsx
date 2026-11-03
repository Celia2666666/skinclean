import Link from "next/link";

/** Bloc de contenu éditorial (texte utile + liens internes) affiché en bas de certaines pages du site. */
export function SeoBlock({ title, children, links }: { title: string; children: React.ReactNode; links?: { href: string; label: string }[] }) {
  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:px-8 lg:grid-cols-[1fr_320px]">
        <div className="max-w-3xl space-y-4 text-[0.98rem] leading-relaxed text-forest-soft">
          <h2 className="font-display text-3xl text-forest md:text-4xl">{title}</h2>
          {children}
        </div>
        {links && (
          <aside aria-label="À découvrir aussi" className="self-start">
            <p className="eyebrow text-forest-soft">À découvrir aussi</p>
            <ul className="mt-3 space-y-2">
              {links.map((l) => <li key={l.href}><Link href={l.href} className="underline underline-offset-4 hover:text-forest-soft">{l.label}</Link></li>)}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}
