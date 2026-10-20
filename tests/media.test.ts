import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { products } from "@/data/products";

describe("vidéos de démonstration", () => {
  const withVideo = products.filter((p) => p.media.hoverVideo);
  it("chaque vidéo n'est utilisée que par un seul produit", () => {
    const vids = withVideo.map((p) => p.media.hoverVideo);
    expect(new Set(vids).size).toBe(vids.length);
  });
  it("tous les fichiers vidéo et packshots existent", () => {
    for (const p of products) {
      if (p.media.hoverVideo) expect(existsSync(`public${p.media.hoverVideo}`), p.media.hoverVideo).toBe(true);
      if (p.media.packshot) expect(existsSync(`public${p.media.packshot}`), p.media.packshot).toBe(true);
    }
  });
  it("seuls les patchs et la pince n'ont pas de vidéo", () => {
    const none = products.filter((p) => !p.media.hoverVideo).map((p) => p.slug);
    expect(none.sort()).toEqual(["accessoire-pince-cheveux", "spot-hero-night-patchs-nuit", "spot-hero-patchs-anti-imperfections"]);
  });
});
