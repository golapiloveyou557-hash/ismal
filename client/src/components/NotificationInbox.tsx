import { Bell, Check, Circle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function NotificationInbox() {
  const utils = trpc.useUtils();
  const query = trpc.notifications.mine.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.mine.invalidate();
    },
    onError: error =>
      toast.error(error.message || "Could not mark notification as read."),
  });
  const notifications = query.data ?? [];
  const unreadCount = notifications.filter(
    notification => !notification.readAt
  ).length;

  return (
    <section className="rounded-2xl border border-[#60491f] bg-[#121110] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="text-[#f5bf45]" />
          <h2 className="font-display text-xl font-bold">Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <span className="visibility-pill vip-pill">{unreadCount} new</span>
        )}
      </div>
      <div className="mt-5 space-y-3">
        {query.isLoading && (
          <div className="text-[#a79f93]">Loading notifications…</div>
        )}
        {!query.isLoading && notifications.length === 0 && (
          <div className="text-[#a79f93]">
            No notifications yet. Deposit review updates will appear here.
          </div>
        )}
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${notification.readAt ? "border-white/10 bg-black/10" : "border-[#f5bf45]/30 bg-[#f5bf45]/5"}`}
          >
            <div className="flex gap-3">
              <Circle
                size={10}
                className={`mt-1.5 shrink-0 ${notification.readAt ? "text-[#70685c]" : "fill-[#f5bf45] text-[#f5bf45]"}`}
              />
              <div>
                <div className="font-semibold">{notification.title}</div>
                <p className="mt-1 text-sm leading-6 text-[#b8afa4]">
                  {notification.message}
                </p>
                <div className="mt-2 text-xs text-[#817a70]">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            {!notification.readAt && (
              <button
                className="icon-button shrink-0"
                aria-label="Mark notification read"
                onClick={() => markRead.mutate({ id: notification.id })}
              >
                <Check size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
