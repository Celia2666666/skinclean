/** Démarrage du serveur : lance le planificateur du Marketing Hub (publications programmées, rappels). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.HUB_SCHEDULER !== "off") {
    const { startScheduler } = await import("./lib/hub/scheduler");
    startScheduler();
  }
}
