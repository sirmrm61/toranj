import { env } from "@/lib/env";
import type { PaymentGateway, PaymentRequest } from "./gateway";

type ZpResponse = { data?: { code?: number; authority?: string; ref_id?: number; message?: string }; errors?: unknown };

/** Zarinpal REST v4 (https://www.zarinpal.com/docs/paymentGateway/). Amounts are in IRR (Rial). */
export class ZarinpalGateway implements PaymentGateway {
  readonly name = "zarinpal";
  private base = env.payment.sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";

  private async post(path: string, body: Record<string, unknown>): Promise<ZpResponse> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchant_id: env.payment.merchantId, ...body }),
      signal: AbortSignal.timeout(15_000),
    });
    return (await res.json().catch(() => ({}))) as ZpResponse;
  }

  async request(input: PaymentRequest) {
    const r = await this.post("/pg/v4/payment/request.json", {
      amount: input.amountIrr,
      currency: "IRR",
      callback_url: input.callbackUrl,
      description: input.description,
      metadata: { mobile: input.mobile, order_id: input.orderId },
    });
    if (r.data?.code !== 100 || !r.data.authority) throw new Error(`zarinpal request failed: ${JSON.stringify(r.errors ?? r.data)}`);
    return { authority: r.data.authority, redirectUrl: `${this.base}/pg/StartPay/${r.data.authority}` };
  }

  async verify({ authority, amountIrr }: { authority: string; amountIrr: number }) {
    const r = await this.post("/pg/v4/payment/verify.json", { authority, amount: amountIrr });
    const code = r.data?.code;
    // 100 = verified now, 101 = already verified earlier (idempotent)
    if (code === 100 || code === 101) return { ok: true, refNumber: String(r.data?.ref_id ?? "") };
    return { ok: false, message: r.data?.message ?? JSON.stringify(r.errors) };
  }
}
