# Owner security setup and verification checklist

## Required server-side configuration

Set these values in the deployment secret/environment manager, never in frontend code or a public file:

```text
OWNER_OPEN_ID=<optional existing provider subject; after first enrollment the database owner_bindings record is authoritative>
OWNER_EMAIL=<exact owner Google email>
OWNER_PROVIDER=google
OWNER_MFA_REQUIRED=true
OWNER_MFA_SECRET=<base32 TOTP secret stored as a server secret>
JWT_SECRET=<long random session signing secret>
```

`OWNER_EMAIL` alone is not sufficient. On the selected account's first successful Google login, the backend requires the normalized email and Google provider marker, captures the returned provider OpenID/subject into the singleton `owner_bindings` record, and never replaces it through admin/user procedures. On every later login, the stored provider subject, email and provider must match.

## Required verification sequence

1. Log in using the intended Google account. Confirm the authenticated user shows the expected email and provider.
2. Confirm the backend-created owner binding matches the configured provider subject and email. Do not rely on a frontend label.
3. Open the admin dashboard. Before MFA, owner-only Admin Management and Audit Log queries must be denied.
4. Enter the authenticator code. Confirm owner verification succeeds only with the current six-digit TOTP code.
5. Confirm the Admin Management panel shows the immutable Owner separately from ordinary administrators and reports the current admin count.
6. Create an administrator for an existing user and assign one role. Confirm an audit entry records the actor, action, target and timestamp.
7. Try creating or modifying an admin while logged in as an ordinary admin. The API must return `FORBIDDEN`; hiding a button is not the security control.
8. Try assigning Owner status, changing the Owner role, deleting the Owner, disabling the Owner or transferring ownership through API requests. Every request must fail.
9. Disable a non-owner administrator. Confirm the database session version increments and the old browser/session token can no longer call protected APIs.
10. Remove an administrator. Confirm the account is no longer an admin, the session is revoked, and the audit log records `admin_removed`.
11. Confirm role changes record `admin_role_changed` with actor, target and new role.
12. Confirm normal users cannot update their own `role`, `adminRole`, `isOwner`, `accountStatus`, `sessionVersion` or MFA fields through any public procedure.
13. Confirm `admin.overview`, `admin.users`, `admin.auditLogs`, payment review and security APIs reject anonymous requests.
14. Confirm source-like public URLs return only the app shell, not TypeScript, backend, package, environment or database files.
15. Back up the owner MFA recovery process and deployment secrets separately. Never put MFA secrets, JWT secrets, Google passwords or keystore files in the project ZIP.

## Important operational note

The current application uses the configured OAuth service to identify a Google login (`loginMethod`/provider plus immutable `openId`). A Gmail address by itself never grants Owner status. If the OAuth provider does not return a stable Google subject or provider marker, owner verification must fail closed until the deployment is configured correctly.
