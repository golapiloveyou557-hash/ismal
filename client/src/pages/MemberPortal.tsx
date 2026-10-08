import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Heart,
  KeyRound,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const tabs = [
  "overview",
  "profile",
  "community",
  "groups",
  "messages",
  "membership",
  "wallet",
  "notifications",
  "support",
  "security",
] as const;
type Tab = (typeof tabs)[number];

export default function MemberPortal() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [profileForm, setProfileForm] = useState({
    username: "member_4d",
    bio: "",
    location: "",
    website: "",
    privacy: "public" as "public" | "members" | "private",
  });
  const [postBody, setPostBody] = useState("");
  const [ticket, setTicket] = useState({
    subject: "",
    message: "",
    category: "General support",
  });
  const [withdrawal, setWithdrawal] = useState({
    amount: "",
    reference: "",
    note: "",
  });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ receiverId: "", body: "" });
  const [groupForm, setGroupForm] = useState({
    name: "",
    slug: "",
    description: "",
    privacy: "public" as "public" | "private",
  });
  const profileQuery = trpc.profile.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const feedQuery = trpc.community.feed.useQuery();
  const plansQuery = trpc.membership.plans.useQuery();
  const membershipQuery = trpc.membership.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const walletQuery = trpc.wallet.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const walletTransactions = trpc.wallet.transactions.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const notificationsQuery = trpc.notifications.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const ticketsQuery = trpc.support.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const securityQuery = trpc.security.status.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const searchQuery = trpc.profile.search.useQuery(
    { query: search },
    { enabled: search.length >= 2 }
  );
  const groupsQuery = trpc.community.groups.useQuery();
  const messagesQuery = trpc.messages.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const utils = trpc.useUtils();
  const saveProfile = trpc.profile.save.useMutation({
    onSuccess: async () => {
      await utils.profile.mine.invalidate();
      toast.success("Profile updated.");
    },
    onError: error => toast.error(error.message),
  });
  const createPost = trpc.community.createPost.useMutation({
    onSuccess: async () => {
      setPostBody("");
      await utils.community.feed.invalidate();
      toast.success("Post published.");
    },
    onError: error => toast.error(error.message),
  });
  const like = trpc.community.like.useMutation({
    onSuccess: async () => {
      await utils.community.feed.invalidate();
    },
  });
  const follow = trpc.community.follow.useMutation({
    onSuccess: () => toast.success("Follow request saved."),
  });
  const createTicket = trpc.support.create.useMutation({
    onSuccess: async () => {
      setTicket({ subject: "", message: "", category: "General support" });
      await utils.support.mine.invalidate();
      toast.success("Support ticket created.");
    },
    onError: error => toast.error(error.message),
  });
  const requestWithdrawal = trpc.wallet.requestWithdrawal.useMutation({
    onSuccess: async () => {
      setWithdrawal({ amount: "", reference: "", note: "" });
      await utils.wallet.transactions.invalidate();
      toast.success(
        "Non-gambling withdrawal request sent for compliance review."
      );
    },
    onError: error => toast.error(error.message),
  });
  const toggle2fa = trpc.security.toggleTwoFactor.useMutation({
    onSuccess: async () => {
      await utils.security.status.invalidate();
      toast.success("Security setting updated.");
    },
  });
  const createGroup = trpc.community.createGroup.useMutation({
    onSuccess: async () => {
      setGroupForm({ name: "", slug: "", description: "", privacy: "public" });
      await utils.community.groups.invalidate();
      toast.success("Group created.");
    },
    onError: error => toast.error(error.message),
  });
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: async () => {
      setMessage({ receiverId: "", body: "" });
      await utils.messages.mine.invalidate();
      toast.success("Message sent.");
    },
    onError: error => toast.error(error.message),
  });
  const notifications = notificationsQuery.data ?? [];
  const activePlan = membershipQuery.data?.find(
    item => item.status === "active"
  );
  const displayName = user?.name || "Member";

  if (loading) return <div className="min-h-screen bg-[#070707]" />;
  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6 text-center text-white">
        <div>
          <h1 className="font-display text-4xl font-bold">Member portal</h1>
          <p className="mt-3 text-[#a79f93]">
            Log in to access your profile, community and account tools.
          </p>
          <Link href="/login" className="button-red mt-6">
            Log in
          </Link>
        </div>
      </div>
    );

  const setTabAndSeedProfile = (next: Tab) => {
    setTab(next);
    const existing = profileQuery.data;
    if (existing)
      setProfileForm({
        username: existing.username,
        bio: existing.bio ?? "",
        location: existing.location ?? "",
        website: existing.website ?? "",
        privacy: existing.privacy,
      });
  };
  const submitPost = (event: React.FormEvent) => {
    event.preventDefault();
    if (postBody.trim())
      createPost.mutate({ body: postBody, kind: "text", visibility: "public" });
  };
  const submitTicket = (event: React.FormEvent) => {
    event.preventDefault();
    createTicket.mutate(ticket);
  };
  const submitWithdrawal = (event: React.FormEvent) => {
    event.preventDefault();
    requestWithdrawal.mutate({
      amountCents: Math.round(Number(withdrawal.amount) * 100),
      reference: withdrawal.reference,
      note: withdrawal.note,
      purpose: "non_gambling",
    });
  };
  const submitGroup = (event: React.FormEvent) => {
    event.preventDefault();
    createGroup.mutate(groupForm);
  };
  const submitMessage = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage.mutate({
      receiverId: Number(message.receiverId),
      body: message.body,
    });
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-[#4b391d] bg-[#090909] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark h-10 w-10 text-lg">4D</span>
            <span className="font-display font-bold tracking-[.12em]">
              MEMBER HUB
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              className="button-outline"
              onClick={() => setTabAndSeedProfile("profile")}
            >
              <UserRound size={16} /> {displayName}
            </button>
            <Link className="button-ghost" href="/">
              Public site
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-[#60491f] bg-[#121110] p-3">
          <div className="px-3 py-3 text-xs uppercase tracking-[.18em] text-[#f5bf45]">
            Your workspace
          </div>
          <nav className="space-y-1">
            {tabs.map(item => (
              <button
                key={item}
                onClick={() => setTabAndSeedProfile(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold capitalize transition ${tab === item ? "bg-[#f5bf45] text-[#120d06]" : "text-[#b4aa9c] hover:bg-white/5 hover:text-white"}`}
              >
                <span>
                  {item === "overview" ? (
                    <WalletCards size={16} />
                  ) : item === "profile" ? (
                    <UserRound size={16} />
                  ) : item === "community" || item === "groups" ? (
                    <Users size={16} />
                  ) : item === "messages" ? (
                    <MessageCircle size={16} />
                  ) : item === "membership" ? (
                    <CreditCard size={16} />
                  ) : item === "wallet" ? (
                    <WalletCards size={16} />
                  ) : item === "notifications" ? (
                    <Bell size={16} />
                  ) : item === "support" ? (
                    <MessageCircle size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                </span>
                {item}
              </button>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs leading-5 text-[#d6b6b1]">
            Wallet withdrawals are restricted to verified non-gambling financial
            purpose only.
          </div>
        </aside>
        <main className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">
                {tab === "overview" ? "Member overview" : tab}
              </div>
              <h1 className="font-display mt-2 text-4xl font-bold">
                {tab === "overview"
                  ? `Welcome, ${displayName}.`
                  : tab === "community"
                    ? "Your community space."
                    : tab === "wallet"
                      ? "Account & wallet."
                      : tab === "security"
                        ? "Security center."
                        : `Manage your ${tab}.`}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#a79f93]">
              <Bell size={16} className="text-[#f5bf45]" />{" "}
              {notifications.length} notifications
            </div>
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="portal-stat">
                  <span>Current plan</span>
                  <strong>{activePlan ? "Active membership" : "Free"}</strong>
                  <small>
                    {activePlan
                      ? "Your benefits are active"
                      : "Upgrade when ready"}
                  </small>
                </div>
                <div className="portal-stat">
                  <span>Account balance</span>
                  <strong>
                    {walletQuery.data
                      ? `${(walletQuery.data.balanceCents / 100).toFixed(2)} ${walletQuery.data.currency}`
                      : "0.00 BDT"}
                  </strong>
                  <small>Non-gambling ledger only</small>
                </div>
                <div className="portal-stat">
                  <span>Notifications</span>
                  <strong>
                    {notifications.filter(n => !n.readAt).length} new
                  </strong>
                  <small>Deposit and account updates</small>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                <section className="portal-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="eyebrow">Community preview</div>
                      <h2 className="mt-2 text-2xl">Post, follow, connect.</h2>
                    </div>
                    <button
                      className="button-outline"
                      onClick={() => setTabAndSeedProfile("community")}
                    >
                      Open community
                    </button>
                  </div>
                  <div className="mt-6 space-y-3">
                    {feedQuery.data?.slice(0, 2).map(post => (
                      <div
                        key={post.id}
                        className="rounded-xl border border-white/10 p-4"
                      >
                        <div className="text-xs text-[#8f877c]">
                          Community post ·{" "}
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <p className="mt-2 text-[#d9d1c6]">{post.body}</p>
                      </div>
                    ))}
                    {!feedQuery.data?.length && (
                      <p className="text-[#9f9689]">
                        Your community feed is ready for your first post.
                      </p>
                    )}
                  </div>
                </section>
                <section className="portal-card">
                  <div className="eyebrow">Membership ladder</div>
                  <h2 className="mt-2 text-2xl">Free to VIP.</h2>
                  <p className="mt-3 text-sm leading-6 text-[#a79f93]">
                    Choose a plan for badges, storage, exclusive community and
                    priority support.
                  </p>
                  <button
                    className="button-red mt-5"
                    onClick={() => setTabAndSeedProfile("membership")}
                  >
                    Compare plans
                  </button>
                </section>
              </div>
              <NotificationList notifications={notifications.slice(0, 3)} />
            </div>
          )}

          {tab === "profile" && (
            <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <section className="portal-card">
                <div className="profile-cover">
                  <div className="profile-avatar">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                </div>
                <h2 className="mt-12 text-2xl font-bold">
                  {profileQuery.data?.username ?? profileForm.username}
                </h2>
                <p className="mt-2 text-[#a79f93]">
                  {profileQuery.data?.bio ||
                    "Add a bio to introduce yourself to the community."}
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="stat-box">
                    <strong>0</strong>
                    <span>Posts</span>
                  </div>
                  <div className="stat-box">
                    <strong>0</strong>
                    <span>Followers</span>
                  </div>
                  <div className="stat-box">
                    <strong>0</strong>
                    <span>Following</span>
                  </div>
                </div>
              </section>
              <section className="portal-card">
                <div className="eyebrow">Profile settings</div>
                <h2 className="mt-2 text-2xl">Make your profile yours.</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="field-label">
                    Username
                    <input
                      className="field-input"
                      value={profileForm.username}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          username: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="field-label">
                    Location
                    <input
                      className="field-input"
                      value={profileForm.location}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="Malaysia / Singapore"
                    />
                  </label>
                  <label className="field-label md:col-span-2">
                    Bio
                    <textarea
                      className="field-input min-h-24"
                      value={profileForm.bio}
                      onChange={e =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder="Tell the community about you"
                    />
                  </label>
                  <label className="field-label">
                    Website
                    <input
                      className="field-input"
                      value={profileForm.website}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          website: e.target.value,
                        })
                      }
                      placeholder="https://"
                    />
                  </label>
                  <label className="field-label">
                    Privacy
                    <select
                      className="field-input"
                      value={profileForm.privacy}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          privacy: e.target.value as typeof profileForm.privacy,
                        })
                      }
                    >
                      <option value="public">Public</option>
                      <option value="members">Members only</option>
                      <option value="private">Private</option>
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="button-red"
                    onClick={() => saveProfile.mutate(profileForm)}
                  >
                    Save profile
                  </button>
                  <button
                    className="button-outline"
                    onClick={() =>
                      toast.info(
                        "Profile photo and cover upload connect to managed storage in the next media pass."
                      )
                    }
                  >
                    Add photo & cover
                  </button>
                </div>
              </section>
            </div>
          )}

          {tab === "community" && (
            <div className="space-y-6">
              <section className="portal-card">
                <div className="eyebrow">Create</div>
                <h2 className="mt-2 text-2xl">Share with your community.</h2>
                <form onSubmit={submitPost} className="mt-5">
                  <textarea
                    className="field-input min-h-28"
                    value={postBody}
                    onChange={e => setPostBody(e.target.value)}
                    placeholder="Write a post, update or insight…"
                    required
                  />
                  <div className="mt-4 flex flex-wrap justify-between gap-3">
                    <div className="flex gap-2">
                      <span className="visibility-pill free-pill">Text</span>
                      <span className="visibility-pill vip-pill">
                        Photo / Video ready
                      </span>
                    </div>
                    <button className="button-red" type="submit">
                      Publish post
                    </button>
                  </div>
                </form>
              </section>
              <section className="portal-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="eyebrow">Explore</div>
                    <h2 className="mt-2 text-2xl">Feed & people.</h2>
                  </div>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-3 text-[#8f877c]"
                    />
                    <input
                      className="field-input pl-9"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search profiles"
                    />
                  </div>
                </div>
                {searchQuery.data?.length ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {searchQuery.data.map(profile => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 p-3"
                      >
                        <span>@{profile.username}</span>
                        <button
                          className="button-outline"
                          onClick={() =>
                            follow.mutate({ followingId: profile.userId })
                          }
                        >
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-6 space-y-4">
                  {feedQuery.data?.map(post => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-white/10 bg-black/10 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="profile-avatar small">U</div>
                          <div>
                            <strong>Community member</strong>
                            <div className="text-xs text-[#8f877c]">
                              {post.kind} ·{" "}
                              {new Date(post.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <span className="visibility-pill free-pill">
                          {post.visibility}
                        </span>
                      </div>
                      <p className="mt-4 leading-7 text-[#ded6cb]">
                        {post.body}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          className="share-chip"
                          onClick={() => like.mutate({ postId: post.id })}
                        >
                          <Heart size={14} /> Like
                        </button>
                        <button
                          className="share-chip"
                          onClick={() =>
                            toast.info(
                              "Comment composer is ready for the next interaction pass."
                            )
                          }
                        >
                          <MessageCircle size={14} /> Comment
                        </button>
                        <button
                          className="share-chip"
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(post.body)
                              .then(() => toast.success("Post text copied."))
                          }
                        >
                          Share
                        </button>
                      </div>
                    </article>
                  ))}
                  {!feedQuery.data?.length && (
                    <p className="text-[#9f9689]">
                      No posts yet. Publish the first one above.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "groups" && (
            <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <section className="portal-card">
                <div className="eyebrow">Communities</div>
                <h2 className="mt-2 text-3xl">Find your group.</h2>
                <p className="mt-3 text-[#a79f93]">
                  Join public communities or create a private space for members.
                </p>
                <div className="mt-6 grid gap-3">
                  {groupsQuery.data?.map(group => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 p-4"
                    >
                      <div>
                        <strong>{group.name}</strong>
                        <p className="mt-1 text-sm text-[#9f9689]">
                          {group.description || "Community discussion space"}
                        </p>
                      </div>
                      <span className="visibility-pill free-pill">
                        {group.privacy}
                      </span>
                    </div>
                  ))}
                  {!groupsQuery.data?.length && (
                    <p className="text-[#9f9689]">
                      No groups yet. Create the first one.
                    </p>
                  )}
                </div>
              </section>
              <form className="portal-card" onSubmit={submitGroup}>
                <div className="eyebrow">Create a group</div>
                <h2 className="mt-2 text-2xl">Start a community.</h2>
                <input
                  className="field-input mt-6"
                  placeholder="Group name"
                  value={groupForm.name}
                  onChange={e =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  required
                />
                <input
                  className="field-input mt-3"
                  placeholder="url-slug"
                  value={groupForm.slug}
                  onChange={e =>
                    setGroupForm({ ...groupForm, slug: e.target.value })
                  }
                  required
                />
                <textarea
                  className="field-input mt-3 min-h-24"
                  placeholder="Description"
                  value={groupForm.description}
                  onChange={e =>
                    setGroupForm({ ...groupForm, description: e.target.value })
                  }
                />
                <select
                  className="field-input mt-3"
                  value={groupForm.privacy}
                  onChange={e =>
                    setGroupForm({
                      ...groupForm,
                      privacy: e.target.value as typeof groupForm.privacy,
                    })
                  }
                >
                  <option value="public">Public group</option>
                  <option value="private">Private group</option>
                </select>
                <button className="button-red mt-4" type="submit">
                  Create group
                </button>
              </form>
            </div>
          )}

          {tab === "messages" && (
            <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <section className="portal-card">
                <div className="eyebrow">Messenger</div>
                <h2 className="mt-2 text-3xl">Your conversations.</h2>
                <div className="mt-6 space-y-3">
                  {messagesQuery.data?.map(item => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <div className="text-xs text-[#8f877c]">
                        {item.senderId === user.id ? "You sent" : "Received"} ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <p className="mt-2 text-[#d9d1c6]">{item.body}</p>
                    </div>
                  ))}
                  {!messagesQuery.data?.length && (
                    <p className="text-[#9f9689]">No conversations yet.</p>
                  )}
                </div>
              </section>
              <form className="portal-card" onSubmit={submitMessage}>
                <div className="eyebrow">New message</div>
                <h2 className="mt-2 text-2xl">Connect directly.</h2>
                <input
                  className="field-input mt-6"
                  type="number"
                  placeholder="Recipient user ID"
                  value={message.receiverId}
                  onChange={e =>
                    setMessage({ ...message, receiverId: e.target.value })
                  }
                  required
                />
                <textarea
                  className="field-input mt-3 min-h-32"
                  placeholder="Write a message"
                  value={message.body}
                  onChange={e =>
                    setMessage({ ...message, body: e.target.value })
                  }
                  required
                />
                <button className="button-red mt-4" type="submit">
                  Send message
                </button>
                <p className="mt-3 text-xs text-[#8f877c]">
                  User discovery and message safety moderation are available to
                  admins.
                </p>
              </form>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-6">
              <section className="portal-card">
                <div className="eyebrow">Inbox</div>
                <h2 className="mt-2 text-3xl">Your notifications.</h2>
                <NotificationList notifications={notifications} />
              </section>
            </div>
          )}

          {tab === "membership" && (
            <div className="space-y-6">
              <section className="portal-card">
                <div className="eyebrow">Plans</div>
                <h2 className="mt-2 text-3xl">Choose your membership.</h2>
                <p className="mt-3 max-w-2xl text-[#a79f93]">
                  Each plan can carry a separate badge, storage limit, private
                  community, exclusive content and support tier.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {(plansQuery.data?.length
                    ? plansQuery.data
                    : [
                        {
                          id: 1,
                          slug: "free",
                          name: "Free",
                          priceCents: 0,
                          currency: "BDT",
                          benefits: "Public predictions, community access",
                          storageMb: 100,
                        },
                        {
                          id: 2,
                          slug: "silver",
                          name: "Silver",
                          priceCents: 99900,
                          currency: "BDT",
                          benefits: "Badge, more storage, member posts",
                          storageMb: 500,
                        },
                        {
                          id: 3,
                          slug: "gold",
                          name: "Gold",
                          priceCents: 199900,
                          currency: "BDT",
                          benefits: "Exclusive community, advanced profile",
                          storageMb: 2000,
                        },
                        {
                          id: 4,
                          slug: "vip",
                          name: "VIP",
                          priceCents: 399900,
                          currency: "BDT",
                          benefits: "VIP predictions, priority support",
                          storageMb: 5000,
                        },
                      ]
                  ).map(plan => (
                    <div
                      key={plan.slug}
                      className={`feature-card ${plan.slug === "vip" ? "border-[#f5bf45]" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl font-bold">
                          {plan.name}
                        </span>
                        {plan.slug === "vip" && (
                          <span className="visibility-pill vip-pill">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-4 font-display text-2xl font-bold text-[#f5bf45]">
                        {plan.priceCents === 0
                          ? "Free"
                          : `${(plan.priceCents / 100).toFixed(0)} ${plan.currency}`}
                      </div>
                      <p className="mt-4 min-h-14 text-sm leading-6 text-[#a79f93]">
                        {plan.benefits}
                      </p>
                      <div className="mt-4 text-xs text-[#8f877c]">
                        {plan.storageMb} MB storage
                      </div>
                      <Link
                        href="/deposit"
                        className="button-red mt-5 w-full justify-center"
                      >
                        Choose plan
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
              <section className="portal-card">
                <div className="eyebrow">History</div>
                <h2 className="mt-2 text-2xl">Renewal & membership history.</h2>
                <div className="mt-5 space-y-3">
                  {membershipQuery.data?.map(membership => (
                    <div
                      key={membership.id}
                      className="flex justify-between rounded-xl border border-white/10 p-4"
                    >
                      <span>Plan #{membership.planId}</span>
                      <span className="visibility-pill free-pill">
                        {membership.status}
                      </span>
                    </div>
                  ))}
                  {!membershipQuery.data?.length && (
                    <p className="text-[#9f9689]">No membership history yet.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "wallet" && (
            <div className="space-y-6">
              <section className="portal-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="eyebrow">My account</div>
                    <h2 className="mt-2 text-3xl">
                      Wallet & transaction history.
                    </h2>
                  </div>
                  <div className="rounded-xl border border-[#f5bf45]/30 bg-[#f5bf45]/10 px-4 py-3 text-right">
                    <div className="text-xs text-[#cbb17c]">
                      Current balance
                    </div>
                    <div className="font-display text-2xl font-bold text-[#f5bf45]">
                      {walletQuery.data
                        ? `${(walletQuery.data.balanceCents / 100).toFixed(2)} ${walletQuery.data.currency}`
                        : "0.00 BDT"}
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3>Transactions</h3>
                    <div className="mt-3 space-y-2">
                      {walletTransactions.data?.map(transaction => (
                        <div
                          key={transaction.id}
                          className="flex justify-between rounded-xl border border-white/10 p-3 text-sm"
                        >
                          <span>
                            {transaction.type} · {transaction.reference}
                          </span>
                          <span className="text-[#f5bf45]">
                            {transaction.status}
                          </span>
                        </div>
                      ))}
                      {!walletTransactions.data?.length && (
                        <p className="text-sm text-[#9f9689]">
                          No transactions yet.
                        </p>
                      )}
                    </div>
                  </div>
                  <form onSubmit={submitWithdrawal}>
                    <h3>Non-gambling withdrawal request</h3>
                    <p className="mt-2 text-sm leading-6 text-[#a79f93]">
                      Only lawful, documented non-gambling purpose is accepted.
                      KYC and admin compliance review are required.
                    </p>
                    <input
                      className="field-input mt-4"
                      type="number"
                      step="0.01"
                      placeholder="Amount in BDT"
                      value={withdrawal.amount}
                      onChange={e =>
                        setWithdrawal({ ...withdrawal, amount: e.target.value })
                      }
                      required
                    />
                    <input
                      className="field-input mt-3"
                      placeholder="Reference / purpose"
                      value={withdrawal.reference}
                      onChange={e =>
                        setWithdrawal({
                          ...withdrawal,
                          reference: e.target.value,
                        })
                      }
                      required
                    />
                    <textarea
                      className="field-input mt-3 min-h-24"
                      placeholder="Explain the lawful non-gambling purpose"
                      value={withdrawal.note}
                      onChange={e =>
                        setWithdrawal({ ...withdrawal, note: e.target.value })
                      }
                      required
                    />
                    <button className="button-outline mt-4" type="submit">
                      Request compliance review
                    </button>
                  </form>
                </div>
              </section>
              <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm leading-6 text-red-100">
                <strong>Boundary:</strong> This wallet is not a betting or prize
                wallet. Gambling-related deposits, withdrawals, payouts or
                winnings are not supported.
              </div>
            </div>
          )}

          {tab === "support" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
              <form className="portal-card" onSubmit={submitTicket}>
                <div className="eyebrow">Help & support</div>
                <h2 className="mt-2 text-3xl">Open a support ticket.</h2>
                <select
                  className="field-input mt-6"
                  value={ticket.category}
                  onChange={e =>
                    setTicket({ ...ticket, category: e.target.value })
                  }
                >
                  <option>General support</option>
                  <option>Payment review</option>
                  <option>Membership</option>
                  <option>Security</option>
                  <option>Report content</option>
                </select>
                <input
                  className="field-input mt-3"
                  placeholder="Subject"
                  value={ticket.subject}
                  onChange={e =>
                    setTicket({ ...ticket, subject: e.target.value })
                  }
                  required
                />
                <textarea
                  className="field-input mt-3 min-h-32"
                  placeholder="Tell us how we can help"
                  value={ticket.message}
                  onChange={e =>
                    setTicket({ ...ticket, message: e.target.value })
                  }
                  required
                />
                <button className="button-red mt-4" type="submit">
                  Submit ticket
                </button>
              </form>
              <section className="portal-card">
                <div className="eyebrow">Your tickets</div>
                <div className="mt-4 space-y-3">
                  {ticketsQuery.data?.map(item => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <strong>{item.subject}</strong>
                        <span className="visibility-pill free-pill">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-[#9f9689]">
                        {item.category} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {!ticketsQuery.data?.length && (
                    <p className="text-[#9f9689]">No support tickets yet.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "security" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="portal-card">
                <div className="feature-icon">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="mt-5 text-2xl">Account security</h2>
                <p className="mt-3 leading-7 text-[#a79f93]">
                  Protect your account with provider authentication, session
                  monitoring and 2FA readiness.
                </p>
                <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 p-4">
                  <div>
                    <strong>Two-factor authentication</strong>
                    <div className="mt-1 text-sm text-[#9f9689]">
                      {securityQuery.data?.twoFactorEnabled
                        ? "Enabled"
                        : "Ready to enable"}
                    </div>
                  </div>
                  <button
                    className={
                      securityQuery.data?.twoFactorEnabled
                        ? "button-outline"
                        : "button-red"
                    }
                    onClick={() =>
                      toggle2fa.mutate({
                        enabled: !securityQuery.data?.twoFactorEnabled,
                      })
                    }
                  >
                    {securityQuery.data?.twoFactorEnabled
                      ? "Disable"
                      : "Enable"}
                  </button>
                </div>
              </section>
              <section className="portal-card">
                <div className="feature-icon">
                  <KeyRound size={18} />
                </div>
                <h2 className="mt-5 text-2xl">Sessions & recovery</h2>
                <ul className="mt-5 space-y-3 text-sm text-[#c8c0b5]">
                  <li className="flex gap-3">
                    <Check className="text-[#8ee3a8]" size={16} /> Connected
                    provider login
                  </li>
                  <li className="flex gap-3">
                    <Check className="text-[#8ee3a8]" size={16} />{" "}
                    Forgot-password recovery
                  </li>
                  <li className="flex gap-3">
                    <Check className="text-[#8ee3a8]" size={16} /> Account
                    notification history
                  </li>
                  <li className="flex gap-3">
                    <Check className="text-[#8ee3a8]" size={16} /> Audit-ready
                    security events
                  </li>
                </ul>
                <Link className="button-outline mt-6" href="/forgot-password">
                  Recovery options
                </Link>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NotificationList({
  notifications,
}: {
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    readAt: Date | null;
  }>;
}) {
  return (
    <section className="portal-card">
      <div className="flex items-center gap-3">
        <Bell className="text-[#f5bf45]" />
        <h2 className="text-2xl">Recent notifications</h2>
      </div>
      <div className="mt-4 space-y-2">
        {notifications.map(item => (
          <div
            key={item.id}
            className="flex gap-3 rounded-xl border border-white/10 p-3"
          >
            <Bell size={15} className="mt-1 text-[#f5bf45]" />
            <div>
              <strong>{item.title}</strong>
              <p className="mt-1 text-sm text-[#a79f93]">{item.message}</p>
            </div>
          </div>
        ))}
        {!notifications.length && (
          <p className="text-sm text-[#9f9689]">No new notifications.</p>
        )}
      </div>
    </section>
  );
}
