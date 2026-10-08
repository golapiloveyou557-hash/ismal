import { useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  FileImage,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { paymentConfig, PaymentMethodKey } from "@shared/paymentConfig";
import { trpc } from "@/lib/trpc";
import NotificationInbox from "@/components/NotificationInbox";

async function uploadScreenshot(
  file: File
): Promise<{ key: string; url: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read screenshot"));
    reader.readAsDataURL(file);
  });
  const response = await fetch("/api/upload/payment-screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, fileName: file.name }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Screenshot upload failed");
  return response.json() as Promise<{ key: string; url: string }>;
}

export default function Deposit() {
  const { user, loading } = useAuth();
  const [method, setMethod] = useState<PaymentMethodKey>("bkash");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const depositsQuery = trpc.deposits.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const submitMutation = trpc.deposits.submit.useMutation({
    onSuccess: async () => {
      await depositsQuery.refetch();
      setAmount("");
      setTransactionId("");
      setNote("");
      setFile(null);
      toast.success(
        "Deposit submitted. It will remain pending until admin review."
      );
    },
    onError: error => toast.error(error.message || "Could not submit deposit."),
  });
  const selected =
    paymentConfig.methods.find(item => item.key === method) ??
    paymentConfig.methods[0];

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#f5bf45]">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6 text-center text-white">
        <div>
          <h1 className="font-display text-3xl font-bold">Login required</h1>
          <p className="mt-3 text-[#a79f93]">
            Please sign in before submitting a VIP deposit.
          </p>
          <button className="button-red mt-6" onClick={() => startLogin()}>
            Log in <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    );

  const copyAccount = async () => {
    await navigator.clipboard.writeText(selected.account);
    toast.success(`${selected.label} account copied.`);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please upload your payment screenshot.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadScreenshot(file);
      submitMutation.mutate({
        paymentMethod: method,
        accountReference: selected.account,
        amount,
        transactionId,
        screenshotKey: uploaded.key,
        screenshotUrl: uploaded.url,
        note: note || undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Screenshot upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow">VIP membership deposit</div>
            <h1 className="font-display mt-3 text-4xl font-bold">
              Submit payment for review.
            </h1>
            <p className="mt-3 max-w-2xl text-[#a79f93]">
              Deposit only. Your request stays{" "}
              <strong className="text-[#f5bf45]">Pending</strong> until an admin
              reviews the transaction ID and screenshot.
            </p>
          </div>
          <Link href="/" className="button-outline">
            <ArrowLeft size={16} /> Public site
          </Link>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-2xl border border-[#60491f] bg-[#121110] p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#f5bf45]" />
              <h2 className="font-display text-xl font-bold">
                Payment instructions
              </h2>
            </div>
            <div className="mt-5 rounded-xl border border-[#f5bf45]/25 bg-[#f5bf45]/10 p-4">
              <div className="text-xs uppercase tracking-[.16em] text-[#f5bf45]">
                Beneficiary name
              </div>
              <div className="mt-2 font-semibold">
                {paymentConfig.beneficiaryName}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {paymentConfig.methods.map(item => (
                <div
                  key={item.key}
                  className={`rounded-xl border p-4 ${item.key === method ? "border-[#f5bf45] bg-[#f5bf45]/10" : "border-white/10 bg-black/20"}`}
                >
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setMethod(item.key)}
                  >
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="mt-1 text-sm text-[#b4aa9c]">
                        {item.account} · {item.type}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-xs text-[#f5bf45]"
                      onClick={event => {
                        event.stopPropagation();
                        void navigator.clipboard.writeText(item.account);
                        toast.success("Account copied.");
                      }}
                    >
                      <Copy size={13} /> Copy
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>
                Never send payment to any account not shown in this verified
                instruction panel. Withdrawals are not available.
              </span>
            </div>
          </section>
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[#60491f] bg-[#121110] p-6"
          >
            <div className="text-xs uppercase tracking-[.18em] text-[#f5bf45]">
              Transaction submission
            </div>
            <h2 className="font-display mt-2 text-2xl font-bold">
              Tell us about your payment
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="field-label">
                Selected method
                <div className="field-input flex items-center justify-between">
                  {selected.label}
                  <span className="text-[#f5bf45]">{selected.account}</span>
                </div>
              </label>
              <label className="field-label">
                Amount
                <input
                  className="field-input"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="Example: 500"
                  required
                />
              </label>
              <label className="field-label md:col-span-2">
                Transaction ID / reference
                <input
                  className="field-input"
                  value={transactionId}
                  onChange={event => setTransactionId(event.target.value)}
                  placeholder="Enter the exact transaction reference"
                  required
                />
              </label>
              <label className="field-label md:col-span-2">
                Payment screenshot
                <div className="rounded-xl border border-dashed border-[#806327] bg-black/20 p-5">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={event => setFile(event.target.files?.[0] ?? null)}
                    required
                    className="block w-full text-sm text-[#b4aa9c] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f5bf45] file:px-4 file:py-2 file:font-bold file:text-[#120d06]"
                  />
                  {file && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-[#8ee3a8]">
                      <FileImage size={15} /> {file.name}
                    </div>
                  )}
                </div>
              </label>
              <label className="field-label md:col-span-2">
                Note (optional)
                <textarea
                  className="field-input min-h-24"
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder="Any additional information for admin review"
                />
              </label>
            </div>
            <button
              className="button-red mt-6 w-full justify-center"
              disabled={uploading || submitMutation.isPending}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading
                  screenshot...
                </>
              ) : submitMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit deposit for review
                </>
              )}
            </button>
            <p className="mt-4 text-center text-xs text-[#8f877c]">
              Approval is manual. Do not treat submission as VIP activation
              until you receive approval.
            </p>
          </form>
        </div>
        <section className="mt-8 rounded-2xl border border-[#60491f] bg-[#121110] p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="text-[#f5bf45]" />
            <h2 className="font-display text-xl font-bold">
              Your deposit history
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {depositsQuery.isLoading && (
              <div className="text-[#a79f93]">Loading history…</div>
            )}
            {!depositsQuery.isLoading && depositsQuery.data?.length === 0 && (
              <div className="text-[#a79f93]">No deposit submitted yet.</div>
            )}
            {depositsQuery.data?.map(deposit => (
              <div
                key={deposit.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {deposit.paymentMethod.toUpperCase()} · {deposit.amount}
                  </div>
                  <div className="mt-1 text-sm text-[#9f9689]">
                    Transaction: {deposit.transactionId}
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[.12em] ${deposit.status === "approved" ? "bg-green-400/10 text-green-300" : deposit.status === "rejected" ? "bg-red-400/10 text-red-300" : "bg-yellow-400/10 text-yellow-200"}`}
                >
                  {deposit.status === "approved" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}
                  {deposit.status}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-8">
          <NotificationInbox />
        </div>
      </div>
    </div>
  );
}
