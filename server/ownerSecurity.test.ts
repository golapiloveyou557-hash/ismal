import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { verifyOwnerMfaCode } from "./_core/mfa";

describe("owner security configuration", () => {
  it("requires a server-side owner identity and MFA secret in production", () => {
    if (ENV.isProduction) {
      expect(ENV.ownerOpenId).toBeTruthy();
      expect(ENV.ownerEmail).toMatch(/@/);
      expect(ENV.ownerProvider).toBe("google");
      expect(ENV.ownerMfaRequired).toBe(true);
      expect(ENV.ownerMfaSecret).toBeTruthy();
      expect(typeof verifyOwnerMfaCode("000000")).toBe("boolean");
    } else {
      expect(typeof ENV.ownerOpenId).toBe("string");
    }
  });
});
