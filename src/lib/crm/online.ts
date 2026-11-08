/**
 * CRM en ligne (Vercel) : démo publique sur données fictives.
 * - base régénérée dans /tmp (modifications non conservées, chaque instance a sa copie) ;
 * - aucun e-mail envoyé, aucune donnée réelle (commandes Stripe, chatbot, contact) ;
 * - accès libre, ou protégé par un code si la variable CRM_ACCESS_CODE est définie sur Vercel ;
 * - le Marketing Hub reste strictement local (src/proxy.ts).
 */
export const crmOnline = () => !!process.env.VERCEL;
export const ACCESS_COOKIE = "crm_access";
