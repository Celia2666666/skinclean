import type { Metadata } from "next";
import { currentSource, settings, hasRealData } from "@/lib/crm/repo";
import { SettingsView } from "@/components/crm/pages/SettingsView";

export const metadata: Metadata = { title: "Paramètres & exports" };

export default async function SettingsPage() {
  const source = await currentSource();
  return <SettingsView settings={settings()} source={source} hasReal={hasRealData()} stripe={!!process.env.STRIPE_SECRET_KEY} webhook={!!process.env.STRIPE_WEBHOOK_SECRET} />;
}
