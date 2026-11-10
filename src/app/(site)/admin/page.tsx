import { redirect } from "next/navigation";

/** L'espace Admin est le back-office complet, servi sous /hub. */
export default function Page() {
  redirect("/hub");
}
