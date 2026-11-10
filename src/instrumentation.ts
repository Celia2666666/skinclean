/** Démarrage du serveur : lance le planificateur du Marketing Hub (publications programmées, rappels). */
export async function register() {
  // Heure de Paris côté serveur (Vercel tourne en UTC) : dates affichées et « aujourd'hui » identiques au navigateur
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.TZ) process.env.TZ = "Europe/Paris";
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.HUB_SCHEDULER !== "off" && !process.env.VERCEL) {
    const { startScheduler } = await import("./lib/hub/scheduler");
    startScheduler();
  }
}
