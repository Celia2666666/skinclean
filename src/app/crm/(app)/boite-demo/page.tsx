import type { Metadata } from "next";
import { all } from "@/lib/crm/db";
import { ensureCrmSeeded, settings } from "@/lib/crm/repo";
import { DEMO_INBOX } from "@/lib/crm/automations";
import { DemoInboxView } from "@/components/crm/pages/DemoInboxView";
import { siteUrl } from "@/lib/sign";
import { mailKindOf, type MailKind } from "@/lib/crm/types";

export const metadata: Metadata = { title: "Boîte mail de démo" };

export default async function DemoInboxPage({ searchParams }: PageProps<"/crm/boite-demo">) {
  await ensureCrmSeeded();
  const sp = await searchParams;
  const every = all("mails").map((m) => ({ ...m, kind: mailKindOf(m) })).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  const counts = every.reduce<Partial<Record<MailKind, number>>>((acc, m) => ({ ...acc, [m.kind]: (acc[m.kind] ?? 0) + 1 }), {});
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const mails = (cat ? every.filter((m) => m.kind === cat) : every).slice(0, 200);
  const s = settings();
  const id = typeof sp.id === "string" ? sp.id : mails[0]?.id;
  return <DemoInboxView counts={counts} total={every.length} cat={cat} mails={mails.map(({ html: _h, ...m }) => m)} selected={every.find((m) => m.id === id) ?? null} inbox={s.demoInbox || DEMO_INBOX} redirect={!!s.redirectDemo} resend={!!process.env.RESEND_API_KEY} siteOrigin={siteUrl()} />;
}
