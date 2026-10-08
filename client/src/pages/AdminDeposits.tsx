import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function AdminDeposits() {
  const { user, loading } = useAuth();
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const depositsQuery = trpc.deposits.adminList.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const reviewMutation = trpc.deposits.review.useMutation({
    onSuccess: async () => {
      await utils.deposits.adminList.invalidate();
      await utils.deposits.mine.invalidate();
      toast.success("Deposit review saved and the user was notified.");
    },
    onError: error => toast.error(error.message || "Could not save review."),
  });
  const deposits = depositsQuery.data ?? [];
  const pendingCount = useMemo(
    () => deposits.filter(deposit => deposit.status === "pending").length,
    [deposits]
  );

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#f5bf45]">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!user || user.role !== "admin")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6 text-center text-white">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Admin access required
          </h1>
          <p className="mt-3 text-[#a79f93]">
            Only an approved administrator can review deposits.
          </p>
          <Link href="/" className="button-red mt-6">
            Return home <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    );

  const review = (id: number, status: "approved" | "rejected") => {
    reviewMutation.mutate({
      id,
      status,
      reviewNote: reviewNotes[id] || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#070707] px-4 py-5 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5bf45]">
                Finance review
              </div>
              <h1 className="font-display mt-2 text-3xl font-bold">
                Deposit submissions
              </h1>
              <p className="mt-2 text-[#a79f93]">
                Review transaction IDs and screenshots before changing any
                request status.
              </p>
            </div>
            <Link href="/admin/posts" className="button-outline">
              <ArrowLeft size={16} /> Daily posts
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#60491f] bg-[#121110] p-5">
              <div className="text-sm text-[#a79f93]">Total submissions</div>
              <div className="mt-2 font-display text-3xl font-bold text-[#f5bf45]">
                {deposits.length}
              </div>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-5">
              <div className="text-sm text-[#a79f93]">Waiting for review</div>
              <div className="mt-2 font-display text-3xl font-bold text-yellow-200">
                {pendingCount}
              </div>
            </div>
            <div className="rounded-xl border border-[#60491f] bg-[#121110] p-5">
              <div className="text-sm text-[#a79f93]">Withdrawals</div>
              <div className="mt-2 font-display text-lg font-bold text-white">
                Disabled
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-5">
            {depositsQuery.isLoading && (
              <div className="rounded-xl border border-[#60491f] p-6 text-[#a79f93]">
                Loading deposit submissions…
              </div>
            )}
            {!depositsQuery.isLoading && deposits.length === 0 && (
              <div className="rounded-xl border border-[#60491f] bg-[#121110] p-8 text-[#a79f93]">
                No deposit submissions yet.
              </div>
            )}
            {deposits.map(deposit => (
              <article
                key={deposit.id}
                className="rounded-2xl border border-[#60491f] bg-[#121110] p-5 md:p-7"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="eyebrow">
                        <CreditCard size={14} /> Deposit #{deposit.id}
                      </span>
                      <span
                        className={`visibility-pill ${deposit.status === "approved" ? "free-pill" : deposit.status === "rejected" ? "bg-red-400/10 text-red-300" : "vip-pill"}`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                    <h2 className="font-display mt-3 text-2xl font-bold">
                      {deposit.paymentMethod.toUpperCase()} · {deposit.amount}
                    </h2>
                    <p className="mt-2 text-sm text-[#a79f93]">
                      Submitted {new Date(deposit.createdAt).toLocaleString()} ·
                      User ID {deposit.userId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8ee3a8]">
                    <ShieldCheck size={17} /> Manual review required
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-[#8f877c]">Beneficiary</div>
                    <div className="mt-2 font-semibold">
                      {deposit.beneficiaryName}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-[#8f877c]">
                      Account reference
                    </div>
                    <div className="mt-2 font-semibold">
                      {deposit.accountReference}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-[#8f877c]">Transaction ID</div>
                    <div className="mt-2 break-all font-semibold">
                      {deposit.transactionId}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-[#8f877c]">Screenshot</div>
                    <a
                      className="mt-2 inline-flex items-center gap-2 font-semibold text-[#f5bf45] hover:underline"
                      href={deposit.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open image <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                {deposit.note && (
                  <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-[#c8c0b5]">
                    <strong className="text-white">User note:</strong>{" "}
                    {deposit.note}
                  </div>
                )}
                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                  <textarea
                    className="field-input min-h-20"
                    placeholder="Optional review note to send to the user"
                    value={reviewNotes[deposit.id] ?? ""}
                    onChange={event =>
                      setReviewNotes({
                        ...reviewNotes,
                        [deposit.id]: event.target.value,
                      })
                    }
                  />
                  <div className="flex flex-wrap items-start gap-3">
                    <button
                      className="button-red"
                      disabled={reviewMutation.isPending}
                      onClick={() => review(deposit.id, "approved")}
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      className="button-outline border-red-400/50 text-red-200"
                      disabled={reviewMutation.isPending}
                      onClick={() => review(deposit.id, "rejected")}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm text-[#8f877c]">
            <ShieldCheck size={16} className="text-[#f5bf45]" /> Every review
            creates an in-app notification for the submitting user and keeps a
            server-side audit trail.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
