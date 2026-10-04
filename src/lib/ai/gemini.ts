import { GoogleGenAI, type Part } from "@google/genai";
import sharp from "sharp";
import { env } from "@/lib/env";
import { NoImageError, ProviderUnavailableError, SafetyBlockedError, type TryOnInput, type TryOnProvider } from "./provider";

const BLOCKING_FINISH = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT"]);

async function toJpegB64(buf: Buffer) {
  return (await sharp(buf).jpeg({ quality: 90 }).toBuffer()).toString("base64");
}

/** Google Gemini Image (Nano Banana) — server/worker only (TRD §7). */
export class GeminiProvider implements TryOnProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;

  constructor(
    private model = env.ai.tryonModel,
    apiKey = env.ai.apiKey,
  ) {
    if (!apiKey) throw new ProviderUnavailableError("GEMINI_API_KEY is not configured");
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate({ personImage, gownImages, prompt }: TryOnInput) {
    const parts: Part[] = [
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: await toJpegB64(personImage) } },
    ];
    for (const g of gownImages) parts.push({ inlineData: { mimeType: "image/jpeg", data: await toJpegB64(g) } });

    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE"],
        abortSignal: AbortSignal.timeout(env.ai.timeoutMs),
      },
    });

    if (res.promptFeedback?.blockReason) throw new SafetyBlockedError(String(res.promptFeedback.blockReason));
    const candidate = res.candidates?.[0];
    if (candidate?.finishReason && BLOCKING_FINISH.has(String(candidate.finishReason))) {
      throw new SafetyBlockedError(String(candidate.finishReason));
    }
    const part = candidate?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new NoImageError();
    return { image: Buffer.from(part.inlineData.data, "base64"), mime: part.inlineData.mimeType ?? "image/png" };
  }
}
