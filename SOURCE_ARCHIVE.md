# 4D Results — Source-complete archive

This archive contains the complete portable source needed for another developer or AI builder to continue the project.

## Main folders

| Area               | Location                                                                                                   | Contents                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Backend/server     | `server/`                                                                                                  | Express entrypoint, tRPC routers, database helpers, auth middleware, storage and notifications |
| Frontend/client    | `client/`                                                                                                  | React pages, components, public config and responsive UI                                       |
| Content management | `client/src/pages/AdminPosts.tsx`, `client/src/components/DailyPostFeed.tsx`                               | Admin daily game post editor, publishing, image-backed prediction feed and social sharing      |
| Database/schema    | `drizzle/`                                                                                                 | Drizzle schema, migrations and generated SQL                                                   |
| Shared config      | `shared/`                                                                                                  | Brand/social/payment configuration and shared types/constants                                  |
| Android wrapper    | `android-wrapper/`                                                                                         | Capacitor configuration, package ID, production URL, icon source and Android build guide       |
| Tests              | `server/*.test.ts`                                                                                         | Auth, daily posts, deposits, RBAC/platform boundaries and social configuration tests           |
| Project config     | `package.json`, `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, `components.json`, `template.json` | Build, TypeScript, Vite, database and UI configuration                                         |
| Handoff            | `PROJECT_HANDOFF.md`, `SOURCE_ARCHIVE.md`                                                                  | Independent continuation and archive map                                                       |

## Security exclusions

The public source ZIP intentionally excludes `node_modules`, build output, `.git`, internal `.manus` runtime metadata, logs, environment files, passwords, API keys, session data and keystores. This is required for safe public sharing. Dependencies can be restored with `pnpm install`, and platform environment values are injected during deployment.

## Current verified contact configuration

- Facebook: `https://www.facebook.com/malaysiasingapore4d6d/`
- WhatsApp: `https://wa.me/8801324360629`
- Telegram: `https://t.me/+8801706559143`
- Instagram: `https://www.instagram.com/4d6dmktshe/`

## Rebuild

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

For the Android wrapper, follow `android-wrapper/README.md`. A signed APK requires Android Studio, Android SDK, Gradle/JDK and a private release keystore on the developer's machine.
