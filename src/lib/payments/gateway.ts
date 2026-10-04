export type PaymentRequest = { amountIrr: number; callbackUrl: string; description: string; mobile?: string; orderId: string };
export type PaymentRequestResult = { authority: string; redirectUrl: string };
export type PaymentVerifyResult = { ok: boolean; refNumber?: string; message?: string };

export interface PaymentGateway {
  readonly name: string;
  request(input: PaymentRequest): Promise<PaymentRequestResult>;
  verify(input: { authority: string; amountIrr: number }): Promise<PaymentVerifyResult>;
}
