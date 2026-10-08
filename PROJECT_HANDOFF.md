# 4D Results Website — Project Handoff

## Current status

This project is the first working phase of the English-language **4D Results | Malaysia & Singapore** website. The UI uses a premium black, gold and red theme. The current brand name is a placeholder and can be replaced centrally in `shared/siteConfig.ts`.

The project uses React 19, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL/TiDB, and Manus OAuth authentication. It is initialized as a full-stack WebDev project under `web-db-user`.

## Included in this phase

- Responsive public landing page.
- Malaysia & Singapore results coverage cards for Sports Toto, Magnum, Da Ma Cai, Singapore Pools, STC 4D and 88 Group.
- Free Prediction and VIP Prediction sections.
- VIP Membership messaging with deposit review and a separate compliance-only non-gambling withdrawal request flow.
- Existing login/sign-up entry points through Manus OAuth.
- Public daily-post feed, grouped by game through `daily_posts.gameKey` and `daily_posts.gameName`.
- Free/VIP visibility controls for daily posts.
- Draft/published status controls.
- Admin-only Daily game posts editor at `/admin/posts`.
- Create, edit, publish/unpublish and delete operations for daily posts.
- Share buttons for Facebook, X/Twitter, Instagram and WhatsApp on published posts. Instagram uses a copy-text flow because Instagram does not provide a general web share URL for arbitrary posts.
- Telegram helpline, WhatsApp, Facebook and Instagram buttons.
- Admin access protection through the existing `adminProcedure` role check.
- Security-focused test that verifies non-admin users cannot access the admin post queue.

## Important user-provided social details

- Facebook labels: `Probashi Voice Malaysia Singapore` and `fb4D 1st Price Calculation`.
- Facebook page: `https://www.facebook.com/malaysiasingapore4d6d/`
- Facebook share link: `https://www.facebook.com/share/19cy7B811n/`
- Instagram: `@mdismail9015`
- Telegram helpline: `+8801706559143`
- WhatsApp: `+8801324360629`

The canonical links are stored in `shared/siteConfig.ts`. Replace them there instead of duplicating URLs in components.

## Key files

- `client/src/pages/Home.tsx` — public landing page.
- `client/src/components/DailyPostFeed.tsx` — public daily post feed and share actions.
- `client/src/pages/AdminPosts.tsx` — admin editor for daily posts.
- `client/src/components/DashboardLayout.tsx` — authenticated admin shell.
- `client/src/App.tsx` — route registration, including `/admin/posts`.
- `client/src/index.css` — theme and component styles.
- `drizzle/schema.ts` — `users` and `daily_posts` tables.
- `server/db.ts` — database helpers for users and daily posts.
- `server/routers.ts` — public and admin tRPC procedures.
- `server/dailyPosts.test.ts` — daily-post access-control tests.
- `drizzle/0001_tough_psynapse.sql` — migration that creates `daily_posts`.

## How the daily post feature works

1. An approved admin signs in.
2. The admin opens **Admin posts** from the public header or `/admin/posts`.
3. The admin selects a game, post date, title, content, visibility (`free` or `vip`) and status (`draft` or `published`).
4. Published posts appear in the public `Daily game posts` section.
5. Each public post exposes Facebook, X/Twitter, Instagram and WhatsApp share actions.
6. Editing updates the same post row. Deleting requires a browser confirmation.

The server is authoritative: all list, save and delete mutations use `adminProcedure`. Do not move admin checks to the browser only.

## Commands

From the project directory:

```bash
pnpm check
pnpm test
pnpm build
pnpm drizzle-kit generate
```

The last successful verification in this phase was:

- TypeScript: passed.
- Unit tests: 4 passed across 3 test files.
- Production build: passed.
- Database migration: applied successfully and creates only `daily_posts`.

## Information still required from the owner

Before implementing the production membership/payment flow, obtain and document:

1. Final brand name, logo and tagline.
2. Approved payment provider, supported currency, VIP plans/prices and deposit confirmation rules.
3. Whether payment is online checkout, manual bank/merchant transfer, or another compliant method.
4. Exact VIP access duration and renewal/expiry behavior.
5. Whether daily posts should support images, attachments, scheduled publishing or pinned posts.
6. Final legal text: Terms, Privacy Policy, age restriction and responsible-use statement.

No payment credentials or secrets are stored in this project. Do not commit `.env` files or API keys.

## Recommended next phase

- Finalize provider-specific email/password and Gmail linking only through the secure authentication provider; never store passwords in the app.
- Add VIP entitlement records and a secure, server-side payment verification workflow after the payment provider is confirmed.
- Add post scheduling, pinned posts, image upload through managed storage, and a member-only post query that enforces VIP access on the server.
- Add CSRF, rate limiting, audit logging and security headers at production hardening time.

## Payment and deposit-review phase

The payment flow is intentionally **deposit-only**. The configured beneficiary is `MD EJAN CHOWDHURY`. The currently configured methods are bKash `01863211541`, Nagad `01863211541`, and MyBank account `514012122490`. These values are centralized in `shared/paymentConfig.ts` and should be replaced there if the owner changes them.

A signed-in member can open the VIP deposit screen, select a payment method, enter an amount and transaction ID, upload a PNG/JPEG/WebP screenshot up to 5 MB, and submit the request. The server stores the screenshot through the managed storage helper, stores only its storage key and URL in the database, and creates a `pending` deposit record. The deposit cannot be treated as VIP activation until an admin reviews it.

The admin deposit review screen lists the beneficiary, selected account, amount, transaction ID, screenshot link, user note and current status. The admin can approve or reject with an optional review note. Every review creates an in-app notification for the submitting user. New submissions also attempt to send an owner notification through the built-in notification service. Gambling-related withdrawals are not present anywhere. The final platform separately models only lawful non-gambling withdrawal requests with KYC/compliance review.

The server validates the payment account against `shared/paymentConfig.ts`, rejects forged screenshot paths, requires the authenticated user’s own storage prefix, and prevents duplicate transaction IDs with a database unique constraint. Admin review uses `adminProcedure`; member deposit and notification queries use `protectedProcedure`. The upload endpoint is `/api/upload/payment-screenshot`, accepts a JSON data URL, and performs MIME, filename and 5 MB size validation before calling `storagePut`.

The main files for this phase are `client/src/pages/Deposit.tsx`, `client/src/pages/AdminDeposits.tsx`, `client/src/components/NotificationInbox.tsx`, `server/_core/index.ts`, `shared/paymentConfig.ts`, the `deposits` and `notifications` tables in `drizzle/schema.ts`, and the `deposits` and `notifications` routers in `server/routers.ts`.

Before production use, confirm the payment provider/account ownership, legal and regulatory requirements for the jurisdiction, VIP entitlement duration after approval, refund/chargeback policy, notification fallback channel, and whether a real payment gateway/webhook should replace manual review. Do not put bank credentials, API keys, or secrets into the repository.

## Latest auth and banner update

Dedicated routes now exist for `/login`, `/signup`, and `/forgot-password`. These screens intentionally route to the connected secure authentication provider instead of collecting a password in this website UI. The main header now exposes visible Log in and Sign up links. Forgot password opens the provider recovery flow.

The supplied wide banner image is uploaded to managed storage at `/manus-storage/hk-pools-feature-banner_eb02e858.png` and is rendered as the final feature block immediately above the footer on the public home page. The original source was kept outside the project in `/home/ubuntu/webdev-static-assets/hk-pools-feature-banner.png`.

## Final platform expansion

The project now includes a complete member portal at `/member` and an admin command center at `/admin`. The member portal includes profile editing with privacy, profile photo/cover-ready storage fields, public social posts, likes, comments entry, follow/search, groups, messenger, notifications, membership plans and history, account balance, transaction history, deposit/VIP review entry, compliant non-gambling withdrawal request, support tickets, provider recovery and 2FA-ready security controls.

The database now contains modular tables for profiles, follows, social posts, likes, comments, groups, group members, messages, membership plans, memberships, wallet accounts, wallet transactions, deposits, notifications, support tickets, KYC, admin roles, role permissions, admin user roles, security events, audit logs and website settings. Membership plans are seeded as Free, Silver, Gold and VIP. Admin roles are seeded as Super Admin, Finance Admin, Content Admin, Support Admin and Moderator with scoped permissions.

The admin command center presents all requested operational modules: Dashboard, Users, Profiles, Posts, Comments, Groups, Messages, Membership, Payments, Wallet/Accounts, Withdrawals, Transactions, Promotions, Notifications, Reports, Support Tickets, KYC/Verification, Admin Users, Roles & Permissions, Security Logs, Audit Logs, Website Settings, SEO Settings, Backup and System Logs. Existing post and deposit review pages remain available from the admin shell.

### Financial and compliance boundary

The wallet ledger separates `membership` activity from `non_gambling` activity. The withdrawal API accepts only the literal `non_gambling` purpose and requires a lawful purpose note; KYC and admin compliance review are represented in the schema. The platform does not implement betting, winnings, prize or gambling-related withdrawals. Payment credentials remain centralized in `shared/paymentConfig.ts`; no secret or password is stored in the repository.

### Gmail and account security

The owner-provided Gmail address `dxismailhossen4@gmail.com` is treated as the intended account identity for the connected authentication provider, but it is not hard-coded into the project. The owner must use the secure provider login screen to authenticate with Gmail. Passwords must never be sent in chat, committed to code, or stored in this project. Forgot-password recovery continues through the provider. The site has a 2FA-ready user setting and security/audit tables for the next provider-specific verification step.

### Independent continuation

A developer or AI builder can continue from the database schema, generated migration `drizzle/0004_spicy_mimic.sql`, `server/db.ts`, `server/routers.ts`, `client/src/pages/MemberPortal.tsx`, `client/src/pages/AdminControlCenter.tsx` and `PROJECT_HANDOFF.md`. Before production, connect a compliant payment provider, complete actual media uploads for profile photo/cover and post media, implement provider-specific 2FA challenge delivery, complete KYC document storage/review, add rate limiting/CSRF/security headers, confirm legal terms/privacy/age/responsible-use text, and perform a jurisdiction-specific compliance review.

### Latest verification

TypeScript check passed. Unit tests passed: 11 tests across 5 test files. Production build passed. Visual screenshots verified the public landing page, authenticated member overview, full admin module matrix and login screen. The public preview retains the supplied bottom banner and the original social/contact details.

## Published prediction update — September 25, 2026

A public `free` daily post was published for **Grand Dragon & 9 Lotto** with post date `2026-09-25`, title **Tomorrow Prediction — Grand Dragon & 9 Lotto**, numbers `5410 | 2450 | 8154`, the supplied prediction image at `/manus-storage/grand-dragon-9lotto-2026-09-25_65b19ef6.png`, and an informational-only disclaimer. The `daily_posts` table now has a nullable `mediaUrl` field via migration `drizzle/0005_first_dreaming_celestial.sql`; the public feed renders the image and the admin editor accepts a managed-storage image URL.

## Android delivery note

The current deliverable is a responsive full-stack website and can be opened on Android browsers. An APK cannot be installed directly from this chat or silently installed onto a phone. To distribute an APK, create a separate Android wrapper build around the published web app (for example, a Capacitor/WebView or Expo app), sign it with an Android keystore, then provide the APK for the owner to download and install manually. Do not send Gmail passwords or keystore secrets in chat.

## Instagram contact update

The public Instagram contact is now **@4d6dmktshe** with profile link `https://www.instagram.com/4d6dmktshe/`. The shared configuration, public social/contact section and regression test have been updated; all 11 tests and the production build pass.

## Android wrapper configuration

A ready-to-build `android-wrapper/` folder now contains `capacitor.config.ts`, `README.md` and the black/gold/red `icon.svg`. Provisional app identity is **4D Results** with package ID **com.fourdresults.app** and production URL `https://4dresults-dvhcpz7b.manus.space`. Android SDK, Gradle and `adb` are not installed in this sandbox, so a signed APK cannot be compiled or installed here; the README provides the exact Android Studio/Capacitor commands and warns that keystore credentials must remain private.

## Contact verification

Final HTTP checks returned 200 for the supplied Facebook and Telegram URLs, and WhatsApp returned 200 after redirecting to its official send endpoint. The verified values are stored in `shared/siteConfig.ts`.

## Final privacy and API hardening

The server now sends security headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict referrer policy, restricted permissions policy, disabled `X-Powered-By`, and `Cache-Control: no-store` for API responses. Public queries are limited to free published daily posts, public social posts, public profiles and public groups. VIP posts, member-only posts, private profiles/groups, deposits, wallet records, memberships, notifications, messages and admin data require the appropriate authenticated or role-protected procedure. Anonymous membership and wallet access tests now pass.

The website does not serve the source tree, backend files or configuration files as public assets. The source-complete ZIP is a private handoff artifact only; do not upload it to `client/public/` or expose it through the deployed website. The ZIP excludes secrets, `.env`, passwords, session data, keystores, internal runtime metadata, `node_modules` and build output.

## Owner/Admin security implementation

The owner-security phase adds `owner_bindings` as a singleton immutable identity record and extends users with `isOwner`, `accountStatus`, `sessionVersion`, `mfaSecret` and `mfaVerifiedAt`. OAuth promotion is now fail-closed: a Google login becomes Owner only when the server-side `OWNER_OPEN_ID`, exact normalized `OWNER_EMAIL` and `OWNER_PROVIDER=google` all match. Email alone cannot claim ownership, and the binding cannot be replaced through admin/user procedures.

Owner-only API middleware requires the immutable owner flag, active account and verified MFA. Only Owner can list admins, create/promote an admin, assign roles, disable/remove admins, view owner audit logs and write owner audit events. Ordinary admins keep their scoped role permissions but cannot create Super Admins, change Owner status, transfer ownership or access owner-only management.

Admin disable/remove increments `sessionVersion`, changes account status and removes admin role; authenticated requests compare the signed token version with the database and reject revoked sessions. Security tests cover ordinary-admin denial, unverified-owner denial, anonymous membership/wallet denial and non-gambling withdrawal boundaries. `OWNER_SECURITY_CHECKLIST.md` contains the exact deployment secrets and manual verification sequence.
