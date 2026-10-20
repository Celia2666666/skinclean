import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { verify } from "@/lib/sign";
import type { RoutinePayload } from "@/lib/routine-link";
import { SharedRoutine } from "@/components/diag/SharedRoutine";

export const metadata: Metadata = { title: "Ma routine SKINCLEAN", robots: { index: false, follow: false } };

/** Lien sécurisé et persistant : contenu signé (HMAC), prix et stocks relus en direct dans le catalogue. */
export default async function Page({ params }: PageProps<"/routine/[token]">) {
  const { token } = await params;
  const payload = verify<RoutinePayload>(decodeURIComponent(token));
  if (!payload) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-4xl">Lien invalide</p>
        <p className="mt-3 text-forest-soft">Ce lien de routine est incomplet ou a été modifié. Refais ton Skin Diag pour obtenir une nouvelle routine.</p>
        <Link href="/skin-diag" className="btn btn-primary mt-6">Faire mon Skin Diag</Link>
      </div>
    );
  }
  return <Suspense><SharedRoutine payload={payload} /></Suspense>;
}
