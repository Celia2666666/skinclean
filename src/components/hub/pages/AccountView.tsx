"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { ActivityEntry, HubUser, Notification, Role, Settings } from "@/lib/hub/types";
import { ROLE_LABEL } from "@/lib/hub/types";
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/hub/permissions";
import { Avatar, Button, Card, Empty, Field, Modal, Notice, PageHeader, Tabs, hubApi, useAction, useCan, useConfirm, useToast } from "../ui";
import { CheckI, LockI, PlusI, TrashI, XI } from "../icons";
import { PasswordInput } from "../PasswordInput";

interface Connector { id: string; name: string; scope: string; connected: boolean; env: string[]; capability: string; limits?: string }
type Tab = "infos" | "securite" | "notifications" | "autorisations" | "historique" | "integrations";

const ACTION_LABEL: Record<string, string> = {
  validation: "Validation", refus: "Modifications demandées", validation_budget: "Budget validé", publication: "Publication", publication_manuelle: "Publication manuelle déclarée",
  activation: "Activation de campagne", activation_manuelle: "Publicité déclarée active", envoi: "Envoi newsletter", programmation: "Programmation", soumission: "Soumission à validation", site: "Modification du site", seo: "SEO",
};

export function AccountView({ user, users, history, myActivity, notifications, connectors, settings }: {
  user: HubUser; users: HubUser[]; history: ActivityEntry[]; myActivity: ActivityEntry[]; notifications: Notification[]; connectors: Connector[]; settings: Settings;
}) {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "infos");
  const [info, setInfo] = useState({ name: user.name, email: user.email, title: user.title ?? "" });
  const [prefs, setPrefs] = useState(user.notifications);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [newUser, setNewUser] = useState<null | { name: string; email: string; role: Role; title: string; password: string }>(null);
  const [reset, setReset] = useState<null | { id: string; name: string; password: string }>(null);
  const [rules, setRules] = useState(settings.publishingRules);
  const [auto, setAuto] = useState({ autoSchedule: settings.autoSchedule ?? true, sandbox: settings.sandbox ?? { enabled: true, handle: "skinclean" } });
  const { run, busy } = useAction();
  const allowed = useCan();
  const toast = useToast();
  const { ask, dialog } = useConfirm();

  return (
    <div>
      {dialog}
      <PageHeader eyebrow="Compte" title="Mon compte" intro={<span className="flex items-center gap-3"><Avatar name={user.name} color={user.avatarColor} size={36} /><span><strong className="text-forest">{user.name}</strong> · {ROLE_LABEL[user.role]} · {user.email}{user.lastLoginAt ? ` · dernière connexion ${new Date(user.lastLoginAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}` : ""}</span></span>}
        actions={<Button icon={<XI size={15} />} onClick={async () => { await hubApi("auth/logout"); window.location.href = "/hub/connexion"; }}>Déconnexion</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "infos", label: "Informations" }, { id: "securite", label: "Mot de passe" }, { id: "notifications", label: "Notifications", count: notifications.filter((n) => !n.read).length },
        { id: "autorisations", label: "Autorisations & utilisateurs" }, { id: "historique", label: "Historique des validations" }, { id: "integrations", label: "Intégrations" },
      ]} />
      <div className="mt-5">
        {tab === "infos" && (
          <Card title="Informations du compte" className="max-w-2xl">
            <div className="grid gap-4">
              <Field label="Nom affiché"><input className="hub-input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
              <Field label="E-mail de connexion"><input type="email" className="hub-input" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></Field>
              <Field label="Fonction"><input className="hub-input" value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} /></Field>
              <Field label="Rôle" hint="Le rôle est attribué par un administrateur."><input className="hub-input" readOnly value={ROLE_LABEL[user.role]} /></Field>
              <div className="flex justify-end"><Button variant="primary" disabled={busy} onClick={() => run("account/profile", info, "Informations enregistrées")}>Enregistrer</Button></div>
            </div>
          </Card>
        )}

        {tab === "securite" && (
          <Card title="Modifier le mot de passe" className="max-w-xl">
            <form className="grid gap-4" onSubmit={async (e) => {
              e.preventDefault();
              if (pw.next !== pw.confirm) return toast("err", "Les deux mots de passe ne correspondent pas.");
              const r = await run<{ relogin?: boolean }>("account/password", { current: pw.current, next: pw.next }, "Mot de passe modifié : reconnecte-toi.");
              if (r?.relogin) setTimeout(() => (window.location.href = "/hub/connexion"), 1200);
            }}>
              <Field label="Mot de passe actuel"><PasswordInput autoComplete="current-password" className="hub-input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
              <Field label="Nouveau mot de passe" hint="10 caractères minimum, avec des lettres et des chiffres."><PasswordInput autoComplete="new-password" className="hub-input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <Field label="Confirmer"><PasswordInput autoComplete="new-password" className="hub-input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              <div className="flex justify-end"><Button type="submit" variant="primary" icon={<LockI size={14} />} disabled={busy || !pw.current || !pw.next}>Modifier</Button></div>
              <p className="text-xs text-forest-soft">Toutes tes sessions ouvertes seront fermées.</p>
            </form>
          </Card>
        )}

        {tab === "notifications" && (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <Card title="Préférences">
              <div className="space-y-2.5">
                {([["validation", "Contenus à valider et validations"], ["publication", "Publications et rappels de publication"], ["ticket", "Messages et demandes"], ["campagne", "Campagnes activées"], ["rapport", "Rapports de performances"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={prefs[k] !== false} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />{l}</label>
                ))}
                <Button variant="primary" className="mt-2" disabled={busy} onClick={() => run("account/profile", { notifications: prefs }, "Préférences enregistrées")}>Enregistrer</Button>
              </div>
            </Card>
            <Card title="Mes notifications" pad={false} action={<Button size="sm" onClick={() => run("notifications/read", { all: true }, "Tout est marqué comme lu")}>Tout marquer comme lu</Button>}>
              {!notifications.length ? <div className="p-5"><Empty title="Aucune notification" /></div> : (
                <ul className="divide-y divide-line">{notifications.map((n) => <li key={n.id} className={clsx("px-5 py-3", !n.read && "bg-sage-soft/60")}><Link href={n.href ?? "/hub"} className="block hover:underline"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-forest-soft">{n.body}</p><p className="text-[0.65rem] text-forest-soft">{new Date(n.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p></Link></li>)}</ul>
              )}
            </Card>
          </div>
        )}

        {tab === "autorisations" && (
          <div className="space-y-5">
            <Card title="Matrice des autorisations" subtitle="Vérifiée côté serveur sur chaque action." pad={false}>
              <div className="hub-scroll overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Autorisation</th>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <th key={r} className={clsx("p-3 text-center", r === user.role && "text-forest")}>{ROLE_LABEL[r]}</th>)}</tr></thead>
                  <tbody>{(Object.keys(PERMISSIONS) as Permission[]).map((p) => <tr key={p} className="border-t border-line"><td className="p-3">{PERMISSIONS[p]}</td>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <td key={r} className="p-3 text-center">{ROLE_PERMISSIONS[r].includes(p) ? <CheckI size={16} className="mx-auto text-[#2E5E3E]" /> : <span className="text-line">—</span>}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </Card>
            {allowed("settings.manage") && (
              <Card title="Règles de publication" className="max-w-2xl">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={rules.requireValidation} onChange={(e) => setRules({ ...rules, requireValidation: e.target.checked })} />Validation obligatoire avant toute publication ou programmation</label>
                <Button className="mt-3" variant="primary" disabled={busy} onClick={() => run("settings/update", { publishingRules: rules }, "Règles enregistrées")}>Enregistrer</Button>
              </Card>
            )}
            {allowed("users.manage") ? (
              <Card title="Utilisateurs" pad={false} action={<Button size="sm" variant="primary" icon={<PlusI size={13} />} onClick={() => setNewUser({ name: "", email: "", role: "admin", title: "", password: "" })}>Ajouter un utilisateur</Button>}>
                <table className="w-full text-sm">
                  <thead className="bg-sage-soft text-left text-xs uppercase text-forest-soft"><tr><th className="p-3">Utilisateur</th><th className="p-3">Rôle</th><th className="p-3">Dernière connexion</th><th className="p-3" /></tr></thead>
                  <tbody>{users.map((u) => (
                    <tr key={u.id} className="border-t border-line">
                      <td className="p-3"><span className="flex items-center gap-2"><Avatar name={u.name} color={u.avatarColor} size={28} /><span><span className="block font-medium">{u.name}</span><span className="text-xs text-forest-soft">{u.email}</span></span></span></td>
                      <td className="p-3"><select className="hub-input w-auto py-1" value={u.role} disabled={u.id === user.id} onChange={(e) => run("users/update", { id: u.id, role: e.target.value }, "Rôle mis à jour")}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
                      <td className="p-3 text-forest-soft">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "Jamais"}</td>
                      <td className="p-3 text-right"><div className="flex justify-end gap-1"><Button size="sm" onClick={() => setReset({ id: u.id, name: u.name, password: "" })}>Mot de passe</Button>{u.id !== user.id && <Button size="sm" variant="ghost" icon={<TrashI size={13} />} aria-label="Supprimer" onClick={async () => { if (await ask(`Supprimer le compte de ${u.name} ?`, "L'historique de ses actions est conservé.", "Supprimer", true)) run("users/delete", { id: u.id }, "Compte supprimé"); }} />}</div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </Card>
            ) : <Notice>La gestion des utilisateurs est réservée aux administrateurs.</Notice>}
          </div>
        )}

        {tab === "historique" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Card title="Historique des validations et publications" subtitle="Qui a validé, refusé, publié, dépensé ou modifié le site, et quand." pad={false}>
              {!history.length ? <div className="p-5"><Empty title="Aucune action enregistrée pour l'instant" /></div> : (
                <ul className="divide-y divide-line">{history.map((a) => <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 px-5 py-2.5 text-sm"><span className="w-36 shrink-0 text-xs text-forest-soft">{new Date(a.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })}</span><span className="hub-badge bg-sage-soft">{ACTION_LABEL[a.action] ?? a.action}</span><span className="font-medium">{a.label}</span><span className="text-forest-soft">par {a.userName}</span>{a.detail && <span className="w-full pl-[9.75rem] text-xs text-forest-soft">{a.detail}</span>}</li>)}</ul>
              )}
            </Card>
            <Card title="Mon activité récente" pad={false}>
              <ul className="divide-y divide-line">{myActivity.map((a) => <li key={a.id} className="px-4 py-2 text-xs"><span className="text-forest-soft">{new Date(a.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })}</span> · {ACTION_LABEL[a.action] ?? a.action} — {a.label}</li>)}</ul>
            </Card>
          </div>
        )}

        {tab === "integrations" && (
          <div className="space-y-5">
            <Card title="Publication automatique" subtitle="Valide tes contenus quand tu veux (tous les jours ou une fois par semaine) : ils partent seuls à l'heure prévue dans le calendrier.">
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 accent-forest" checked={auto.autoSchedule} onChange={(e) => setAuto({ ...auto, autoSchedule: e.target.checked })} /><span><strong>Valider = programmer</strong> : un contenu validé est programmé automatiquement à sa date et son heure du calendrier.</span></label>
                <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 accent-forest" checked={auto.sandbox.enabled} onChange={(e) => setAuto({ ...auto, sandbox: { ...auto.sandbox, enabled: e.target.checked } })} /><span><strong>Simulation des comptes</strong> : tant qu&apos;un réseau n&apos;est pas connecté, ses publications apparaissent dans <Link href="/hub/mes-comptes" className="underline">Mes comptes</Link> à l&apos;heure prévue (simulé en local, rien n&apos;est envoyé au réseau).</span></label>
                <Field label="Nom du compte (@)" className="max-w-xs"><input className="hub-input" value={auto.sandbox.handle} onChange={(e) => setAuto({ ...auto, sandbox: { ...auto.sandbox, handle: e.target.value } })} /></Field>
                <p className="text-xs text-forest-soft">Les publications automatiques sont faites par le serveur local : il doit être allumé à l&apos;heure prévue. S&apos;il était éteint, le contenu part dès le redémarrage et il est signalé « avec retard ».</p>
                <Button variant="primary" disabled={busy} onClick={() => run("settings/update", auto, "Réglages de publication enregistrés")}>Enregistrer</Button>
              </div>
            </Card>
            <Notice>Les clés d&apos;accès se configurent dans le fichier <code>.env.local</code> du projet (jamais dans l&apos;interface) puis en redémarrant le serveur. Sans clé, le module concerné fonctionne en mode démonstration, signalé comme tel.</Notice>
            <div className="grid gap-3 md:grid-cols-2">
              {connectors.map((c) => (
                <Card key={c.id} title={c.name} subtitle={c.scope} action={<span className={clsx("hub-badge", c.connected ? "bg-[#E3EFE6] text-[#2E5E3E]" : "bg-[#F1F0EC] text-[#5C6862]")}>{c.connected ? "Connecté" : "Non connecté"}</span>}>
                  <p className="text-sm">{c.capability}</p>
                  {c.limits && <p className="mt-1 text-xs text-forest-soft">{c.limits}</p>}
                  <p className="mt-2 text-xs text-forest-soft">Variables : {c.env.map((e) => <code key={e} className="mr-1 rounded bg-sage-soft px-1">{e}</code>)}</p>
                </Card>
              ))}
            </div>
            <Card title="Préparation du futur CRM">
              <p className="text-sm">L&apos;Admin expose déjà ses données marketing en lecture pour le CRM (session requise) :</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li><code>GET /api/hub/events?since=…</code> — journal d&apos;événements (contenus publiés, campagnes activées, budgets validés, articles publiés…).</li>
                <li><code>GET /api/hub/export?collection=campaigns|posts|ads|emails|articles|keywords|objectives|roadmap|personas</code> — export JSON.</li>
                <li>Paramètres UTM générés pour chaque publicité : l&apos;attribution des ventes se fera dans le CRM.</li>
              </ul>
              <p className="mt-2 text-xs text-forest-soft">Aucune donnée client ni commande n&apos;est stockée dans l&apos;Admin.</p>
            </Card>
          </div>
        )}
      </div>

      <Modal open={!!newUser} onClose={() => setNewUser(null)} title="Nouvel utilisateur"
        footer={<><Button onClick={() => setNewUser(null)}>Annuler</Button><Button variant="primary" disabled={busy || !newUser?.email || !newUser.name || (newUser.password.length < 10)} onClick={async () => { const r = await run("users/create", newUser, "Utilisateur créé"); if (r) setNewUser(null); }}>Créer</Button></>}>
        {newUser && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom"><input className="hub-input" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></Field>
            <Field label="E-mail"><input type="email" className="hub-input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></Field>
            <Field label="Rôle"><select className="hub-input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
            <Field label="Fonction"><input className="hub-input" value={newUser.title} onChange={(e) => setNewUser({ ...newUser, title: e.target.value })} /></Field>
            <Field label="Mot de passe provisoire" className="sm:col-span-2" hint="10 caractères minimum. À communiquer par un canal sûr ; l'utilisateur le changera dans Mon compte."><PasswordInput autoComplete="new-password" className="hub-input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
      <Modal open={!!reset} onClose={() => setReset(null)} title={`Nouveau mot de passe — ${reset?.name ?? ""}`} size="sm"
        footer={<><Button onClick={() => setReset(null)}>Annuler</Button><Button variant="primary" disabled={(reset?.password.length ?? 0) < 10} onClick={async () => { await run("users/reset-password", { id: reset!.id, password: reset!.password }, "Mot de passe réinitialisé"); setReset(null); }}>Réinitialiser</Button></>}>
        <Field label="Mot de passe provisoire (10 caractères min.)"><PasswordInput autoComplete="new-password" className="hub-input" value={reset?.password ?? ""} onChange={(e) => setReset(reset && { ...reset, password: e.target.value })} /></Field>
      </Modal>
    </div>
  );
}
