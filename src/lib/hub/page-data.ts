import "server-only";
import { list } from "./repo";

/** Références légères partagées par les pages (listes déroulantes). */
export function refs() {
  return {
    personas: list("personas").map((p) => ({ id: p.id, name: p.name })),
    campaigns: list("campaigns").map((c) => ({ id: c.id, name: c.name, color: c.color })),
  };
}
