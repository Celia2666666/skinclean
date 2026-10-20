/**
 * Point d'extension du Glow Assistant vers une IA conversationnelle.
 * Sans ASSISTANT_AI_ENDPOINT, l'assistant fonctionne en mode guidé (scénarios prédéfinis, côté client)
 * et l'interface l'indique clairement. Pour brancher un modèle, implémenter ici un appel serveur
 * qui reçoit { messages, context } et renvoie { reply, productIds } en restreignant le modèle au catalogue.
 */
export async function POST(req: Request) {
  const endpoint = process.env.ASSISTANT_AI_ENDPOINT;
  if (!endpoint) return Response.json({ error: "IA non configurée", mode: "guided" }, { status: 501 });
  const body = await req.json().catch(() => null);
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.ASSISTANT_AI_KEY ?? ""}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) return Response.json({ error: "Assistant indisponible", mode: "guided" }, { status: 502 });
  return Response.json(await r.json());
}
