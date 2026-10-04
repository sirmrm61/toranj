export interface TryOnInput {
  personImage: Buffer;
  gownImages: Buffer[];
  prompt: string;
}

export interface TryOnProvider {
  readonly name: string;
  generate(input: TryOnInput): Promise<{ image: Buffer; mime: string }>;
}

/** The provider's safety system refused the request — no credit is charged and no retry is attempted. */
export class SafetyBlockedError extends Error {
  constructor(reason?: string) {
    super(`blocked by safety filter${reason ? `: ${reason}` : ""}`);
    this.name = "SafetyBlockedError";
  }
}

/** The model answered but produced no usable image. */
export class NoImageError extends Error {
  constructor() {
    super("model returned no image");
    this.name = "NoImageError";
  }
}

/** The provider is not reachable / not configured (e.g. regional restrictions, TRD §14). */
export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
