import sharp, { type OverlayOptions } from "sharp";
import type { TryOnInput, TryOnProvider } from "./provider";

/**
 * Offline provider for development/tests: overlays the gown reference on the person photo.
 * It lets the whole try-on flow (queue, credits, watermark, history) run without network access.
 */
export class MockProvider implements TryOnProvider {
  readonly name = "mock";

  async generate({ personImage, gownImages }: TryOnInput) {
    const delay = Number(process.env.MOCK_AI_DELAY_MS ?? 1500);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    const base = sharp(personImage).resize({ width: 1024, height: 1536, fit: "cover", position: "top" });
    const overlays: OverlayOptions[] = [];
    if (gownImages[0]) {
      const gown = await sharp(gownImages[0])
        .resize({ width: 640, height: 1000, fit: "inside" })
        .ensureAlpha(0.85)
        .png()
        .toBuffer();
      overlays.push({ input: gown, gravity: "south" });
    }
    const image = await base.composite(overlays).jpeg({ quality: 90 }).toBuffer();
    return { image, mime: "image/jpeg" };
  }
}
