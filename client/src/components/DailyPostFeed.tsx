import { useState } from "react";
import { Facebook, Instagram, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Post = {
  id: number;
  gameName: string;
  postDate: string;
  title: string;
  content: string;
  mediaUrl?: string | null;
  visibility: "free" | "vip";
};

function shareText(post: Post) {
  return `${post.title} — ${post.gameName}\n${post.content}\n${window.location.origin}/#daily-posts`;
}

function openShare(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
}

async function sharePost(
  post: Post,
  channel: "facebook" | "x" | "instagram" | "whatsapp"
) {
  const text = shareText(post);
  const pageUrl = `${window.location.origin}/#daily-posts`;
  if (channel === "facebook") {
    openShare(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(text)}`
    );
    return;
  }
  if (channel === "x") {
    openShare(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    );
    return;
  }
  if (channel === "whatsapp") {
    openShare(`https://wa.me/?text=${encodeURIComponent(text)}`);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Post text copied. Paste it into Instagram to share.");
    openShare("https://www.instagram.com/");
  } catch {
    toast.info("Copy the post text manually, then share it on Instagram.");
  }
}

function ShareButtons({ post }: { post: Post }) {
  const [busy, setBusy] = useState(false);
  const handleShare = async (
    channel: "facebook" | "x" | "instagram" | "whatsapp"
  ) => {
    setBusy(true);
    await sharePost(post, channel);
    setBusy(false);
  };
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
      <span className="mr-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9c9387]">
        <Share2 size={13} /> Share
      </span>
      <button
        disabled={busy}
        className="share-chip share-fb"
        onClick={() => handleShare("facebook")}
        aria-label={`Share ${post.title} on Facebook`}
      >
        <Facebook size={13} /> Facebook
      </button>
      <button
        disabled={busy}
        className="share-chip share-x"
        onClick={() => handleShare("x")}
        aria-label={`Share ${post.title} on X`}
      >
        𝕏 <span className="hidden sm:inline">X</span>
      </button>
      <button
        disabled={busy}
        className="share-chip share-ig"
        onClick={() => handleShare("instagram")}
        aria-label={`Share ${post.title} on Instagram`}
      >
        <Instagram size={13} /> Instagram
      </button>
      <button
        disabled={busy}
        className="share-chip share-wa"
        onClick={() => handleShare("whatsapp")}
        aria-label={`Share ${post.title} on WhatsApp`}
      >
        <MessageCircle size={13} /> WhatsApp
      </button>
    </div>
  );
}

export default function DailyPostFeed() {
  const { data, isLoading, isError } = trpc.dailyPosts.published.useQuery();
  const posts = (data ?? []) as Post[];

  return (
    <section id="daily-posts" className="section-dark py-20">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <Send size={14} /> Daily game posts
            </div>
            <h2>Fresh suggestions, game by game.</h2>
          </div>
          <p>
            Every game gets its own daily update. Published posts can be shared
            directly to your social channels.
          </p>
        </div>
        {isLoading && (
          <div className="mt-8 rounded-xl border border-[#60491f] p-6 text-[#a79f93]">
            Loading today’s posts…
          </div>
        )}
        {isError && (
          <div className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
            Daily posts are temporarily unavailable. Please try again shortly.
          </div>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <div className="mt-8 rounded-xl border border-[#60491f] bg-[#121110] p-8 text-[#a79f93]">
            No published daily posts yet. The admin editor is ready for your
            first post.
          </div>
        )}
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {posts.map(post => (
            <article key={post.id} className="post-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">{post.gameName}</div>
                  <h3 className="mt-2 text-2xl">{post.title}</h3>
                </div>
                <span
                  className={`visibility-pill ${post.visibility === "vip" ? "vip-pill" : "free-pill"}`}
                >
                  {post.visibility.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8f877c]">
                {post.postDate}
              </div>
              {post.mediaUrl && (
                <img
                  src={post.mediaUrl}
                  alt={`${post.title} prediction graphic`}
                  className="mt-5 w-full rounded-xl border border-[#60491f] object-cover"
                />
              )}
              <p className="mt-5 whitespace-pre-wrap leading-7 text-[#d0c8bb]">
                {post.content}
              </p>
              <ShareButtons post={post} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
