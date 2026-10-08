import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  Eye,
  FilePlus2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

const games = [
  { key: "sports-toto", name: "Sports Toto" },
  { key: "magnum", name: "Magnum" },
  { key: "da-ma-cai", name: "Da Ma Cai" },
  { key: "singapore-pools", name: "Singapore Pools" },
  { key: "stc-4d", name: "STC 4D" },
  { key: "88-group", name: "88 Group" },
];

type FormState = {
  id?: number;
  gameKey: string;
  gameName: string;
  postDate: string;
  title: string;
  content: string;
  mediaUrl?: string;
  visibility: "free" | "vip";
  status: "draft" | "published";
};

const today = new Date().toISOString().slice(0, 10);
const emptyForm = (): FormState => ({
  gameKey: games[0].key,
  gameName: games[0].name,
  postDate: today,
  title: "",
  content: "",
  mediaUrl: "",
  visibility: "free",
  status: "draft",
});

export default function AdminPosts() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const utils = trpc.useUtils();
  const postsQuery = trpc.dailyPosts.adminList.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const saveMutation = trpc.dailyPosts.save.useMutation({
    onSuccess: async () => {
      await utils.dailyPosts.adminList.invalidate();
      await utils.dailyPosts.published.invalidate();
      toast.success("Daily post saved.");
      setForm(emptyForm());
      setIsEditing(false);
    },
    onError: error => toast.error(error.message || "Could not save the post."),
  });
  const deleteMutation = trpc.dailyPosts.remove.useMutation({
    onSuccess: async () => {
      await utils.dailyPosts.adminList.invalidate();
      await utils.dailyPosts.published.invalidate();
      toast.success("Post deleted.");
    },
    onError: error =>
      toast.error(error.message || "Could not delete the post."),
  });

  const posts = postsQuery.data ?? [];
  const publishedCount = useMemo(
    () => posts.filter(post => post.status === "published").length,
    [posts]
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
            Only an approved administrator can manage daily posts.
          </p>
          <Link href="/" className="button-red mt-6">
            Return home <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    );

  const updateGame = (gameKey: string) => {
    const selected = games.find(game => game.key === gameKey) ?? games[0];
    setForm(current => ({
      ...current,
      gameKey: selected.key,
      gameName: selected.name,
    }));
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  const editPost = (post: (typeof posts)[number]) => {
    setForm({
      id: post.id,
      gameKey: post.gameKey,
      gameName: post.gameName,
      postDate: post.postDate,
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl ?? "",
      visibility: post.visibility,
      status: post.status,
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#070707] px-4 py-5 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5bf45]">
                Content control
              </div>
              <h1 className="font-display mt-2 text-3xl font-bold">
                Daily game posts
              </h1>
              <p className="mt-2 text-[#a79f93]">
                Create one separate daily suggestion or improvement post for
                each game.
              </p>
            </div>
            <Link href="/" className="button-outline">
              <ArrowLeft size={16} /> Public site
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#60491f] bg-[#121110] p-5">
              <div className="text-sm text-[#a79f93]">Total posts</div>
              <div className="mt-2 font-display text-3xl font-bold text-[#f5bf45]">
                {posts.length}
              </div>
            </div>
            <div className="rounded-xl border border-[#60491f] bg-[#121110] p-5">
              <div className="text-sm text-[#a79f93]">Published</div>
              <div className="mt-2 font-display text-3xl font-bold text-[#8ee3a8]">
                {publishedCount}
              </div>
            </div>
            <div className="rounded-xl border border-[#60491f] bg-[#121110] p-5">
              <div className="text-sm text-[#a79f93]">Sharing</div>
              <div className="mt-2 font-display text-lg font-bold text-white">
                4 channels ready
              </div>
            </div>
          </div>

          <form
            onSubmit={save}
            className="mt-8 rounded-2xl border border-[#60491f] bg-[#121110] p-5 md:p-7"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5bf45]">
                  {isEditing ? "Edit existing post" : "New daily post"}
                </div>
                <h2 className="font-display mt-2 text-2xl font-bold">
                  {isEditing ? "Update this post" : "Post today’s suggestion"}
                </h2>
              </div>
              <FilePlus2 className="text-[#f5bf45]" />
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="field-label">
                Game
                <select
                  className="field-input"
                  value={form.gameKey}
                  onChange={event => updateGame(event.target.value)}
                >
                  {games.map(game => (
                    <option key={game.key} value={game.key}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Post date
                <input
                  className="field-input"
                  type="date"
                  value={form.postDate}
                  onChange={event =>
                    setForm({ ...form, postDate: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field-label md:col-span-2">
                Post title
                <input
                  className="field-input"
                  placeholder="Example: Tomorrow’s prediction focus"
                  value={form.title}
                  onChange={event =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                  maxLength={180}
                />
              </label>
              <label className="field-label md:col-span-2">
                Daily content
                <textarea
                  className="field-input min-h-36"
                  placeholder="Write the suggestion, improvement, or game-specific update here..."
                  value={form.content}
                  onChange={event =>
                    setForm({ ...form, content: event.target.value })
                  }
                  required
                  maxLength={10000}
                />
              </label>
              <label className="field-label md:col-span-2">
                Prediction image URL
                <input
                  className="field-input"
                  placeholder="/manus-storage/..."
                  value={form.mediaUrl}
                  onChange={event =>
                    setForm({ ...form, mediaUrl: event.target.value })
                  }
                  maxLength={500}
                />
              </label>
              <label className="field-label">
                Visibility
                <select
                  className="field-input"
                  value={form.visibility}
                  onChange={event =>
                    setForm({
                      ...form,
                      visibility: event.target.value as FormState["visibility"],
                    })
                  }
                >
                  <option value="free">Free — everyone can see it</option>
                  <option value="vip">VIP — reserved for members</option>
                </select>
              </label>
              <label className="field-label">
                Status
                <select
                  className="field-input"
                  value={form.status}
                  onChange={event =>
                    setForm({
                      ...form,
                      status: event.target.value as FormState["status"],
                    })
                  }
                >
                  <option value="draft">Draft — keep private</option>
                  <option value="published">Published — show publicly</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="button-red"
                type="submit"
                disabled={saveMutation.isPending}
              >
                <Save size={16} />{" "}
                {saveMutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update post"
                    : "Save post"}
              </button>
              {isEditing && (
                <button
                  className="button-outline"
                  type="button"
                  onClick={() => {
                    setForm(emptyForm());
                    setIsEditing(false);
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <section className="mt-8 rounded-2xl border border-[#60491f] bg-[#121110] p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5bf45]">
                  Editorial queue
                </div>
                <h2 className="font-display mt-2 text-2xl font-bold">
                  All game posts
                </h2>
              </div>
              <Eye className="text-[#f5bf45]" />
            </div>
            <div className="mt-6 space-y-3">
              {postsQuery.isLoading && (
                <div className="text-[#a79f93]">Loading posts…</div>
              )}
              {!postsQuery.isLoading && posts.length === 0 && (
                <div className="rounded-xl border border-white/10 p-6 text-[#a79f93]">
                  No posts yet. Create your first game-specific post above.
                </div>
              )}
              {posts.map(post => (
                <div
                  key={post.id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#f5bf45]">
                        {post.gameName}
                      </span>
                      <span className="text-xs text-[#8f877c]">
                        {post.postDate}
                      </span>
                      <span
                        className={`visibility-pill ${post.visibility === "vip" ? "vip-pill" : "free-pill"}`}
                      >
                        {post.visibility}
                      </span>
                      <span className="text-xs text-[#a79f93]">
                        {post.status}
                      </span>
                    </div>
                    <div className="mt-2 truncate font-semibold">
                      {post.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-[#9f9689]">
                      {post.content}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="icon-button"
                      onClick={() => editPost(post)}
                      aria-label={`Edit ${post.title}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button text-red-300"
                      onClick={() => {
                        if (window.confirm("Delete this post?"))
                          deleteMutation.mutate({ id: post.id });
                      }}
                      aria-label={`Delete ${post.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="mt-6 flex items-center gap-3 text-sm text-[#8f877c]">
            <Check size={16} className="text-[#8ee3a8]" /> Published posts
            automatically appear in the public daily feed with social share
            buttons.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
