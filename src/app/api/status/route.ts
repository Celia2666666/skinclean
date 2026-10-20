import { stripeEnabled, stripeTestMode } from "@/lib/server/stripe";

/** Indique au front quelles intégrations sont configurées (aucune clé n'est exposée). */
export async function GET() {
  return Response.json({
    stripe: stripeEnabled(),
    stripeTest: stripeTestMode(),
    email: !!process.env.RESEND_API_KEY,
    assistantAI: !!process.env.ASSISTANT_AI_ENDPOINT,
    database: !!process.env.DATABASE_URL,
  });
}
