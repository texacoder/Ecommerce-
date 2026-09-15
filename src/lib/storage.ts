import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { AppError } from "@/lib/errors";

export interface StorageAdapter {
  upload(buffer: Buffer, opts: { contentType: string; extension: string }): Promise<string>;
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Development fallback: writes into /public/uploads and returns a local URL.
 * Fine for local dev, but not for a real deployment on Vercel (the
 * filesystem there is read-only at request time) — configure Cloudinary in
 * production via CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET. */
class LocalDiskAdapter implements StorageAdapter {
  async upload(buffer: Buffer, opts: { extension: string }): Promise<string> {
    const filename = `${randomUUID()}.${opts.extension}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);
    return `/uploads/${filename}`;
  }
}

class CloudinaryAdapter implements StorageAdapter {
  async upload(buffer: Buffer, opts: { contentType: string }): Promise<string> {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const dataUri = `data:${opts.contentType};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: "nexora/products" });
    return result.secure_url;
  }
}

export function isCloudStorageConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

function getAdapter(): StorageAdapter {
  return isCloudStorageConfigured() ? new CloudinaryAdapter() : new LocalDiskAdapter();
}

export class UploadValidationError extends AppError {}

/** Single entry point used by every admin upload endpoint. Swapping storage
 * backends (S3, Supabase Storage, etc.) only means adding another adapter
 * class above and selecting it here — nothing in the API routes changes. */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadValidationError("Unsupported image type. Use PNG, JPEG, WEBP or GIF.");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new UploadValidationError("Image is too large (max 5MB).");
  }
  const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const buffer = Buffer.from(await file.arrayBuffer());
  return getAdapter().upload(buffer, { contentType: file.type, extension });
}
