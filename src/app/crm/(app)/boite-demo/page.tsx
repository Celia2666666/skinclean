import type { Metadata } from "next";
import { all } from "@/lib/crm/db";
import { ensureCrmSeeded, settings } from "@/lib/crm/repo";
import { DEMO_INBOX } from "@/lib/crm/automations";
import { DemoInboxView } from "@/components/crm/pages/DemoInboxView";
import { siteUrl } from "@/lib/sign";

export const metadata: Metadata = { title: "Boîte mail de démo" };

export default async function DemoInboxPage({ searchParams }: PageProps<"/crm/boite-demo">) {
  await ensureCrmSeeded();
  const sp = await searchParams;
  const mails = all("mails").slice().sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)).slice(0, 200);
  const s = settings();
  const id = typeof sp.id === "string" ? sp.id : mails[0]?.id;
  return <DemoInboxView mails={mails.map(({ html: _h, ...m }) => m)} selected={mails.find((m) => m.id === id) ?? null} inbox={s.demoInbox || DEMO_INBOX} redirect={!!s.redirectDemo} resend={!!process.env.RESEND_API_KEY} siteOrigin={siteUrl()} />;
}
