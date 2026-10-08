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

describe("dailyPosts", () => {
  it("blocks non-admin users from the editorial queue", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.dailyPosts.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows the public published-post query without authentication", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const posts = await caller.dailyPosts.published();
    expect(Array.isArray(posts)).toBe(true);
  });
});
