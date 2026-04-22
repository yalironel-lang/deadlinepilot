import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf", "text/plain"];

export async function saveFile(
  file: File,
  userId: string
): Promise<{ storagePath: string; publicUrl: string; error?: string }> {
  if (file.size > MAX_SIZE_BYTES) {
    return { storagePath: "", publicUrl: "", error: "File exceeds 10 MB limit" };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { storagePath: "", publicUrl: "", error: "Only PDF and TXT files are supported" };
  }

  const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".txt");
  const filename = `${Date.now()}-${uuid()}${ext}`;
  const userDir = path.join(UPLOADS_DIR, userId);

  await fs.mkdir(userDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(userDir, filename);
  await fs.writeFile(fullPath, buffer);

  const storagePath = `/uploads/${userId}/${filename}`;
  return { storagePath, publicUrl: storagePath };
}

export async function deleteFile(storagePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", storagePath);
  await fs.unlink(fullPath).catch(() => {}); // silently ignore if already gone
}
