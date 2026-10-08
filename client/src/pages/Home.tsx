import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { siteConfig } from "@shared/siteConfig";
import DailyPostFeed from "@/components/DailyPostFeed";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  Facebook,
  Instagram,
  LockKeyhole,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";

const providers = [
  "Sports Toto",
  "Magnum",
  "Da Ma Cai",
  "Singapore Pools",
  "STC 4D",
  "88 Group",
];
const sampleResults = [
  { provider: "Sports Toto", draw: "Next draw information", number: "----" },
  { provider: "Magnum", draw: "Next draw information", number: "----" },
  {
    provider: "Singapore Pools",
    draw: "Next draw information",
    number: "----",
  },
];

function goTo(link: string) {
  window.open(link, "_blank", "noopener,noreferrer");
}

function ComingSoon(label: string) {
  toast.info(`${label} is being prepared for the next phase.`);
}

export default function Home() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-[#e11d2e] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#6f4b14]/60 bg-[#070707]/90 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between gap-5">
          <a
            href="#home"
            className="flex items-center gap-3"
            aria-label="4D Results home"
          >
            <div className="brand-mark">4D</div>
            <div className="hidden sm:block">
              <div className="font-display text-lg font-black tracking-[0.16em] text-white">
                RESULTS
              </div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#f5bf45]">
                Malaysia & Singapore
              </div>
            </div>
          </a>

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Primary navigation"
          >
            {["Results", "Free Prediction", "VIP Prediction", "Membership"].map(
              item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                  className="nav-link"
                >
                  {item}
                </a>
              )
            )}
            <a href="#community" className="nav-link">
              Community
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {user && (
              <a href="/member" className="button-ghost">
                Member hub
              </a>
            )}
            {user?.role === "admin" && (
              <>
                <a href="/admin" className="button-ghost">
                  Admin dashboard
                </a>
                <a href="/admin/posts" className="button-ghost">
                  Admin posts
                </a>
                <a href="/admin/deposits" className="button-ghost">
                  Deposits
                </a>
              </>
            )}
            {user ? (
              <button className="button-ghost" onClick={() => logout()}>
                Log out
              </button>
            ) : (
              <a className="button-ghost" href="/login">
                Log in
              </a>
            )}
            <a className="button-red" href="/signup">
              Sign up <ArrowRight size={16} />
            </a>
          </div>
          <button
            className="icon-button lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(value => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#6f4b14]/60 bg-[#0c0b0b] px-5 py-5 lg:hidden">
            <div className="container flex flex-col gap-4">
              {[
                "Results",
                "Free Prediction",
                "VIP Prediction",
                "Membership",
                "Community",
              ].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex gap-3 pt-2 sm:hidden">
                <a className="button-ghost flex-1 justify-center" href="/login">
                  Log in
                </a>
                <a className="button-red flex-1 justify-center" href="/signup">
                  Sign up
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="home">
        <section className="hero-shell luxury-hero">
          <div className="hero-grid" />
          <div className="container relative py-8 lg:py-12">
            <div className="luxury-hero-frame">
              <img
                src="/luxury-results-banner.png"
                alt="4D Results Malaysia and Singapore luxury results banner"
                className="luxury-hero-image"
              />
              <div className="luxury-hero-shade" />
              <div className="luxury-hero-copy">
                <div className="eyebrow">
                  <Sparkles size={14} /> Trusted results · Clear insights · Play
                  responsibly
                </div>
                <h1 className="font-display mt-5 max-w-3xl text-5xl font-black uppercase leading-[.92] tracking-tight sm:text-7xl">
                  4D <span className="gold-text">Results</span>
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#eee3d2] sm:text-lg">
                  Malaysia & Singapore’s premium information platform for daily
                  results, clear predictions and member updates.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#free-prediction" className="button-red">
                    View free prediction <ArrowRight size={17} />
                  </a>
                  <a href="#results" className="button-outline">
                    Explore games <ChevronDown size={17} />
                  </a>
                </div>
              </div>
              <div className="luxury-hero-board">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[.2em] text-[#f5bf45]">
                      Today’s focus
                    </div>
                    <div className="mt-1 font-display text-xl font-bold">
                      Latest draw board
                    </div>
                  </div>
                  <CalendarDays className="text-[#f5bf45]" size={20} />
                </div>
                <div className="mt-4 space-y-2">
                  {sampleResults.map(result => (
                    <div key={result.provider} className="result-row">
                      <div>
                        <div className="text-sm font-semibold">
                          {result.provider}
                        </div>
                        <div className="text-[10px] text-[#958d82]">
                          {result.draw}
                        </div>
                      </div>
                      <div className="number-placeholder">{result.number}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[11px] leading-5 text-[#f0ddaa]">
                  Official timestamps will appear when the provider feed is
                  connected.
                </div>
              </div>
            </div>
            <div className="luxury-metrics">
              <div>
                <ShieldCheck size={18} />
                <span>
                  <strong>Fast results</strong>
                  <small>Daily updates</small>
                </span>
              </div>
              <div>
                <LockKeyhole size={18} />
                <span>
                  <strong>Secure access</strong>
                  <small>Privacy-first account</small>
                </span>
              </div>
              <div>
                <MessageCircle size={18} />
                <span>
                  <strong>24/7 support</strong>
                  <small>Telegram & WhatsApp</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="container py-20">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Coverage</div>
              <h2>Results, organized.</h2>
            </div>
            <p>
              Fast scanning cards for the platforms your audience checks most.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider, index) => (
              <button
                key={provider}
                className="provider-card text-left"
                onClick={() => ComingSoon(`${provider} results`)}
              >
                <div className={`provider-badge badge-${index + 1}`}>
                  {provider.slice(0, 2).toUpperCase()}
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold">{provider}</div>
                    <div className="mt-1 text-sm text-[#958d82]">
                      Official results feed · Coming soon
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-[#f5bf45]" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <DailyPostFeed />

        <section id="free-prediction" className="section-dark py-20">
          <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <div className="eyebrow">
                <Target size={14} /> Open to everyone
              </div>
              <h2 className="mt-4">Free prediction, without the noise.</h2>
              <p className="mt-5 max-w-lg leading-8 text-[#b9b0a4]">
                Give every visitor a useful starting point with transparent,
                clearly labelled statistical insights. No guaranteed wins. No
                misleading promises.
              </p>
              <a href="#community" className="button-outline mt-7 inline-flex">
                See community updates <ArrowRight size={17} />
              </a>
            </div>
            <div className="insight-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#f5bf45]">
                    Free access
                  </div>
                  <h3 className="mt-2">Daily insight board</h3>
                </div>
                <Trophy className="text-[#f5bf45]" />
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="stat-box">
                  <span>Format</span>
                  <strong>4D</strong>
                </div>
                <div className="stat-box">
                  <span>Access</span>
                  <strong>Public</strong>
                </div>
                <div className="stat-box">
                  <span>Claim</span>
                  <strong>None</strong>
                </div>
              </div>
              <button
                className="button-red mt-6 w-full justify-center"
                onClick={() => ComingSoon("Free prediction")}
              >
                View free board <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </section>

        <section id="vip-prediction" className="container py-20">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <Crown size={14} /> Member tier
              </div>
              <h2>More depth for VIP members.</h2>
            </div>
            <p>
              Premium analysis stays behind membership access while the free
              board remains open to everyone.
            </p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              "Extended analysis",
              "VIP prediction board",
              "Priority updates",
            ].map(item => (
              <div key={item} className="feature-card">
                <div className="feature-icon">
                  <Check size={18} />
                </div>
                <h3 className="mt-5">{item}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9689]">
                  A clear member feature placeholder, ready to connect to your
                  final content rules.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="membership" className="section-gold py-20">
          <div className="container grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="eyebrow dark-eyebrow">
                <Crown size={14} /> VIP Membership
              </div>
              <h2 className="mt-4 text-[#120d06]">
                Deposit for access.
                <br />
                Compliance-only withdrawals.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-[#5d451b]">
                Submit your transaction ID and payment screenshot. Access stays
                pending until the admin completes a manual review. Any
                withdrawal request is separately restricted to lawful
                non-gambling purpose and compliance review.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a className="button-dark" href="/deposit">
                  Deposit for VIP <ArrowRight size={17} />
                </a>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#7a5d1f]/30 px-4 py-2 text-sm text-[#5d451b]">
                  <ShieldCheck size={15} /> Manual verification ready
                </span>
              </div>
            </div>
            <div className="dark-card">
              <div className="text-sm text-[#f5bf45]">
                Membership guardrails
              </div>
              <ul className="mt-5 space-y-4 text-sm text-[#e9e0d2]">
                {[
                  "No gambling withdrawals",
                  "Server-side VIP status",
                  "Deposit review queue",
                  "Audit log for changes",
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <Check size={16} className="text-[#f5bf45]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="community" className="container py-20">
          <div className="community-panel">
            <div>
              <div className="eyebrow">
                <MessageCircle size={14} /> 24-hour help line
              </div>
              <h2 className="mt-4">Stay connected across every channel.</h2>
              <p className="mt-4 max-w-xl leading-7 text-[#bbb2a6]">
                Use Telegram for the primary helpline. Facebook, Instagram and
                WhatsApp links are included below and can be replaced whenever
                you send the final social profiles.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                className="social-button telegram"
                href={siteConfig.socialLinks.telegram}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} /> Telegram helpline{" "}
                <ArrowRight size={16} />
              </a>
              <a
                className="social-button whatsapp"
                href={siteConfig.socialLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} /> WhatsApp <ArrowRight size={16} />
              </a>
              <a
                className="social-button facebook"
                href={siteConfig.socialLinks.facebookPage}
                target="_blank"
                rel="noreferrer"
              >
                <Facebook size={20} /> Facebook page <ArrowRight size={16} />
              </a>
              <a
                className="social-button instagram"
                href={siteConfig.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={20} /> Instagram{" "}
                {siteConfig.socialLabels.instagram} <ArrowRight size={16} />
              </a>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#8e877d]">
            <span>
              Facebook: Probashi Voice Malaysia Singapore · fb4D 1st Price
              Calculation
            </span>
            <a
              className="underline underline-offset-4 hover:text-white"
              href={siteConfig.socialLinks.facebookShare}
              target="_blank"
              rel="noreferrer"
            >
              Open Facebook share link
            </a>
          </div>
        </section>
        <section className="banner-feature-section border-t border-[#6f4b14]/40 bg-[#050505] py-10">
          <div className="container">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="eyebrow">Live results feature panel</div>
                <h2 className="mt-3 text-3xl sm:text-4xl">
                  Stay updated with every draw.
                </h2>
              </div>
              <span className="text-sm text-[#8e877d]">
                Fast · Accurate · Trusted
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#6f4b14] bg-black shadow-[0_0_45px_rgba(245,191,69,.12)]">
              <img
                src="/luxury-results-banner.png"
                alt="4D Results luxury results and official feature banner"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#6f4b14]/50 bg-[#050505] py-8">
        <div className="container flex flex-col gap-5 text-sm text-[#8e877d] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-lg font-bold text-white">
              4D <span className="gold-text">RESULTS</span>
            </div>
            <div className="mt-1">
              Malaysia & Singapore · Information platform
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="#community" className="hover:text-white">
              Contact
            </a>
            <button
              onClick={() => ComingSoon("Terms & Conditions")}
              className="hover:text-white"
            >
              Terms
            </button>
            <button
              onClick={() => ComingSoon("Privacy Policy")}
              className="hover:text-white"
            >
              Privacy
            </button>
            <span>18+ · Responsible play</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
