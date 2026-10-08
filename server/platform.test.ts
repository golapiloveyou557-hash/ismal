import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("final platform boundaries", () => {
  it("keeps the admin overview protected", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows public profile search without exposing admin data", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const result = await caller.profile.search({ query: "member" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks anonymous access to membership and wallet records", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.membership.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.wallet.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects any withdrawal purpose other than non_gambling at the API boundary", async () => {
    const caller = appRouter.createCaller(
      createContext({
        id: 5,
        openId: "member",
        name: "Member",
        email: "member@example.com",
        loginMethod: "test",
        role: "user",
        adminRole: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      })
    );
    await expect(
      caller.wallet.requestWithdrawal({
        amountCents: 100,
        reference: "ref-1234",
        note: "A lawful non-gambling purpose",
        purpose: "membership" as never,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks ordinary admins from owner-only management", async () => {
    const caller = appRouter.createCaller(
      createContext({
        id: 6,
        openId: "admin",
        name: "Admin",
        email: "admin@example.com",
        loginMethod: "google",
        role: "admin",
        adminRole: "super_admin",
        isOwner: false,
        accountStatus: "active",
        sessionVersion: 1,
        twoFactorEnabled: true,
        mfaSecret: null,
        mfaVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      })
    );
    await expect(caller.admin.users()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.admin.auditLogs()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("blocks unverified owner sessions from owner-only management", async () => {
    const caller = appRouter.createCaller(
      createContext({
        id: 7,
        openId: "owner",
        name: "Owner",
        email: "owner@example.com",
        loginMethod: "google",
        role: "admin",
        adminRole: "super_admin",
        isOwner: true,
        accountStatus: "active",
        sessionVersion: 1,
        twoFactorEnabled: false,
        mfaSecret: null,
        mfaVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      })
    );
    await expect(caller.admin.users()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
