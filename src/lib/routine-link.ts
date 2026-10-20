/** Format compact d'une routine partageable (encodée puis signée côté serveur). */
export interface RoutinePayload {
  v: 1;
  /** [productId, variantId, step, moments ("m", "s", "ms")] */
  i: [string, string, string, string][];
  n?: string;
  p?: { st: string; c: string[]; g: string; h?: string };
  t: number;
}
