import { redirect } from "next/navigation";

/** Ancienne adresse : redirige vers « Mes comptes » en conservant les paramètres. */
export default async function OldSandboxPage({ searchParams }: PageProps<"/hub/comptes-test">) {
  const sp = await searchParams;
  const q = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();
  redirect(`/hub/mes-comptes${q ? `?${q}` : ""}`);
}
