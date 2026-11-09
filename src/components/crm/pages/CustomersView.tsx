"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Avatar, Card, PageHeader } from "@/components/hub/ui";
import { DownloadI } from "@/components/hub/icons";
import { eur } from "../charts";
import { Pager, Pill, SearchBox, SortTh, thead, trow, useParam, Empty } from "../ui";
import { CHANNEL_SHORT, LIFECYCLE_LABEL, RFM_LABEL, type Lifecycle, type RfmSegment } from "@/lib/crm/types";
import type { customersPage } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof customersPage>>;
export const SEG_TONE: Record<RfmSegment, string> = { champions: "dark", fideles: "ok", potentiels: "ok", nouveaux: "info", prometteurs: "info", attention: "warn", a_risque: "bad", a_ne_pas_perdre: "bad", hibernants: "neutral", perdus: "neutral" };
const LC: Lifecycle[] = ["abonne", "lead", "client", "fidele", "vip"];
const fr = (s?: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");

export function CustomersView({ data: d }: { data: Data }) {
  const set = useParam();
  const sp = useSearchParams();
  const lc = sp.get("lifecycle") ?? "", seg = sp.get("segment") ?? "";
  const lcCount = Object.fromEntries(d.lifecycles);
  return (
    <>
      <PageHeader eyebrow="Clients" title="Contacts" intro={<>{d.totals.all.toLocaleString("fr-FR")} contacts, dont {d.totals.buyers.toLocaleString("fr-FR")} acheteurs et {d.totals.optin.toLocaleString("fr-FR")} inscrits aux e-mails. Chaque contact est classé par cycle de vie et par segment RFM (récence, fréquence, montant).</>}
        actions={<a className="hub-btn hub-btn-secondary" href="/api/crm/export/clients"><DownloadI size={15} />Export CSV</a>} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LC.map((l) => (
          <button key={l} onClick={() => set({ lifecycle: lc === l ? null : l })} className={clsx("hub-card p-3 text-left transition hover:border-forest", lc === l && "border-forest ring-2 ring-forest/10")}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-forest-soft">{LIFECYCLE_LABEL[l]}</p>
            <p className="font-display text-xl font-semibold tabular-nums">{(lcCount[l] ?? 0).toLocaleString("fr-FR")}</p>
          </button>
        ))}
      </div>
      <Card className="mt-5" pad={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <SearchBox placeholder="Nom, e-mail, ville, tag…" className="min-w-[240px] flex-1" />
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
          <button onClick={() => set({ segment: null })} className={clsx("hub-badge border", !seg ? "border-forest bg-forest text-white" : "border-line bg-white")}>Tous les segments</button>
          {d.segments.map(([s, n]) => <button key={s} onClick={() => set({ segment: s })} className={clsx("hub-badge border", seg === s ? "border-forest bg-forest text-white" : "border-line bg-white")}>{RFM_LABEL[s as RfmSegment]} <span className="opacity-70">{n}</span></button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className={thead}><tr><SortTh id="name" sort={d.sort} className="pl-4">Contact</SortTh><th className="px-3">Cycle de vie</th><th className="px-3">Segment</th><th className="px-3">Acquisition</th><SortTh id="orders" sort={d.sort} className="text-right">Commandes</SortTh><SortTh id="revenue" sort={d.sort} className="text-right">CA TTC</SortTh><SortTh id="last" sort={d.sort}>Dernier achat</SortTh><th className="px-3">Club</th></tr></thead>
            <tbody>
              {d.rows.map((c) => (
                <tr key={c.id} className={trow}>
                  <td className="py-2 pl-4 pr-3">
                    <Link href={`/crm/clients/${c.id}`} className="flex items-center gap-2.5">
                      <Avatar name={c.name} size={30} color="#4A6354" />
                      <span className="min-w-0"><span className="block truncate font-medium hover:underline">{c.name}</span><span className="block truncate text-xs text-forest-soft">{c.email} · {c.city}</span></span>
                    </Link>
                  </td>
                  <td className="px-3"><Pill tone={c.lifecycle === "vip" ? "dark" : c.lifecycle === "fidele" ? "ok" : c.lifecycle === "client" ? "info" : "neutral"}>{LIFECYCLE_LABEL[c.lifecycle]}</Pill></td>
                  <td className="px-3">{c.segment ? <Pill tone={SEG_TONE[c.segment]}>{RFM_LABEL[c.segment]}</Pill> : <span className="text-xs text-forest-soft">—</span>}</td>
                  <td className="px-3 text-forest-soft">{CHANNEL_SHORT[c.channel]}</td>
                  <td className="px-3 text-right tabular-nums">{c.orders}</td>
                  <td className="px-3 text-right font-medium tabular-nums">{eur(c.revenue)}</td>
                  <td className="px-3 tabular-nums text-forest-soft">{fr(c.last)}</td>
                  <td className="px-3 text-xs">{c.orders ? c.tier : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.rows.length && <div className="p-5"><Empty>Aucun contact ne correspond.</Empty></div>}
        </div>
        <Pager page={d.page} pages={d.pages} total={d.total} label="contact(s)" />
      </Card>
    </>
  );
}
