import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminAuditLogs,
  adminRoles,
  dailyPosts,
  Deposit,
  deposits,
  follows,
  groups,
  InsertDailyPost,
  InsertDeposit,
  InsertNotification,
  InsertUser,
  kycVerifications,
  membershipPlans,
  memberships,
  messages,
  notifications,
  ownerBindings,
  postComments,
  postLikes,
  profiles,
  rolePermissions,
  securityEvents,
  socialPosts,
  supportTickets,
  users,
  walletAccounts,
  walletTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields)
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  const binding = (
    await db
      .select()
      .from(ownerBindings)
      .where(eq(ownerBindings.id, 1))
      .limit(1)
  )[0];
  const providerMatches =
    (user.loginMethod ?? "").toLowerCase() === ENV.ownerProvider;
  const emailMatches =
    Boolean(ENV.ownerEmail) &&
    (user.email ?? "").trim().toLowerCase() === ENV.ownerEmail;
  const ownerVerified = binding
    ? binding.ownerOpenId === user.openId &&
      binding.ownerEmail === ENV.ownerEmail &&
      binding.provider === ENV.ownerProvider
    : emailMatches && providerMatches;
  if (ownerVerified) {
    if (!binding)
      await db
        .insert(ownerBindings)
        .values({
          id: 1,
          ownerOpenId: user.openId,
          ownerEmail: ENV.ownerEmail,
          provider: ENV.ownerProvider,
        });
    values.role = "admin";
    values.adminRole = "super_admin";
    values.isOwner = true;
    updateSet.role = "admin";
    updateSet.adminRole = "super_admin";
    updateSet.isOwner = true;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getPublishedDailyPosts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dailyPosts)
    .where(
      and(eq(dailyPosts.status, "published"), eq(dailyPosts.visibility, "free"))
    )
    .orderBy(desc(dailyPosts.postDate), desc(dailyPosts.updatedAt));
}
export async function getAdminDailyPosts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dailyPosts)
    .orderBy(desc(dailyPosts.postDate), desc(dailyPosts.updatedAt));
}
export async function saveDailyPost(input: InsertDailyPost & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { id, ...values } = input;
  if (id) {
    await db.update(dailyPosts).set(values).where(eq(dailyPosts.id, id));
    const updated = await db
      .select()
      .from(dailyPosts)
      .where(eq(dailyPosts.id, id))
      .limit(1);
    return updated[0];
  }
  const result = await db.insert(dailyPosts).values(values);
  const created = await db
    .select()
    .from(dailyPosts)
    .where(eq(dailyPosts.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function deleteDailyPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(dailyPosts).where(eq(dailyPosts.id, id));
  return { success: true as const };
}

export async function createDeposit(input: InsertDeposit) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(deposits).values(input);
  const created = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function getDepositByTransactionId(transactionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(deposits)
    .where(eq(deposits.transactionId, transactionId))
    .limit(1);
  return result[0];
}
export async function getUserDeposits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, userId))
    .orderBy(desc(deposits.createdAt));
}
export async function getAdminDeposits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deposits).orderBy(desc(deposits.createdAt));
}
export async function reviewDeposit(
  id: number,
  status: Deposit["status"],
  reviewNote: string | null,
  reviewedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(deposits)
    .set({ status, reviewNote, reviewedBy, reviewedAt: new Date() })
    .where(eq(deposits.id, id));
  const updated = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, id))
    .limit(1);
  return updated[0];
}
export async function createNotification(input: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(notifications).values(input);
  const created = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}
export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return { success: true as const };
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return result[0];
}
export async function saveProfile(
  userId: number,
  input: {
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    privacy?: "public" | "members" | "private";
    avatarUrl?: string;
    coverUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getProfile(userId);
  if (existing) {
    await db.update(profiles).set(input).where(eq(profiles.userId, userId));
  } else {
    await db.insert(profiles).values({ userId, ...input });
  }
  return getProfile(userId);
}
export async function searchProfiles(query: string) {
  const db = await getDb();
  if (!db) return [];
  const term = `%${query}%`;
  return db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.privacy, "public"),
        or(like(profiles.username, term), like(profiles.bio, term))
      )
    )
    .limit(20);
}
export async function getSocialFeed() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.visibility, "public"))
    .orderBy(desc(socialPosts.createdAt))
    .limit(30);
}
export async function createSocialPost(input: {
  authorId: number;
  body: string;
  kind: "text" | "photo" | "video";
  visibility: "public" | "members" | "group";
  mediaUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(socialPosts).values(input);
  const created = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function likeSocialPost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    return { liked: false };
  }
  await db.insert(postLikes).values({ postId, userId });
  return { liked: true };
}
export async function commentOnPost(input: {
  postId: number;
  userId: number;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(postComments).values(input);
  const created = await db
    .select()
    .from(postComments)
    .where(eq(postComments.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (followerId === followingId) throw new Error("You cannot follow yourself");
  const existing = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    )
    .limit(1);
  if (existing[0]) return existing[0];
  await db
    .insert(follows)
    .values({ followerId, followingId, status: "following" });
  return { followerId, followingId, status: "following" as const };
}
export async function getGroups() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(groups)
    .where(eq(groups.privacy, "public"))
    .orderBy(desc(groups.createdAt))
    .limit(30);
}
export async function createGroup(input: {
  name: string;
  slug: string;
  description?: string;
  privacy: "public" | "private";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(groups).values(input);
  const created = await db
    .select()
    .from(groups)
    .where(eq(groups.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function getMessagesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt))
    .limit(50);
}
export async function sendMessage(input: {
  senderId: number;
  receiverId: number;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(messages).values(input);
  const created = await db
    .select()
    .from(messages)
    .where(eq(messages.id, result[0].insertId))
    .limit(1);
  return created[0];
}

export async function getMembershipPlans() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.isActive, true));
}
export async function getMembershipForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt));
}
export async function getWalletForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(walletAccounts)
    .where(eq(walletAccounts.userId, userId))
    .limit(1);
  if (result[0]) return result[0];
  await db
    .insert(walletAccounts)
    .values({ userId, balanceCents: 0, currency: "BDT", status: "active" });
  const created = await db
    .select()
    .from(walletAccounts)
    .where(eq(walletAccounts.userId, userId))
    .limit(1);
  return created[0];
}
export async function getWalletTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(50);
}
export async function createNonGamblingWithdrawal(input: {
  userId: number;
  amountCents: number;
  reference: string;
  note: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const wallet = await getWalletForUser(input.userId);
  if (!wallet) throw new Error("Wallet account is not ready");
  if (input.amountCents <= 0) throw new Error("Amount must be positive");
  const result = await db
    .insert(walletTransactions)
    .values({
      walletAccountId: wallet.id,
      userId: input.userId,
      type: "withdrawal",
      purpose: "non_gambling",
      amountCents: input.amountCents,
      reference: input.reference,
      note: input.note,
      status: "pending",
    });
  const created = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, result[0].insertId))
    .limit(1);
  return created[0];
}

export async function createSupportTicket(input: {
  userId: number;
  category: string;
  subject: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .insert(supportTickets)
    .values({ ...input, priority: input.priority ?? "normal" });
  const created = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, result[0].insertId))
    .limit(1);
  return created[0];
}
export async function getUserSupportTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}
export async function getKyc(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .limit(1);
  return result[0];
}
export async function setTwoFactor(userId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ twoFactorEnabled: enabled })
    .where(eq(users.id, userId));
  return { enabled };
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db)
    return {
      users: 0,
      posts: 0,
      groups: 0,
      pendingDeposits: 0,
      openTickets: 0,
      pendingKyc: 0,
    };
  const [
    userCount,
    postCount,
    groupCount,
    depositCount,
    ticketCount,
    kycCount,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(socialPosts),
    db.select({ value: count() }).from(groups),
    db
      .select({ value: count() })
      .from(deposits)
      .where(eq(deposits.status, "pending")),
    db
      .select({ value: count() })
      .from(supportTickets)
      .where(
        or(
          eq(supportTickets.status, "open"),
          eq(supportTickets.status, "in_progress")
        )
      ),
    db
      .select({ value: count() })
      .from(kycVerifications)
      .where(eq(kycVerifications.status, "pending")),
  ]);
  return {
    users: userCount[0]?.value ?? 0,
    posts: postCount[0]?.value ?? 0,
    groups: groupCount[0]?.value ?? 0,
    pendingDeposits: depositCount[0]?.value ?? 0,
    openTickets: ticketCount[0]?.value ?? 0,
    pendingKyc: kycCount[0]?.value ?? 0,
  };
}
export async function getAdminRoles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminRoles);
}
export async function getRolePermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rolePermissions);
}
export async function getSecurityEvents() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(securityEvents)
    .orderBy(desc(securityEvents.createdAt))
    .limit(100);
}
export async function getAuditLogs() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(100);
}
export async function writeAuditLog(input: {
  actorId: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminAuditLogs).values(input);
}

export async function getOwnerBinding() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(ownerBindings)
    .where(eq(ownerBindings.id, 1))
    .limit(1);
  return result[0];
}
export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      adminRole: users.adminRole,
      isOwner: users.isOwner,
      accountStatus: users.accountStatus,
      sessionVersion: users.sessionVersion,
      twoFactorEnabled: users.twoFactorEnabled,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(desc(users.createdAt));
}
export async function promoteUserToAdmin(
  targetUserId: number,
  adminRole:
    | "super_admin"
    | "finance_admin"
    | "content_admin"
    | "support_admin"
    | "moderator"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = (
    await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  )[0];
  if (!target || target.isOwner)
    throw new Error("Owner identity cannot be changed");
  await db
    .update(users)
    .set({
      role: "admin",
      adminRole,
      accountStatus: "active",
      sessionVersion: target.sessionVersion + 1,
    })
    .where(eq(users.id, targetUserId));
  return (
    await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  )[0];
}
export async function updateAdminRole(
  targetUserId: number,
  adminRole:
    | "super_admin"
    | "finance_admin"
    | "content_admin"
    | "support_admin"
    | "moderator"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = (
    await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  )[0];
  if (!target || target.isOwner || target.role !== "admin")
    throw new Error("Owner or non-admin identity cannot be changed");
  await db
    .update(users)
    .set({ adminRole, sessionVersion: target.sessionVersion + 1 })
    .where(eq(users.id, targetUserId));
  return (
    await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  )[0];
}
export async function disableAdmin(
  targetUserId: number,
  status: "disabled" | "removed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = (
    await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  )[0];
  if (!target || target.isOwner || target.role !== "admin")
    throw new Error("Owner identity cannot be disabled or removed");
  await db
    .update(users)
    .set({
      accountStatus: status,
      role: "user",
      adminRole: null,
      sessionVersion: target.sessionVersion + 1,
    })
    .where(eq(users.id, targetUserId));
  return {
    success: true as const,
    revokedSessionVersion: target.sessionVersion + 1,
  };
}
export async function markOwnerMfaVerified(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ twoFactorEnabled: true, mfaVerifiedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.isOwner, true)));
  return { success: true as const };
}
export async function getOwnerSecurityStatus(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      isOwner: users.isOwner,
      twoFactorEnabled: users.twoFactorEnabled,
      mfaVerifiedAt: users.mfaVerifiedAt,
      accountStatus: users.accountStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}
