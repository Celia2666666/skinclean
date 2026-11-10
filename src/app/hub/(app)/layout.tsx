import { HubShell } from "@/components/hub/HubShell";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { hubOnline } from "@/lib/hub/online";
import { tick } from "@/lib/hub/scheduler";

// En ligne, pas de planificateur en arrière-plan : les publications programmées (simulées) arrivées à échéance
// sont traitées à la consultation, au plus une fois par minute.
const g = globalThis as typeof globalThis & { __hubOnlineTick?: number };

/** Toutes les pages du Hub : session obligatoire (redirection vers /hub/connexion). */
export default async function HubAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  if (hubOnline() && Date.now() - (g.__hubOnlineTick ?? 0) > 60_000) { g.__hubOnlineTick = Date.now(); await tick().catch(() => {}); }
  const unread = list("notifications").filter((n) => n.userId === user.id && !n.read).length;
  const posts = list("posts").filter((p) => !p.library);
  const toValidate = posts.filter((p) => p.status === "a_valider").length;
  const tickets = list("tickets").filter((t) => (user.role === "marketing" ? ["ouvert"] : ["en_attente"]).includes(t.status)).length;
  return (
    <HubShell
      user={{ id: user.id, name: user.name, email: user.email, role: user.role, title: user.title, avatarColor: user.avatarColor }}
      unread={unread}
      badges={{ "/hub/calendrier": toValidate, "/hub/messages": tickets }}
      online={hubOnline()}
    >
      {children}
    </HubShell>
  );
}
