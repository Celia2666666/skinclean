import type { Role } from "./types";

/**
 * Matrice des autorisations du Marketing Hub.
 * Vérifiée côté serveur sur chaque route API, et utilisée côté client pour masquer les actions interdites.
 */
export const PERMISSIONS = {
  "content.edit": "Créer et modifier les contenus (publications, visuels, e-mails, articles)",
  "content.validate": "Valider ou refuser un contenu",
  "content.publish": "Publier ou programmer un contenu",
  "campaign.manage": "Créer, activer et mettre en pause les campagnes",
  "budget.validate": "Valider un budget publicitaire (dépense réelle)",
  "strategy.edit": "Modifier la stratégie, les objectifs et le plan annuel",
  "site.edit": "Modifier les contenus du site e-commerce",
  "seo.edit": "Modifier titres, metas et articles SEO",
  "settings.manage": "Gérer les intégrations, les fréquences et les paramètres",
  "users.manage": "Gérer les utilisateurs et les rôles",
  "tickets.manage": "Traiter les demandes (équipe marketing)",
} as const;
export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.keys(PERMISSIONS) as Permission[],
  marketing: ["content.edit", "content.validate", "content.publish", "campaign.manage", "strategy.edit", "site.edit", "seo.edit", "settings.manage", "tickets.manage"],
  createur: ["content.edit", "seo.edit"],
  validateur: ["content.validate", "content.publish", "budget.validate"],
};

export const can = (role: Role | undefined, p: Permission) => !!role && ROLE_PERMISSIONS[role].includes(p);
