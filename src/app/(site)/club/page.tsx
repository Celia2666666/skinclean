import type { Metadata } from "next";
import { ClubView } from "@/components/account/ClubView";

export const metadata: Metadata = {
  title: "SKINCLEAN Club — programme de fidélité",
  description: "Gagne des feuilles à chaque achat, avec ton anniversaire ou tes avis, et échange-les contre des réductions. Quatre paliers, de Pousse à Canopée.",
};

export default function Page() {
  return <ClubView />;
}
