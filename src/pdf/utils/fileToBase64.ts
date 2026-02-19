import fs from "node:fs/promises";
import path from "node:path";

const fileCache = new Map<string, string>();

function getMimeByExtension(ext: string) {
  const normalized = ext.replace(".", "").toLowerCase();

  if (normalized === "png") return "image/png";
  if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
  if (normalized === "webp") return "image/webp";

  return "application/octet-stream";
}

export async function fileToBase64(filePath: string) {
  const cached = fileCache.get(filePath);
  if (cached) return cached;

  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");

  const mime = getMimeByExtension(path.extname(filePath));

  const result = `data:${mime};base64,${base64}`;
  fileCache.set(filePath, result);

  return result;
}
