import { CrmShell } from "@/components/crm/CrmShell";
import { requireCrmPage } from "@/lib/crm/auth";
import { shellData } from "@/lib/crm/pages";
import { crmOnline } from "@/lib/crm/online";

/** Toutes les pages du CRM : session du Marketing Hub obligatoire, localhost uniquement. */
export default async function CrmAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCrmPage();
  const { source, hasReal, badges } = await shellData();
  return (
    <CrmShell user={{ id: user.id, name: user.name, email: user.email, role: user.role, title: user.title, avatarColor: user.avatarColor }} source={source} hasReal={hasReal} badges={badges} online={crmOnline()}>
      {children}
    </CrmShell>
  );
}
