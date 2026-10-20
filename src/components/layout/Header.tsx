"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { concernCategories, discoverLinks, typeCategories } from "@/data/categories";
import { BagIcon, ChevronIcon, CloseIcon, LeafIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { leavesBalance, useAccount, useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { getBestsellers } from "@/lib/catalog";
import { Packshot } from "@/components/product/Packshot";

const nav = [
  { label: "Soins visage", href: "/soins-visage", mega: true },
  { label: "Best-sellers", href: "/best-sellers" },
  { label: "Kits & routines", href: "/kits" },
  { label: "Créer mon set", href: "/creer-mon-set" },
  { label: "Skin Diag", href: "/skin-diag", highlight: true },
  { label: "SKINCLEAN Club", href: "/club" },
  { label: "Notre univers", href: "/notre-histoire", sub: [{ href: "/notre-histoire", label: "Notre histoire" }, { href: "/nos-engagements", label: "Nos engagements" }, { href: "/faq", label: "FAQ & contact" }] },
];

export function Header() {
  const [mega, setMega] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const cart = useStore((s) => s.cart);
  const lastAdded = useStore((s) => s.lastAdded);
  const setDrawer = useStore((s) => s.setDrawer);
  const setSearch = useUI((s) => s.setSearch);
  const acc = useAccount();
  const h = useHydrated();
  const count = h ? cart.filter((l) => !l.gift).reduce((s, l) => s + l.qty, 0) : 0;
  const leaves = h ? leavesBalance(acc) : 0;

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 20);
    setHidden(y > 300 && y > prev && !mega);
  });
  useEffect(() => { setMega(null); setMobile(false); }, [pathname]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled || mega ? "bg-cream/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl" : "bg-cream"}`}
        onMouseLeave={() => setMega(null)}
      >
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center gap-4 px-4 md:px-8">
          <button className="-ml-2 grid h-10 w-10 place-items-center xl:hidden" onClick={() => setMobile(true)} aria-label="Ouvrir le menu">
            <MenuIcon />
          </button>
          <Logo className="shrink-0" />
          <nav className="ml-6 hidden flex-1 items-center gap-0.5 xl:flex" aria-label="Navigation principale">
            {nav.map((n) => (
              <div key={n.label} onMouseEnter={() => setMega(n.mega ? "soins" : n.sub ? n.label : null)} className="relative">
                <Link
                  href={n.href}
                  className={`relative whitespace-nowrap px-3 py-2 text-[0.74rem] font-medium uppercase tracking-[0.06em] underline-offset-[6px] transition hover:underline ${n.highlight ? "" : ""} ${pathname.startsWith(n.href) ? "text-forest" : "text-forest/80"}`}
                  aria-expanded={n.mega || n.sub ? mega === (n.mega ? "soins" : n.label) : undefined}
                >
                  {n.label}
                </Link>
                <AnimatePresence>
                  {n.sub && mega === n.label && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="card absolute left-0 top-full mt-2 w-56 p-2 shadow-[var(--shadow-soft)]">
                      {n.sub.map((s) => (
                        <Link key={s.href} href={s.href} className="block rounded-[2px] px-3 py-2 text-sm hover:bg-sage-soft">{s.label}</Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <IconBtn label="Rechercher" onClick={() => setSearch(true)}><SearchIcon /></IconBtn>
            <IconBtn label="Mon compte" href="/compte"><UserIcon /></IconBtn>
            <IconBtn label="SKINCLEAN Club — mes feuilles" href="/club" className="hidden sm:grid">
              <LeafIcon />
              {leaves > 0 && <span className="absolute -bottom-0.5 -right-1 rounded-full bg-sage px-1 text-[0.6rem] font-bold">{leaves}</span>}
            </IconBtn>
            <IconBtn label={`Panier (${count} articles)`} onClick={() => setDrawer(true)}>
              <BagIcon />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={`${count}-${lastAdded?.at}`} initial={{ scale: 0 }} animate={{ scale: [1.5, 1] }} className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-forest px-1 text-[0.62rem] font-bold text-ivory">
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </IconBtn>
          </div>
        </div>

        <AnimatePresence>{mega === "soins" && <MegaMenu onClose={() => setMega(null)} />}</AnimatePresence>
      </motion.header>

      <AnimatePresence>{mobile && <MobileMenu onClose={() => setMobile(false)} />}</AnimatePresence>
    </>
  );
}

function IconBtn({ children, label, href, onClick, className = "" }: { children: React.ReactNode; label: string; href?: string; onClick?: () => void; className?: string }) {
  const cls = `relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-sage-soft active:scale-90 ${className}`;
  return href ? <Link href={href} aria-label={label} className={cls}>{children}</Link> : <button onClick={onClick} aria-label={label} className={cls}>{children}</button>;
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  const best = getBestsellers().slice(0, 2);
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full hidden border-t border-line bg-cream/97 shadow-[var(--shadow-soft)] backdrop-blur-xl xl:block"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_1fr_0.8fr_1.3fr] gap-8 px-8 py-10">
        <MegaCol title="Par type de produit" items={typeCategories.map((c) => ({ href: `/soins-visage/${c.slug}`, label: c.label }))} onClose={onClose} />
        <MegaCol title="Par préoccupation" items={concernCategories.map((c) => ({ href: `/soins-visage/${c.slug}`, label: c.label }))} onClose={onClose} />
        <MegaCol title="Découvrir" items={discoverLinks} onClose={onClose} />
        <div className="grid grid-cols-2 gap-4">
          {best.map((p) => (
            <Link key={p.id} href={`/produits/${p.slug}`} onClick={onClose} className="group rounded-none p-4 transition hover:-translate-y-1" style={{ background: p.color.bg }}>
              <div className="relative mx-auto h-36 w-full"><Packshot product={p} className="h-full w-full transition-transform duration-500 group-hover:scale-110" showTag={false} /></div>
              <p className="eyebrow mt-3 text-forest/60">Best-seller</p>
              <p className="font-display text-lg">{p.name}</p>
            </Link>
          ))}
          <Link href="/skin-diag" onClick={onClose} className="col-span-2 flex items-center justify-between rounded-none bg-sky px-5 py-4 transition hover:bg-sky-soft">
            <span><span className="eyebrow block text-forest/60">2 minutes</span><span className="font-display text-lg">Trouve ta routine idéale</span></span>
            <ChevronIcon />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function MegaCol({ title, items, onClose }: { title: string; items: { href: string; label: string }[]; onClose: () => void }) {
  return (
    <div>
      <p className="eyebrow mb-4 text-forest/55">{title}</p>
      <ul className="space-y-1.5">
        {items.map((i, k) => (
          <motion.li key={i.href + i.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 * k }}>
            <Link href={i.href} onClick={onClose} className="group inline-flex items-center gap-2 text-[0.92rem] hover:text-forest">
              <span className="h-px w-0 bg-forest transition-all duration-300 group-hover:w-3" />
              {i.label}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <motion.div className="fixed inset-0 z-50 xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-forest/30 backdrop-blur-sm" onClick={onClose} />
      <motion.nav
        initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-cream p-5"
        aria-label="Menu mobile"
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} aria-label="Fermer le menu" className="grid h-10 w-10 place-items-center rounded-full bg-ivory"><CloseIcon /></button>
        </div>
        <Acc title="Soins visage" open={open === "t"} onToggle={() => setOpen(open === "t" ? null : "t")}>
          <p className="eyebrow mb-2 mt-1 text-forest/50">Par type</p>
          {typeCategories.map((c) => <Link key={c.slug} href={`/soins-visage/${c.slug}`} className="block py-1.5">{c.label}</Link>)}
          <p className="eyebrow mb-2 mt-4 text-forest/50">Par préoccupation</p>
          {concernCategories.map((c) => <Link key={c.slug} href={`/soins-visage/${c.slug}`} className="block py-1.5">{c.label}</Link>)}
          <p className="eyebrow mb-2 mt-4 text-forest/50">Découvrir</p>
          {discoverLinks.map((c) => <Link key={c.label} href={c.href} className="block py-1.5">{c.label}</Link>)}
        </Acc>
        {nav.slice(1).map((n) => (
          <Link key={n.label} href={n.href} className={`border-b border-line py-4 text-lg font-display ${n.highlight ? "text-forest" : ""}`}>
            {n.label} {n.highlight && <span className="chip ml-2 bg-sky align-middle">2 min</span>}
          </Link>
        ))}
        <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
          <Link href="/compte" className="rounded-[2px] bg-ivory p-3">Mon compte</Link>
          <Link href="/compte/journal" className="rounded-[2px] bg-ivory p-3">Mon Skin Journal</Link>
          <Link href="/faq" className="rounded-[2px] bg-ivory p-3">FAQ & contact</Link>
          <Link href="/livraison" className="rounded-[2px] bg-ivory p-3">Livraison</Link>
        </div>
      </motion.nav>
    </motion.div>
  );
}

function Acc({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-line">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-4 text-left font-display text-lg" aria-expanded={open}>
        {title}
        <motion.span animate={{ rotate: open ? 90 : 0 }}><ChevronIcon /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden text-[0.95rem]">
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
