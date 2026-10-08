import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (
      !ctx.user ||
      !ctx.user.isOwner ||
      ctx.user.role !== "admin" ||
      ctx.user.accountStatus !== "active" ||
      !ctx.user.twoFactorEnabled
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Owner verification and MFA are required.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

const rolePermissions: Record<
  NonNullable<TrpcContext["user"]>["adminRole"] & string,
  string[]
> = {
  super_admin: ["*"],
  finance_admin: ["payments", "wallet", "membership"],
  content_admin: ["content", "posts", "groups"],
  support_admin: ["support", "users"],
  moderator: ["moderation", "posts", "groups"],
};

export const permissionProcedure = (permission: string) =>
  t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      const adminRole = ctx.user?.adminRole;
      if (!ctx.user || ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      if (
        adminRole &&
        !(
          rolePermissions[adminRole]?.includes("*") ||
          rolePermissions[adminRole]?.includes(permission)
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your admin role does not include ${permission} permission.`,
        });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    })
  );
