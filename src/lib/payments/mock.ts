import { env } from "@/lib/env";
import type { PaymentGateway, PaymentRequest } from "./gateway";

/** Local simulator for development: /pay/mock lets you approve or cancel the payment. */
export class MockGateway implements PaymentGateway {
  readonly name = "mock";

  async request(input: PaymentRequest) {
    const authority = `MOCK-${crypto.randomUUID()}`;
    const qs = new URLSearchParams({ authority, amount: String(input.amountIrr), callback: input.callbackUrl });
    return { authority, redirectUrl: `${env.appUrl}/pay/mock?${qs}` };
  }

  async verify({ authority }: { authority: string }) {
    return { ok: authority.startsWith("MOCK-"), refNumber: `${Math.floor(Math.random() * 1e10)}` };
  }
}
