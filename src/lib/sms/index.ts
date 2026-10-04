import { env } from "@/lib/env";

export interface SmsProvider {
  send(to: string, text: string): Promise<void>;
  sendOtp(to: string, code: string): Promise<void>;
}

class MockSms implements SmsProvider {
  async send(to: string, text: string) {
    console.info(`[sms:mock] to=${to} text=${text}`);
  }
  async sendOtp(to: string, code: string) {
    console.info(`[sms:mock] OTP for ${to}: ${code}`);
  }
}

/** Kavenegar REST API (https://kavenegar.com/rest.html). */
class KavenegarSms implements SmsProvider {
  private base = `https://api.kavenegar.com/v1/${env.sms.apiKey}`;

  private async call(path: string, params: Record<string, string>) {
    const res = await fetch(`${this.base}/${path}?${new URLSearchParams(params)}`, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Kavenegar ${path} failed: ${res.status}`);
  }

  async send(to: string, text: string) {
    await this.call("sms/send.json", { receptor: to, sender: env.sms.sender, message: text });
  }

  async sendOtp(to: string, code: string) {
    if (env.sms.otpTemplate) {
      await this.call("verify/lookup.json", { receptor: to, token: code, template: env.sms.otpTemplate });
    } else {
      await this.send(to, `کد ورود به مزون ترنج: ${code}`);
    }
  }
}

let provider: SmsProvider | null = null;

export function sms(): SmsProvider {
  if (!provider) provider = env.sms.provider === "kavenegar" ? new KavenegarSms() : new MockSms();
  return provider;
}

/** Fire-and-forget notification; failures are logged but never break the main flow. */
export function notify(to: string | string[], text: string) {
  const list = Array.isArray(to) ? to : [to];
  for (const t of list) sms().send(t, text).catch((e) => console.error("[sms] failed", e));
}
