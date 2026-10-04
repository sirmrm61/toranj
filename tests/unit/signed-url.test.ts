import { describe, expect, it } from "vitest";
import { signTryonUrl, verifyTryonSignature } from "@/lib/storage/signed";

function parse(url: string) {
  const u = new URL(url, "http://x");
  return { exp: Number(u.searchParams.get("exp")), sig: u.searchParams.get("sig")!, download: u.searchParams.get("download") };
}

describe("signed try-on media urls", () => {
  it("verifies for the same job, variant and user only", () => {
    const { exp, sig } = parse(signTryonUrl("job1", "preview", "user1"));
    expect(verifyTryonSignature("job1", "preview", "user1", exp, sig)).toBe(true);
    expect(verifyTryonSignature("job1", "full", "user1", exp, sig)).toBe(false);
    expect(verifyTryonSignature("job1", "preview", "user2", exp, sig)).toBe(false);
    expect(verifyTryonSignature("job2", "preview", "user1", exp, sig)).toBe(false);
    expect(verifyTryonSignature("job1", "preview", "user1", exp + 10, sig)).toBe(false);
  });
  it("rejects expired signatures", () => {
    expect(verifyTryonSignature("job1", "preview", "user1", Math.floor(Date.now() / 1000) - 5, "x")).toBe(false);
  });
  it("adds download flag only when requested", () => {
    expect(parse(signTryonUrl("j", "full", "u", true)).download).toBe("1");
    expect(parse(signTryonUrl("j", "full", "u")).download).toBeNull();
  });
});
