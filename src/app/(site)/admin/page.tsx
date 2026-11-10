import type { Metadata } from "next";
import { AdminSpace } from "@/components/admin/AdminSpace";

export const metadata: Metadata = {
  title: "Admin : gérer la boutique",
  description: "Le back-office de démonstration de SKINCLEAN : prix et stocks, création d'un produit et de ses visuels, Studio créatif, demandes à l'équipe, commandes, kits et promotions.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminSpace />;
}
