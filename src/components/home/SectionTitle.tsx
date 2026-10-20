import { SplitTitle, Reveal } from "@/components/ui/Reveal";

export function SectionTitle({ eyebrow, title, intro, center = false, className = "" }: { eyebrow?: string; title: string; intro?: string; center?: boolean; className?: string }) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && <Reveal><p className="eyebrow mb-3 text-forest-soft">{eyebrow}</p></Reveal>}
      <h2 className="font-display title-caps text-[clamp(1.8rem,3.4vw,2.8rem)]"><SplitTitle text={title} /></h2>
      {intro && <Reveal delay={0.2}><p className="mt-4 text-base text-forest-soft md:text-lg">{intro}</p></Reveal>}
    </div>
  );
}
