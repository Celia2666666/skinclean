import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { JournalOp } from "./db";

/**
 * BASE PARTAGÉE DE LA VERSION EN LIGNE (Neon Postgres, variable DATABASE_URL ajoutée par l'intégration Vercel).
 * En ligne, chaque serveur garde sa copie SQLite dans /tmp ; ce journal les met d'accord :
 * - « anchor » : date de génération de la démo, la même pour tous les serveurs (renouvelée chaque jour) ;
 * - crm_journal : toutes les écritures (actions du CRM, messages du site…), rejouées dans l'ordre par chaque serveur.
 * En local, rien de tout cela n'est utilisé : la base SQLite du projet suffit.
 */
const url = () => process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL || process.env.POSTGRES_URL;
export const journalEnabled = () => !!process.env.VERCEL && !!url();

type G = typeof globalThis & { __crmSql?: NeonQueryFunction<false, false>; __crmSqlReady?: Promise<void> };
const g = globalThis as G;
const sql = () => (g.__crmSql ??= neon(url()!));
const ready = () => (g.__crmSqlReady ??= (async () => {
  await sql()`create table if not exists crm_journal (seq bigserial primary key, at timestamptz not null default now(), op jsonb not null)`;
  await sql()`create table if not exists crm_meta (key text primary key, value text not null)`;
})().catch((e) => { g.__crmSqlReady = undefined; throw e; }));

/** Date de génération commune ; un nouveau jour démarre une nouvelle démo (journal remis à zéro). */
export async function sharedAnchor(nowHm: string): Promise<string> {
  await ready();
  await sql()`insert into crm_meta (key, value) values ('anchor', ${nowHm}) on conflict (key) do nothing`;
  const rolled = await sql()`update crm_meta set value = ${nowHm} where key = 'anchor' and value < ${nowHm.slice(0, 10)} returning value`;
  if (rolled.length) await sql()`delete from crm_journal`;
  const r = await sql()`select value from crm_meta where key = 'anchor'`;
  return String(r[0].value);
}

/** « Régénérer la démonstration » en ligne : nouvelle génération pour tous les serveurs. */
export async function resetShared(nowHm: string) {
  await ready();
  await sql()`insert into crm_meta (key, value) values ('anchor', ${nowHm}) on conflict (key) do update set value = excluded.value`;
  await sql()`delete from crm_journal`;
}

export async function fetchOps(after: number): Promise<{ seq: number; op: JournalOp }[]> {
  await ready();
  const rows = await sql()`select seq, op from crm_journal where seq > ${after} order by seq limit 5000`;
  return rows.map((r) => ({ seq: Number(r.seq), op: r.op as JournalOp }));
}

export async function pushOps(ops: JournalOp[]) {
  if (!ops.length) return;
  await ready();
  await sql()`insert into crm_journal (op) select value from jsonb_array_elements(${JSON.stringify(ops)}::jsonb)`;
}
