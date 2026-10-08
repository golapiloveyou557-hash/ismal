import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

const adminRoles = [
  "super_admin",
  "finance_admin",
  "content_admin",
  "support_admin",
  "moderator",
] as const;

type AdminRole = (typeof adminRoles)[number];

export default function AdminControlCenter() {
  const { user, loading } = useAuth();
  const [mfaCode, setMfaCode] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("support_admin");
  const ownerStatus = trpc.admin.ownerStatus.useQuery(undefined, {
    enabled: Boolean(user?.role === "admin"),
  });
  const isOwnerVerified = Boolean(
    user?.isOwner && ownerStatus.data?.twoFactorEnabled
  );
  const adminUsers = trpc.admin.users.useQuery(undefined, {
    enabled: isOwnerVerified,
  });
  const auditLogs = trpc.admin.auditLogs.useQuery(undefined, {
    enabled: isOwnerVerified,
  });
  const verifyMfa = trpc.admin.verifyMfa.useMutation({
    onSuccess: () => {
      ownerStatus.refetch();
    },
  });
  const createAdmin = trpc.admin.createAdmin.useMutation({
    onSuccess: () => {
      adminUsers.refetch();
      auditLogs.refetch();
      setNewUserId("");
    },
  });
  const updateRole = trpc.admin.updateAdminRole.useMutation({
    onSuccess: () => {
      adminUsers.refetch();
      auditLogs.refetch();
    },
  });
  const disableAdmin = trpc.admin.disableAdmin.useMutation({
    onSuccess: () => {
      adminUsers.refetch();
      auditLogs.refetch();
    },
  });

  if (loading) return <div className="min-h-screen bg-[#070707]" />;
  if (!user || user.role !== "admin")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6 text-center text-white">
        <div>
          <h1 className="font-display text-4xl font-bold">
            Admin access required
          </h1>
          <p className="mt-3 text-[#a79f93]">
            This control center is restricted to approved administrators.
          </p>
          <Link href="/login" className="button-red mt-6">
            Log in
          </Link>
        </div>
      </div>
    );

  const submitMfa = (event: React.FormEvent) => {
    event.preventDefault();
    verifyMfa.mutate({ code: mfaCode });
  };
  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const id = Number(newUserId);
    if (Number.isInteger(id) && id > 0)
      createAdmin.mutate({ userId: id, adminRole: newRole });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#070707] px-4 py-5 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Owner security command center</div>
              <h1 className="font-display mt-2 text-4xl font-bold">
                Admin management.
              </h1>
              <p className="mt-3 max-w-3xl text-[#a79f93]">
                Owner identity, admin roles, session revocation and audit
                history are enforced by the backend.
              </p>
            </div>
            <div className="rounded-xl border border-[#f5bf45]/30 bg-[#f5bf45]/10 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[.14em] text-[#cbb17c]">
                Signed in role
              </div>
              <div className="mt-1 font-bold text-[#f5bf45]">
                {user.isOwner ? "Immutable Owner" : (user.adminRole ?? "Admin")}
              </div>
            </div>
          </div>

          {user.isOwner && !ownerStatus.data?.twoFactorEnabled && (
            <section className="portal-card mt-8 border-[#ef3340]/50">
              <div className="eyebrow text-[#ff9d9d]">
                Owner verification required
              </div>
              <h2 className="mt-2 text-2xl">
                Verify Google owner account with MFA.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c8c0b5]">
                Gmail alone never grants Owner status. The server checks the
                immutable owner OpenID/email binding and requires the configured
                authenticator code.
              </p>
              <form
                onSubmit={submitMfa}
                className="mt-5 flex max-w-xl flex-wrap gap-3"
              >
                <input
                  className="field-input flex-1"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="6-digit authenticator code"
                  value={mfaCode}
                  onChange={event => setMfaCode(event.target.value)}
                />
                <button className="button-red" disabled={verifyMfa.isPending}>
                  {verifyMfa.isPending ? "Verifying…" : "Verify owner"}
                </button>
              </form>
              {verifyMfa.error && (
                <p className="mt-3 text-sm text-[#ff9d9d]">
                  {verifyMfa.error.message}
                </p>
              )}
            </section>
          )}

          {!user.isOwner && (
            <section className="portal-card mt-8 border-[#f5bf45]/30">
              <div className="eyebrow">Administrator mode</div>
              <h2 className="mt-2 text-2xl">
                Owner-only management is locked.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c8c0b5]">
                Your admin permissions can operate only within the assigned
                role. You cannot create admins, change owner identity, access
                owner audit controls or promote yourself.
              </p>
            </section>
          )}

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="portal-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow">Admin/User/Role management</div>
                  <h2 className="mt-2 text-2xl">Current administrators.</h2>
                </div>
                <span className="rounded-full bg-[#f5bf45]/15 px-3 py-1 text-xs font-bold text-[#f5bf45]">
                  {adminUsers.data?.length ?? 0} admins
                </span>
              </div>
              {isOwnerVerified ? (
                <div className="mt-5 space-y-3">
                  {adminUsers.data?.map(admin => (
                    <div
                      key={admin.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {admin.name || "Unnamed account"}{" "}
                            {admin.isOwner && (
                              <span className="ml-2 rounded-full bg-[#f5bf45]/15 px-2 py-1 text-[10px] uppercase tracking-[.12em] text-[#f5bf45]">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-[#8f877c]">
                            ID {admin.id} · {admin.email || "No email"} ·{" "}
                            {admin.accountStatus}
                          </div>
                        </div>
                        {admin.isOwner ? (
                          <span className="text-xs font-bold text-[#8ee3a8]">
                            Immutable / protected
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              className="field-input !w-auto !py-2 text-xs"
                              value={admin.adminRole ?? "support_admin"}
                              onChange={event =>
                                updateRole.mutate({
                                  userId: admin.id,
                                  adminRole: event.target.value as AdminRole,
                                })
                              }
                            >
                              {adminRoles.map(role => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button
                              className="button-ghost !px-3 !py-2 text-xs text-[#ff9d9d]"
                              onClick={() =>
                                disableAdmin.mutate({
                                  userId: admin.id,
                                  status:
                                    admin.accountStatus === "disabled"
                                      ? "removed"
                                      : "disabled",
                                })
                              }
                            >
                              {admin.accountStatus === "disabled"
                                ? "Remove"
                                : "Disable"}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-[#8f877c]">
                        Session version: {admin.sessionVersion} · Last sign-in:{" "}
                        {new Date(admin.lastSignedIn).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {!adminUsers.data?.length && (
                    <p className="text-sm text-[#9f9689]">
                      No administrators found after owner verification.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#9f9689]">
                  Complete owner MFA verification to view and manage
                  administrators.
                </p>
              )}
            </div>

            <div className="space-y-6">
              <section className="portal-card">
                <div className="eyebrow">Create Admin / Super Admin</div>
                <h2 className="mt-2 text-2xl">Grant controlled access.</h2>
                <p className="mt-2 text-sm leading-6 text-[#c8c0b5]">
                  Only the verified immutable Owner can grant a role to an
                  existing signed-in user. The backend rejects owner replacement
                  and self-promotion.
                </p>
                {isOwnerVerified && (
                  <form onSubmit={submitCreate} className="mt-5 space-y-3">
                    <input
                      className="field-input"
                      inputMode="numeric"
                      placeholder="Existing user ID"
                      value={newUserId}
                      onChange={event => setNewUserId(event.target.value)}
                    />
                    <select
                      className="field-input"
                      value={newRole}
                      onChange={event =>
                        setNewRole(event.target.value as AdminRole)
                      }
                    >
                      {adminRoles.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button-red w-full"
                      disabled={createAdmin.isPending}
                    >
                      {createAdmin.isPending ? "Granting…" : "Grant admin role"}
                    </button>
                  </form>
                )}
              </section>
              <section className="portal-card">
                <div className="eyebrow">Security & audit</div>
                <h2 className="mt-2 text-2xl">Owner audit trail.</h2>
                {isOwnerVerified ? (
                  <div className="mt-5 space-y-3">
                    {auditLogs.data?.slice(0, 8).map(log => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-white/10 p-3"
                      >
                        <div className="font-semibold">
                          {log.action} · {log.entityType}
                        </div>
                        <div className="mt-1 text-xs text-[#8f877c]">
                          Actor {log.actorId} ·{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {!auditLogs.data?.length && (
                      <p className="text-sm text-[#9f9689]">
                        No audit entries yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-[#9f9689]">
                    Owner MFA verification is required before audit logs are
                    shown.
                  </p>
                )}
              </section>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm leading-6 text-red-100">
            <strong>Immutable owner boundary:</strong> Owner identity is bound
            server-side to OWNER_OPEN_ID + OWNER_EMAIL + Google provider. Gmail
            login alone cannot claim ownership. Owner cannot be downgraded,
            deleted, replaced or transferred through Admin APIs. Disabling an
            admin increments its session version and immediately revokes
            existing tokens.
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
