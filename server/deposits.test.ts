import { describe, expect, it } from "vitest";
import { paymentConfig } from "../shared/paymentConfig";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("deposits", () => {
  it("keeps the owner payment instructions deposit-only", () => {
    expect(paymentConfig.beneficiaryName).toBe("MD EJAN CHOWDHURY");
    expect(
      paymentConfig.methods.find(method => method.key === "bkash")?.account
    ).toBe("01863211541");
    expect(
      paymentConfig.methods.find(method => method.key === "nagad")?.account
    ).toBe("01863211541");
    expect(
      paymentConfig.methods.find(method => method.key === "bank")?.account
    ).toBe("514012122490");
    expect(paymentConfig.withdrawEnabled).toBe(false);
  });

  it("requires authentication before reading or submitting deposits", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.deposits.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.deposits.submit({
        paymentMethod: "bkash",
        accountReference: "01863211541",
        amount: "500",
        transactionId: "TX-1234",
        screenshotKey: "key",
        screenshotUrl: "/manus-storage/key",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps deposit review restricted to admins", async () => {
    const user = {
      id: 7,
      openId: "member",
      name: "Member",
      email: "member@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));
    await expect(caller.deposits.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects forged payment details and storage paths", async () => {
    const user = {
      id: 7,
      openId: "member",
      name: "Member",
      email: "member@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));
    await expect(
      caller.deposits.submit({
        paymentMethod: "bkash",
        accountReference: "00000000000",
        amount: "500",
        transactionId: "TX-ACCOUNT",
        screenshotKey: "payment-screenshots/7/s.png",
        screenshotUrl: "/manus-storage/payment-screenshots/7/s.png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.deposits.submit({
        paymentMethod: "bkash",
        accountReference: "01863211541",
        amount: "500",
        transactionId: "TX-PATH",
        screenshotKey: "other/7/s.png",
        screenshotUrl: "/manus-storage/other/7/s.png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
