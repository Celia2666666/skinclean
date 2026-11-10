/**
 * Marketing Hub en ligne (Vercel) : espace « Admin » de démonstration du projet.
 * - base SQLite recréée dans /tmp à partir d'un instantané nettoyé (src/data/hub-snapshot.json) :
 *   les modifications sont possibles mais non conservées (chaque instance a sa copie) ;
 * - session démo automatique avec le compte « Accès complet » : aucun écran de connexion, aucun mot de passe ;
 * - jamais de vraie publication (bac à sable uniquement), d'e-mail réel, d'appel à l'IA
 *   ni de modification de la boutique publiée.
 */
export const hubOnline = () => !!process.env.VERCEL;

export const ONLINE_NOTICE = {
  site: "Version en ligne de démonstration : la modification est enregistrée dans l'Admin, mais la boutique publiée ne change pas.",
  email: "Version en ligne de démonstration : aucun e-mail n'est envoyé.",
  publish: "Version en ligne de démonstration : publication simulée uniquement (aucun réseau social réel).",
  account: "Version en ligne de démonstration : le compte de démonstration ne peut pas être modifié.",
};
