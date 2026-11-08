import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { siteUrlPublic } from "@/lib/site";
import { EmailingView } from "@/components/hub/pages/EmailingView";

export const metadata: Metadata = { title: "E-mailing & newsletters" };

export default async function EmailingPage() {
  const user = await requirePageUser();
  return (
    <EmailingView
      emails={list("emails").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
      campaigns={list("campaigns").map((c) => ({ id: c.id, name: c.name }))}
      provider={{ resend: !!process.env.RESEND_API_KEY, segment: !!process.env.RESEND_SEGMENT_ID, from: process.env.EMAIL_FROM ?? "" }}
      baseUrl={siteUrlPublic()}
      userEmail={user.email}
    />
  );
}
