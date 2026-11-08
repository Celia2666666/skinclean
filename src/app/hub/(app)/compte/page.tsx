import type { Metadata } from "next";
import { requirePageUser, listUsers } from "@/lib/hub/auth";
import { activity, list, settings } from "@/lib/hub/repo";
import { connectors } from "@/lib/hub/connectors";
import { can } from "@/lib/hub/permissions";
import { AccountView } from "@/components/hub/pages/AccountView";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <AccountView
      user={user}
      users={can(user.role, "users.manage") ? listUsers() : []}
      history={activity({ limit: 200, actions: ["validation", "refus", "validation_budget", "publication", "publication_manuelle", "activation", "activation_manuelle", "envoi", "programmation", "soumission", "site", "seo"] })}
      myActivity={activity({ limit: 400 }).filter((a) => a.userId === user.id).slice(0, 50)}
      notifications={list("notifications").filter((n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60)}
      connectors={connectors()}
      settings={settings()}
    />
  );
}
