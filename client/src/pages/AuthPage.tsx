import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";

const copy = {
  login: {
    eyebrow: "Welcome back",
    title: "Log in to your account",
    description:
      "Continue to free insights, VIP membership status and your deposit review history.",
  },
  signup: {
    eyebrow: "Create account",
    title: "Sign up in seconds",
    description:
      "Create a secure member account to save your activity and access your approved VIP benefits.",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Forgot your password?",
    description:
      "Password recovery is handled securely by the connected account provider. Continue to the sign-in portal to reset it.",
  },
} as const;

type Mode = keyof typeof copy;

export default function AuthPage({ mode }: { mode: Mode }) {
  const content = copy[mode];
  const isForgot = mode === "forgot";
  const goToProvider = () => {
    if (isForgot) toast.info("Opening the secure account recovery portal.");
    startLogin();
  };

  return (
    <div className="min-h-screen bg-[#070707] px-4 py-8 text-white md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div className="hidden lg:block">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#a79f93] hover:text-white"
          >
            <ArrowLeft size={16} /> Back to 4D Results
          </Link>
          <div className="mt-16">
            <div className="brand-mark">4D</div>
            <div className="mt-6 text-xs font-bold uppercase tracking-[.24em] text-[#f5bf45]">
              Malaysia & Singapore
            </div>
            <h1 className="font-display mt-4 max-w-xl text-6xl font-bold leading-[.98]">
              A secure home for your 4D journey.
            </h1>
            <p className="mt-6 max-w-lg leading-8 text-[#a79f93]">
              Free information stays open. Your account keeps membership access,
              deposit status and notifications organized.
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#a79f93] hover:text-white lg:hidden"
          >
            <ArrowLeft size={16} /> Back to website
          </Link>
          <div className="rounded-2xl border border-[#60491f] bg-[#121110] p-6 shadow-2xl md:p-9">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow">{content.eyebrow}</div>
                <h2 className="font-display mt-3 text-4xl font-bold">
                  {content.title}
                </h2>
                <p className="mt-4 leading-7 text-[#a79f93]">
                  {content.description}
                </p>
              </div>
              <div className="feature-icon shrink-0">
                {mode === "signup" ? (
                  <UserPlus size={19} />
                ) : mode === "forgot" ? (
                  <KeyRound size={19} />
                ) : (
                  <LockKeyhole size={19} />
                )}
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[#f5bf45]"
                  size={20}
                />
                <div>
                  <div className="font-semibold">
                    Secure provider authentication
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#a79f93]">
                    You will continue to the connected account provider to enter
                    or recover your credentials. This website does not collect
                    or store your password.
                  </p>
                </div>
              </div>
            </div>
            <button
              className="button-red mt-6 w-full justify-center"
              onClick={goToProvider}
            >
              {isForgot
                ? "Continue to recovery"
                : mode === "signup"
                  ? "Create account"
                  : "Continue to login"}{" "}
              <ArrowRight size={17} />
            </button>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#a79f93]">
              {mode === "login" && (
                <>
                  <Link
                    href="/forgot-password"
                    className="text-[#f5bf45] hover:underline"
                  >
                    Forgot password?
                  </Link>
                  <span>
                    New here?{" "}
                    <Link
                      href="/signup"
                      className="text-[#f5bf45] hover:underline"
                    >
                      Sign up
                    </Link>
                  </span>
                </>
              )}
              {mode === "signup" && (
                <span>
                  Already a member?{" "}
                  <Link
                    href="/login"
                    className="text-[#f5bf45] hover:underline"
                  >
                    Log in
                  </Link>
                </span>
              )}
              {mode === "forgot" && (
                <Link href="/login" className="text-[#f5bf45] hover:underline">
                  Back to login
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-[#817a70]">
            <span className="inline-flex items-center gap-2">
              <Check size={13} className="text-[#8ee3a8]" /> Secure session
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={13} className="text-[#8ee3a8]" /> 18+ responsible
              play
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
