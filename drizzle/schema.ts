import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  adminRole: mysqlEnum("adminRole", [
    "super_admin",
    "finance_admin",
    "content_admin",
    "support_admin",
    "moderator",
  ]),
  isOwner: boolean("isOwner").default(false).notNull(),
  accountStatus: mysqlEnum("accountStatus", ["active", "disabled", "removed"])
    .default("active")
    .notNull(),
  sessionVersion: int("sessionVersion").default(1).notNull(),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  mfaSecret: varchar("mfaSecret", { length: 128 }),
  mfaVerifiedAt: timestamp("mfaVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Singleton identity binding. It is created once from server-side owner env values and never updated by user/admin procedures. */
export const ownerBindings = mysqlTable("owner_bindings", {
  id: int("id").primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull().unique(),
  ownerEmail: varchar("ownerEmail", { length: 320 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull().default("google"),
  lockedAt: timestamp("lockedAt").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  bio: text("bio"),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  coverUrl: varchar("coverUrl", { length: 500 }),
  location: varchar("location", { length: 120 }),
  website: varchar("website", { length: 255 }),
  privacy: mysqlEnum("privacy", ["public", "members", "private"])
    .default("public")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const follows = mysqlTable(
  "follows",
  {
    id: int("id").autoincrement().primaryKey(),
    followerId: int("followerId").notNull(),
    followingId: int("followingId").notNull(),
    status: mysqlEnum("status", ["following", "pending", "blocked"])
      .default("following")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pair: uniqueIndex("follows_pair_unique").on(
      table.followerId,
      table.followingId
    ),
  })
);

export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  kind: mysqlEnum("kind", ["text", "photo", "video"]).default("text").notNull(),
  body: text("body").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }),
  visibility: mysqlEnum("visibility", ["public", "members", "group"])
    .default("public")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const postLikes = mysqlTable(
  "post_likes",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    userId: int("userId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    postUser: uniqueIndex("post_likes_post_user_unique").on(
      table.postId,
      table.userId
    ),
  })
);

export const postComments = mysqlTable("post_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 500 }),
  privacy: mysqlEnum("privacy", ["public", "private"])
    .default("public")
    .notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupMembers = mysqlTable(
  "group_members",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    userId: int("userId").notNull(),
    memberRole: mysqlEnum("memberRole", ["owner", "moderator", "member"])
      .default("member")
      .notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => ({
    groupUser: uniqueIndex("group_members_group_user_unique").on(
      table.groupId,
      table.userId
    ),
  })
);

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  body: text("body").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const membershipPlans = mysqlTable("membership_plans", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  priceCents: int("priceCents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("BDT"),
  benefits: text("benefits").notNull(),
  storageMb: int("storageMb").notNull().default(100),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "expired", "cancelled"])
    .default("pending")
    .notNull(),
  startedAt: timestamp("startedAt"),
  expiresAt: timestamp("expiresAt"),
  autoRenew: boolean("autoRenew").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const walletAccounts = mysqlTable("wallet_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceCents: int("balanceCents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("BDT"),
  status: mysqlEnum("status", ["active", "frozen", "closed"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  walletAccountId: int("walletAccountId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "deposit",
    "withdrawal",
    "membership_payment",
    "refund",
    "adjustment",
  ]).notNull(),
  purpose: mysqlEnum("purpose", ["membership", "non_gambling"]).notNull(),
  amountCents: int("amountCents").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "rejected"])
    .default("pending")
    .notNull(),
  reference: varchar("reference", { length: 180 }).notNull(),
  note: text("note"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deposits = mysqlTable(
  "deposits",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    beneficiaryName: varchar("beneficiaryName", { length: 160 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 40 }).notNull(),
    accountReference: varchar("accountReference", { length: 80 }).notNull(),
    amount: varchar("amount", { length: 32 }).notNull(),
    transactionId: varchar("transactionId", { length: 160 }).notNull(),
    screenshotKey: varchar("screenshotKey", { length: 255 }).notNull(),
    screenshotUrl: varchar("screenshotUrl", { length: 500 }).notNull(),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    reviewNote: text("reviewNote"),
    reviewedBy: int("reviewedBy"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    transactionIdUnique: uniqueIndex("deposits_transaction_id_unique").on(
      table.transactionId
    ),
  })
);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 180 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"])
    .default("open")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"])
    .default("normal")
    .notNull(),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const kycVerifications = mysqlTable("kyc_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "not_started",
    "pending",
    "verified",
    "rejected",
  ])
    .default("not_started")
    .notNull(),
  documentKey: varchar("documentKey", { length: 255 }),
  note: text("note"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const adminRoles = mysqlTable("admin_roles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    roleId: int("roleId").notNull(),
    permission: varchar("permission", { length: 100 }).notNull(),
  },
  table => ({
    rolePermission: uniqueIndex("role_permissions_role_permission_unique").on(
      table.roleId,
      table.permission
    ),
  })
);

export const adminUserRoles = mysqlTable(
  "admin_user_roles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    roleId: int("roleId").notNull(),
  },
  table => ({
    userRole: uniqueIndex("admin_user_roles_user_role_unique").on(
      table.userId,
      table.roleId
    ),
  })
);

export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const websiteSettings = mysqlTable("website_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type WalletAccount = typeof walletAccounts.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertDeposit = typeof deposits.$inferInsert;
export type Deposit = typeof deposits.$inferSelect;
export type DailyPost = typeof dailyPosts.$inferSelect;
export type InsertDailyPost = typeof dailyPosts.$inferInsert;

export const dailyPosts = mysqlTable("daily_posts", {
  id: int("id").autoincrement().primaryKey(),
  gameKey: varchar("gameKey", { length: 64 }).notNull(),
  gameName: varchar("gameName", { length: 120 }).notNull(),
  postDate: varchar("postDate", { length: 10 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }),
  visibility: mysqlEnum("visibility", ["free", "vip"])
    .default("free")
    .notNull(),
  status: mysqlEnum("status", ["draft", "published"])
    .default("draft")
    .notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
