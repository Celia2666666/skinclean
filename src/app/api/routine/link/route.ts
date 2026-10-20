import { sign, siteUrl } from "@/lib/sign";
import { sanitizeRoutine } from "@/lib/server/routine";

export async function POST(req: Request) {
  const payload = sanitizeRoutine(await req.json().catch(() => null));
  if (!payload) return Response.json({ error: "Routine invalide" }, { status: 400 });
  const token = sign(payload);
  return Response.json({ token, url: `${siteUrl()}/routine/${token}` });
}
