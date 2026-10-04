import { describe, expect, it } from "vitest";
import { generateReferralCode, referralFraudReason } from "@/lib/credits/referral";

const inviter = { id: "a", signupIp: "1.1.1.1", deviceId: "dev-a" };

describe("referral fraud rules", () => {
  it("rejects self invites", () => {
    expect(referralFraudReason(inviter, { id: "a" }, { ip: "2.2.2.2", deviceId: "x" })).toBe("self_invite");
  });
  it("flags shared device and shared ip", () => {
    expect(referralFraudReason(inviter, { id: "b" }, { ip: "2.2.2.2", deviceId: "dev-a" })).toBe("shared_device");
    expect(referralFraudReason(inviter, { id: "b" }, { ip: "1.1.1.1", deviceId: "dev-b" })).toBe("shared_ip");
  });
  it("accepts a clean invite", () => {
    expect(referralFraudReason(inviter, { id: "b" }, { ip: "2.2.2.2", deviceId: "dev-b" })).toBeNull();
    expect(referralFraudReason(inviter, { id: "b" }, { ip: null, deviceId: null })).toBeNull();
  });
  it("generates unambiguous codes", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{7}$/);
  });
});
