import { announcements } from "@/data/config";

export function AnnouncementBar() {
  const items = [...announcements, ...announcements];
  return (
    <div className="relative overflow-hidden bg-forest py-2 text-[0.72rem] font-medium tracking-wide text-ivory" role="region" aria-label="Annonces">
      <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
        {items.map((a, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap" aria-hidden={i >= announcements.length}>
            {a}<span className="text-sage"></span>
          </span>
        ))}
      </div>
    </div>
  );
}
