import "server-only";
import { hubAvailable } from "./auth";
import { ensureSeeded, list } from "./repo";
import type { Article } from "./types";

/** Articles publiés depuis le Marketing Hub (rubrique Conseils du site). Vide si le Hub est indisponible. */
export async function publishedArticles(): Promise<Article[]> {
  if (!hubAvailable()) return [];
  try {
    await ensureSeeded();
    return list("articles").filter((a) => a.status === "publie").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  } catch {
    return [];
  }
}
