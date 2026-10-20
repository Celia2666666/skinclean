import type { Metadata } from "next";
import { ClubView } from "@/components/account/ClubView";

export const metadata: Metadata = { title: "SKINCLEAN Club — programme de fidélité", description: "Gagne des feuilles à chaque achat et échange-les contre des réductions." };

export default function Page() {
  return <ClubView />;
}
