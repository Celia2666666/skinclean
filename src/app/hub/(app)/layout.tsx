import { HubShell } from "@/components/hub/HubShell";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { can } from "@/lib/hub/permissions";

/** Toutes les pages du Hub : session obligatoire (redirection vers /hub/connexion). */
export default async function HubAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const unread = list("notifications").filter((n) => n.userId === user.id && !n.read).length;
  const posts = list("posts").filter((p) => !p.library);
  const toValidate = posts.filter((p) => p.status === "a_valider").length;
  const tickets = list("tickets").filter((t) => (can(user.role, "tickets.manage") ? ["ouvert"] : ["en_attente"]).includes(t.status)).length;
  return (
    <HubShell
      user={{ id: user.id, name: user.name, email: user.email, role: user.role, title: user.title, avatarColor: user.avatarColor }}
      unread={unread}
      badges={{ "/hub/calendrier": toValidate, "/hub/messages": tickets }}
    >
      {children}
    </HubShell>
  );
}
