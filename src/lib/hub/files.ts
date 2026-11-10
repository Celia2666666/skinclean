import "server-only";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Médias du Hub : enregistrés dans /public/media/uploads/<dossier>/ pour être servis directement par le site
 * (même domaine → les visuels publiés sur le site et les e-mails pointent vers ces fichiers).
 */
const ONLINE = !!process.env.VERCEL;
/** En ligne (démo), seul /tmp est inscriptible : les fichiers y sont rangés et servis par /api/hub/fichier/… */
const ROOT = ONLINE ? path.join(/*turbopackIgnore: true*/ "/tmp", "hub-media") : path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "media", "uploads");
const URL_BASE = ONLINE ? "/api/hub/fichier" : "/media/uploads";
export const ONLINE_MEDIA_ROOT = path.join(/*turbopackIgnore: true*/ "/tmp", "hub-media");
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime", "application/pdf", "text/plain"]);
export const MAX_UPLOAD = 60 * 1024 * 1024;

const slugName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-60) || "fichier";

export function saveBuffer(buf: Buffer, name: string, folder = "divers", mime?: string) {
  if (mime && !ALLOWED.has(mime)) throw new Error(`Type de fichier non autorisé : ${mime}`);
  if (buf.length > MAX_UPLOAD) throw new Error("Fichier trop volumineux (60 Mo max).");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "divers";
  const dir = path.join(/*turbopackIgnore: true*/ ROOT, safeFolder);
  mkdirSync(dir, { recursive: true });
  const file = `${randomUUID().slice(0, 8)}-${slugName(name)}`;
  writeFileSync(path.join(/*turbopackIgnore: true*/ dir, file), buf);
  return { url: `${URL_BASE}/${safeFolder}/${file}`, size: buf.length };
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

export const readPublic = (publicPath: string) =>
  publicPath.startsWith("/api/hub/fichier/")
    ? readFileSync(path.join(/*turbopackIgnore: true*/ ONLINE_MEDIA_ROOT, publicPath.slice("/api/hub/fichier/".length)))
    : readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", publicPath));

/** Fichier rangé dans /tmp (version en ligne) : chemin sûr « dossier/fichier », sinon null. */
export function readOnlineMedia(rel: string): { buf: Buffer; type: string } | null {
  if (!/^[a-z0-9-]+\/[\w.-]+$/i.test(rel) || rel.includes("..")) return null;
  try {
    const buf = readFileSync(path.join(/*turbopackIgnore: true*/ ONLINE_MEDIA_ROOT, rel));
    const ext = rel.split(".").pop()!.toLowerCase();
    const type = ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", pdf: "application/pdf" } as Record<string, string>)[ext] ?? "application/octet-stream";
    return { buf, type };
  } catch { return null; }
}

/**
 * Vignette d'une vidéo (image JPEG extraite par le navigateur), enregistrée une fois pour toutes
 * dans /public/media/videos/thumbs/<nom-de-la-vidéo>.jpg : les listes l'affichent sans décoder la vidéo.
 */
export function saveVideoThumb(src: string, dataUrl: string) {
  const name = /^\/media\/videos\/(?:[\w-]+\/)*([\w-]+)\.mp4$/.exec(src)?.[1];
  if (!name) throw new Error("Vidéo inconnue.");
  const m = /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Image invalide.");
  const buf = Buffer.from(m[1], "base64");
  if (buf.length > 2 * 1024 * 1024) throw new Error("Vignette trop lourde.");
  if (ONLINE) return { thumb: `/media/videos/thumbs/${name}.jpg` }; // en ligne : vignettes déjà livrées avec le site
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "media", "videos", "thumbs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(/*turbopackIgnore: true*/ dir, `${name}.jpg`), buf);
  return { thumb: `/media/videos/thumbs/${name}.jpg` };
}
