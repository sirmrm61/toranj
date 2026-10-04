import sharp, { type Metadata } from "sharp";
import { HttpError } from "@/lib/http";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);

/**
 * Validates the real file type (decoded by libvips, not the client-declared MIME),
 * applies EXIF orientation, strips all metadata (EXIF/GPS) and resizes server-side.
 */
export async function normalizeUpload(input: Buffer, maxSide = 1536): Promise<Buffer> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new HttpError(413, "حجم عکس بیشتر از ۸ مگابایت است.", "too_large");
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new HttpError(415, "فایل ارسالی تصویر معتبر نیست.", "invalid_image");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new HttpError(415, "فقط تصاویر JPG، PNG، WEBP یا HEIC پذیرفته می‌شوند.", "invalid_image");
  }
  if ((meta.width ?? 0) < 384 || (meta.height ?? 0) < 512) {
    throw new HttpError(422, "کیفیت عکس کم است؛ عکس تمام‌قد با وضوح بیشتر بفرستید.", "low_resolution");
  }
  return sharp(input)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

function watermarkSvg(width: number, height: number, text: string, opacity: number, tiled: boolean) {
  const fontSize = Math.round(Math.max(14, width / 18));
  const marks: string[] = [];
  if (tiled) {
    const stepX = fontSize * 9;
    const stepY = fontSize * 5;
    for (let y = -height; y < height * 2; y += stepY) {
      for (let x = -width; x < width * 2; x += stepX) {
        marks.push(`<text x="${x}" y="${y}">${text}</text>`);
      }
    }
  } else {
    marks.push(`<text x="${width - fontSize * 0.6}" y="${height - fontSize * 0.6}" text-anchor="end">${text}</text>`);
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g fill="#ffffff" fill-opacity="${opacity}" stroke="#000000" stroke-opacity="${opacity / 3}" stroke-width="1"
         font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${fontSize}"
         ${tiled ? `transform="rotate(-30 ${width / 2} ${height / 2})"` : ""}>
        ${marks.join("")}
      </g>
    </svg>`,
  );
}

/** Low-resolution, tiled-watermark preview used for free try-ons (FR-16). */
export async function makePreview(image: Buffer): Promise<Buffer> {
  const resized = await sharp(image).resize({ width: 560, height: 840, fit: "inside" }).toBuffer({ resolveWithObject: true });
  const { width, height } = resized.info;
  return sharp(resized.data)
    .composite([{ input: watermarkSvg(width, height, "TORANJ • PREVIEW", 0.35, true) }])
    .jpeg({ quality: 68 })
    .toBuffer();
}

/** Full-quality result with a subtle corner mark (paid try-ons, FR-17). */
export async function makeFull(image: Buffer): Promise<Buffer> {
  const img = sharp(image).rotate();
  const meta = await img.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1536;
  return img
    .composite([{ input: watermarkSvg(width, height, "TORANJ", 0.45, false) }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
