import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKit, getKits, kitPricing } from "@/lib/catalog";
import { stepLabels } from "@/data/categories";
import { PageHero } from "@/components/catalog/PageHero";
import { KitBuy } from "@/components/catalog/KitBuy";
import { Packshot } from "@/components/product/Packshot";
import { Reveal } from "@/components/ui/Reveal";
import { euro } from "@/lib/format";

export function generateStaticParams() {
  return getKits().map((k) => ({ slug: k.slug }));
}
export async function generateMetadata({ params }: PageProps<"/kits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const k = getKit(slug);
  return k ? { title: k.name, description: k.description } : {};
}

export default async function KitPage({ params }: PageProps<"/kits/[slug]">) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) notFound();
  const pr = kitPricing(kit);
  return (
    <>
      <PageHero eyebrow={kit.group === "saison" ? "Kit de saison" : kit.group === "voyage" ? "Kit de voyage" : "Routine"} title={kit.name} intro={kit.description} bg={kit.color} crumbs={[{ href: "/kits", label: "Kits & routines" }, { href: `/kits/${kit.slug}`, label: kit.name }]} />
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-4xl">Les {pr.lines.length} soins inclus</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {pr.lines.map((l, i) => (
              <Reveal key={l.product.id + i} delay={i * 0.06}>
                <Link href={`/produits/${l.product.slug}`} className="group flex h-full gap-4 rounded-none bg-ivory p-4 transition hover:shadow-[var(--shadow-soft)]">
                  <div className="relative h-28 w-24 shrink-0 rounded-[2px] p-1.5 transition-transform group-hover:scale-105" style={{ background: l.product.color.bg }}><Packshot product={l.product} className="h-full w-full" showTag={false} sizes="96px" /></div>
                  <div>
                    <p className="eyebrow text-[0.6rem] text-sage-deep">{stepLabels[l.product.step]}</p>
                    <p className="font-display text-xl">{l.product.name}</p>
                    <p className="text-xs text-forest-soft">{l.product.kind} · {l.variant.size}</p>
                    <p className="mt-1 text-sm">{l.product.benefits[0]}</p>
                    <p className="mt-1 text-sm font-semibold">{euro(l.variant.price)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
          <h2 className="mt-14 font-display text-4xl">Les étapes de la routine</h2>
          <ol className="mt-6 space-y-3">
            {kit.routine.map((s, i) => (
              <Reveal key={s} delay={i * 0.06}>
                <li className="flex items-center gap-4 rounded-none p-4" style={{ background: i % 2 ? "#FFFEFB" : kit.color }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest font-display text-ivory">{i + 1}</span>{s}
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start"><KitBuy kit={kit} /></div>
      </div>
    </>
  );
}
