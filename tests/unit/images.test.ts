import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { makePreview, normalizeUpload } from "@/lib/images";

const photo = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#c9a" } })
    .withMetadata({ exif: { IFD0: { Copyright: "secret-gps" } } })
    .jpeg()
    .toBuffer();

describe("upload normalization", () => {
  it("rejects files that are not images regardless of name/mime", async () => {
    await expect(normalizeUpload(Buffer.from("<?php echo 1; ?>"))).rejects.toMatchObject({ status: 415 });
  });

  it("rejects oversized uploads", async () => {
    await expect(normalizeUpload(Buffer.alloc(8 * 1024 * 1024 + 1))).rejects.toMatchObject({ status: 413 });
  });

  it("strips metadata and limits size", async () => {
    const out = await normalizeUpload(await photo(2400, 3600));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("jpeg");
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(1536);
    expect(meta.exif).toBeUndefined();
  });

  it("builds a small watermarked preview", async () => {
    const out = await makePreview(await photo(1024, 1536));
    const meta = await sharp(out).metadata();
    expect(meta.width).toBeLessThanOrEqual(560);
    expect(meta.height).toBeLessThanOrEqual(840);
  });
});
