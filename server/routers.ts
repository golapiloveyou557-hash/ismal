import { COOKIE_NAME } from "@shared/const";
import { paymentConfig } from "@shared/paymentConfig";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  ownerProcedure,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import {
  commentOnPost,
  createDeposit,
  createGroup,
  createNotification,
  createNonGamblingWithdrawal,
  createSocialPost,
  createSupportTicket,
  deleteDailyPost,
  disableAdmin,
  followUser,
  getAdminDailyPosts,
  getAdminDeposits,
  getAdminOverview,
  getAdminRoles,
  getAuditLogs,
  getDepositByTransactionId,
  getGroups,
  getKyc,
  getMembershipForUser,
  getMembershipPlans,
  getMessagesForUser,
  getOwnerBinding,
  getOwnerSecurityStatus,
  getProfile,
  getPublishedDailyPosts,
  getRolePermissions,
  getSecurityEvents,
  getSocialFeed,
  getUserDeposits,
  getUserNotifications,
  getUserSupportTickets,
  getWalletForUser,
  getWalletTransactions,
  getAdminUsers,
  likeSocialPost,
  markNotificationRead,
  promoteUserToAdmin,
  reviewDeposit,
  saveDailyPost,
  saveProfile,
  searchProfiles,
  sendMessage,
  setTwoFactor,
  updateAdminRole,
  writeAuditLog,
  markOwnerMfaVerified,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { verifyOwnerMfaCode } from "./_core/mfa";
import { ENV } from "./_core/env";

const dailyPostInput = z.object({
  id: z.number().int().positive().optional(),
  gameKey: z.string().trim().min(1).max(64),
  gameName: z.string().trim().min(1).max(120),
  postDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(10000),
  mediaUrl: z.string().trim().max(500).optional(),
  visibility: z.enum(["free", "vip"]),
  status: z.enum(["draft", "published"]),
});
const depositInput = z.object({
  paymentMethod: z.enum(["bkash", "nagad", "bank"]),
  accountReference: z.string().trim().min(4).max(80),
  amount: z.string().trim().min(1).max(32),
  transactionId: z.string().trim().min(4).max(160),
  screenshotKey: z.string().trim().min(1).max(255),
  screenshotUrl: z.string().trim().min(1).max(500),
  note: z.string().trim().max(2000).optional(),
});
const reviewInput = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "rejected", "pending"]),
  reviewNote: z.string().trim().max(2000).optional(),
});
const profileInput = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  website: z.string().trim().max(255).optional(),
  privacy: z.enum(["public", "members", "private"]).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  coverUrl: z.string().trim().max(500).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dailyPosts: router({
    published: publicProcedure.query(() => getPublishedDailyPosts()),
    adminList: adminProcedure.query(() => getAdminDailyPosts()),
    save: adminProcedure
      .input(dailyPostInput)
      .mutation(({ input, ctx }) =>
        saveDailyPost({ ...input, createdBy: ctx.user.id })
      ),
    remove: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteDailyPost(input.id)),
  }),
  deposits: router({
    mine: protectedProcedure.query(({ ctx }) => getUserDeposits(ctx.user.id)),
    submit: protectedProcedure
      .input(depositInput)
      .mutation(async ({ input, ctx }) => {
        const method = paymentConfig.methods.find(
          item => item.key === input.paymentMethod
        );
        if (!method || method.account !== input.accountReference)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Payment account does not match the verified instructions.",
          });
        if (
          !input.screenshotKey.startsWith(
            `payment-screenshots/${ctx.user.id}/`
          ) ||
          !input.screenshotUrl.startsWith("/manus-storage/payment-screenshots/")
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Payment screenshot must be uploaded through the secure upload flow.",
          });
        if (await getDepositByTransactionId(input.transactionId))
          throw new TRPCError({
            code: "CONFLICT",
            message: "This transaction ID has already been submitted.",
          });
        const deposit = await createDeposit({
          ...input,
          userId: ctx.user.id,
          beneficiaryName: "MD EJAN CHOWDHURY",
          status: "pending",
        });
        try {
          await notifyOwner({
            title: "New VIP deposit awaiting review",
            content: `A new ${input.paymentMethod} deposit was submitted by user ${ctx.user.id}. Transaction ID: ${input.transactionId}. Amount: ${input.amount}.`,
          });
        } catch (error) {
          console.warn("[Deposit] Owner notification failed", error);
        }
        return deposit;
      }),
    adminList: permissionProcedure("payments").query(() => getAdminDeposits()),
    review: permissionProcedure("payments")
      .input(reviewInput)
      .mutation(async ({ input, ctx }) => {
        const deposit = await reviewDeposit(
          input.id,
          input.status,
          input.reviewNote ?? null,
          ctx.user.id
        );
        if (!deposit) throw new Error("Deposit not found");
        const statusLabel =
          input.status === "approved"
            ? "approved"
            : input.status === "rejected"
              ? "rejected"
              : "returned to pending";
        try {
          await createNotification({
            userId: deposit.userId,
            type: "deposit_review",
            title: `VIP deposit ${statusLabel}`,
            message: input.reviewNote
              ? `Your deposit has been ${statusLabel}. Admin note: ${input.reviewNote}`
              : `Your deposit has been ${statusLabel}.`,
          });
        } catch (error) {
          console.warn("[Deposit] User notification failed", error);
        }
        return deposit;
      }),
  }),
  notifications: router({
    mine: protectedProcedure.query(({ ctx }) =>
      getUserNotifications(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input, ctx }) =>
        markNotificationRead(input.id, ctx.user.id)
      ),
  }),
  profile: router({
    mine: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    save: protectedProcedure
      .input(profileInput)
      .mutation(({ input, ctx }) => saveProfile(ctx.user.id, input)),
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(2).max(80) }))
      .query(({ input }) => searchProfiles(input.query)),
  }),
  community: router({
    feed: publicProcedure.query(() => getSocialFeed()),
    createPost: protectedProcedure
      .input(
        z.object({
          body: z.string().trim().min(1).max(10000),
          kind: z.enum(["text", "photo", "video"]).default("text"),
          visibility: z.enum(["public", "members", "group"]).default("public"),
          mediaUrl: z.string().max(500).optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        createSocialPost({ ...input, authorId: ctx.user.id })
      ),
    like: protectedProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .mutation(({ input, ctx }) => likeSocialPost(input.postId, ctx.user.id)),
    comment: protectedProcedure
      .input(
        z.object({
          postId: z.number().int().positive(),
          body: z.string().trim().min(1).max(1000),
        })
      )
      .mutation(({ input, ctx }) =>
        commentOnPost({ ...input, userId: ctx.user.id })
      ),
    follow: protectedProcedure
      .input(z.object({ followingId: z.number().int().positive() }))
      .mutation(({ input, ctx }) => followUser(ctx.user.id, input.followingId)),
    groups: publicProcedure.query(() => getGroups()),
    createGroup: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(3).max(120),
          slug: z
            .string()
            .trim()
            .min(3)
            .max(140)
            .regex(/^[a-z0-9-]+$/),
          description: z.string().trim().max(1000).optional(),
          privacy: z.enum(["public", "private"]),
        })
      )
      .mutation(({ input, ctx }) =>
        createGroup({ ...input, createdBy: ctx.user.id })
      ),
  }),
  messages: router({
    mine: protectedProcedure.query(({ ctx }) =>
      getMessagesForUser(ctx.user.id)
    ),
    send: protectedProcedure
      .input(
        z.object({
          receiverId: z.number().int().positive(),
          body: z.string().trim().min(1).max(4000),
        })
      )
      .mutation(({ input, ctx }) =>
        sendMessage({ ...input, senderId: ctx.user.id })
      ),
  }),
  membership: router({
    plans: publicProcedure.query(() => getMembershipPlans()),
    mine: protectedProcedure.query(({ ctx }) =>
      getMembershipForUser(ctx.user.id)
    ),
  }),
  wallet: router({
    mine: protectedProcedure.query(({ ctx }) => getWalletForUser(ctx.user.id)),
    transactions: protectedProcedure.query(({ ctx }) =>
      getWalletTransactions(ctx.user.id)
    ),
    requestWithdrawal: protectedProcedure
      .input(
        z.object({
          amountCents: z.number().int().positive(),
          reference: z.string().trim().min(4).max(180),
          note: z.string().trim().min(10).max(2000),
          purpose: z.literal("non_gambling"),
        })
      )
      .mutation(({ input, ctx }) =>
        createNonGamblingWithdrawal({ ...input, userId: ctx.user.id })
      ),
  }),
  support: router({
    mine: protectedProcedure.query(({ ctx }) =>
      getUserSupportTickets(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          category: z.string().trim().min(2).max(80),
          subject: z.string().trim().min(4).max(180),
          message: z.string().trim().min(10).max(4000),
          priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        createSupportTicket({ ...input, userId: ctx.user.id })
      ),
  }),
  security: router({
    status: protectedProcedure.query(({ ctx }) => ({
      twoFactorEnabled: ctx.user.twoFactorEnabled,
    })),
    toggleTwoFactor: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(({ input, ctx }) => setTwoFactor(ctx.user.id, input.enabled)),
  }),
  admin: router({
    overview: adminProcedure.query(() => getAdminOverview()),
    roles: adminProcedure.query(() => getAdminRoles()),
    permissions: adminProcedure.query(() => getRolePermissions()),
    securityEvents: permissionProcedure("security").query(() =>
      getSecurityEvents()
    ),
    auditLogs: ownerProcedure.query(() => getAuditLogs()),
    ownerStatus: protectedProcedure.query(({ ctx }) =>
      getOwnerSecurityStatus(ctx.user.id)
    ),
    verifyMfa: protectedProcedure
      .input(z.object({ code: z.string().regex(/^\d{6}$/) }))
      .mutation(async ({ input, ctx }) => {
        if (
          !ctx.user.isOwner ||
          !ENV.ownerMfaRequired ||
          !verifyOwnerMfaCode(input.code)
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Owner MFA verification failed.",
          });
        await markOwnerMfaVerified(ctx.user.id);
        await writeAuditLog({
          actorId: ctx.user.id,
          action: "owner_mfa_verified",
          entityType: "owner",
          entityId: ctx.user.id,
        });
        return { success: true as const };
      }),
    users: ownerProcedure.query(() => getAdminUsers()),
    createAdmin: ownerProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          adminRole: z.enum([
            "super_admin",
            "finance_admin",
            "content_admin",
            "support_admin",
            "moderator",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await promoteUserToAdmin(input.userId, input.adminRole);
        await writeAuditLog({
          actorId: ctx.user.id,
          action: "admin_created",
          entityType: "user",
          entityId: input.userId,
          metadata: JSON.stringify({ adminRole: input.adminRole }),
        });
        return result;
      }),
    updateAdminRole: ownerProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          adminRole: z.enum([
            "super_admin",
            "finance_admin",
            "content_admin",
            "support_admin",
            "moderator",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await updateAdminRole(input.userId, input.adminRole);
        await writeAuditLog({
          actorId: ctx.user.id,
          action: "admin_role_changed",
          entityType: "user",
          entityId: input.userId,
          metadata: JSON.stringify({ adminRole: input.adminRole }),
        });
        return result;
      }),
    disableAdmin: ownerProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          status: z.enum(["disabled", "removed"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await disableAdmin(input.userId, input.status);
        await writeAuditLog({
          actorId: ctx.user.id,
          action:
            input.status === "disabled" ? "admin_disabled" : "admin_removed",
          entityType: "user",
          entityId: input.userId,
          metadata: JSON.stringify({ sessionRevoked: true }),
        });
        return result;
      }),
    writeAudit: ownerProcedure
      .input(
        z.object({
          action: z.string().max(100),
          entityType: z.string().max(100),
          entityId: z.number().int().positive().optional(),
          metadata: z.string().max(2000).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await writeAuditLog({ ...input, actorId: ctx.user.id });
        return { success: true as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
