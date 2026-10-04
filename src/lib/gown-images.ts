import { readFile } from "node:fs/promises";
import path from "node:path";
import { storage } from "@/lib/storage";

const MEDIA_PREFIX = "/api/media/gowns/";

/** Loads a gown image referenced either by a public path (/gowns-media/...) or an uploaded media URL. */
export async function loadGownImage(ref: string): Promise<Buffer | null> {
  if (ref.startsWith(MEDIA_PREFIX)) {
    return (await storage.get(`gowns/${ref.slice(MEDIA_PREFIX.length)}`))?.body ?? null;
  }
  if (ref.startsWith("/") && !ref.includes("..")) {
    return readFile(path.join(process.cwd(), "public", ref)).catch(() => null);
  }
  return null;
}

export const gownMediaUrl = (key: string) => `${MEDIA_PREFIX}${key.replace(/^gowns\//, "")}`;
