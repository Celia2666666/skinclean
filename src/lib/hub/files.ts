import "server-only";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Médias du Hub : enregistrés dans /public/media/uploads/<dossier>/ pour être servis directement par le site
 * (même domaine → les visuels publiés sur le site et les e-mails pointent vers ces fichiers).
 */
const ROOT = path.join(process.cwd(), "public", "media", "uploads");
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime", "application/pdf", "text/plain"]);
export const MAX_UPLOAD = 60 * 1024 * 1024;

const slugName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-60) || "fichier";

export function saveBuffer(buf: Buffer, name: string, folder = "divers", mime?: string) {
  if (mime && !ALLOWED.has(mime)) throw new Error(`Type de fichier non autorisé : ${mime}`);
  if (buf.length > MAX_UPLOAD) throw new Error("Fichier trop volumineux (60 Mo max).");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "divers";
  const dir = path.join(ROOT, safeFolder);
  mkdirSync(dir, { recursive: true });
  const file = `${randomUUID().slice(0, 8)}-${slugName(name)}`;
  writeFileSync(path.join(dir, file), buf);
  return { url: `/media/uploads/${safeFolder}/${file}`, size: buf.length };
}

export function saveDataUrl(dataUrl: string, name: string, folder: string) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Image invalide.");
  return { ...saveBuffer(Buffer.from(m[2], "base64"), name, folder, m[1]), base64: m[2], mime: m[1] };
}

export async function imageInfo(publicPath: string) {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(path.join(process.cwd(), "public", publicPath)).metadata();
    return { width: meta.width, height: meta.height, format: meta.format };
  } catch {
    return {};
  }
}

export const readPublic = (publicPath: string) => readFileSync(path.join(process.cwd(), "public", publicPath));
