import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, Mail, MailOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: number;
  title: string;
  message: string;
  targetType: "all" | "user";
  createdAt: string;
  isRead: boolean;
};

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) return [];
  return res.json();
}

async function markRead(id: number) {
  await fetch(`/api/notifications/${id}/read`, { method: "POST" });
}

async function markAllRead() {
  await fetch("/api/notifications/read-all", { method: "POST" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = notif.message.length > 120;

  function handleClick() {
    if (!notif.isRead) onRead(notif.id);
    if (isLong) setExpanded(e => !e);
  }

  return (
    <div
      className={cn(
        "px-4 py-3.5 flex items-start gap-3 transition-colors",
        !notif.isRead && "bg-amber-500/4",
        isLong ? "cursor-pointer hover:bg-white/5" : "hover:bg-white/4"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        notif.isRead
          ? "bg-white/5 border border-white/8"
          : "bg-amber-500/15 border border-amber-500/20"
      )}>
        {notif.isRead
          ? <MailOpen className="w-3.5 h-3.5 text-slate-500" />
          : <Mail className="w-3.5 h-3.5 text-amber-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn(
            "text-sm font-semibold leading-tight",
            notif.isRead ? "text-slate-400" : "text-white"
          )}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {notif.targetType === "user" && (
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-wider border border-cyan-500/20">
                Perso
              </span>
            )}
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 shrink-0" />
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          <motion.p
            key={expanded ? "expanded" : "collapsed"}
            initial={false}
            animate={{ height: "auto" }}
            className={cn(
              "text-xs leading-relaxed whitespace-pre-wrap break-words",
              notif.isRead ? "text-slate-500" : "text-slate-300",
              !expanded && isLong && "line-clamp-2"
            )}
          >
            {notif.message}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-slate-600">{timeAgo(notif.createdAt)}</p>
          {isLong && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); if (!notif.isRead) onRead(notif.id); }}
              className="flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
            >
              {expanded
                ? <><ChevronUp className="w-3 h-3" /> Réduire</>
                : <><ChevronDown className="w-3 h-3" /> Lire la suite</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationPanel({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const readMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "relative flex items-center justify-center rounded-xl transition-all duration-200",
          compact
            ? "w-9 h-9 text-slate-400 hover:text-white hover:bg-white/8"
            : "w-9 h-9 text-slate-400 hover:text-amber-400 hover:bg-amber-500/8",
          open && "text-amber-400 bg-amber-500/10"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-[3px] flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold leading-none shadow-sm shadow-amber-500/50"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-11 z-50 w-[340px] max-w-[calc(100vw-1rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
              style={{
                maxHeight: "min(520px, calc(100dvh - 180px))",
                background: "linear-gradient(160deg, hsl(220, 45%, 8%) 0%, hsl(222, 47%, 6%) 100%)",
                border: "1px solid hsl(220, 40%, 16%)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => readAllMutation.mutate()}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                      title="Tout marquer comme lu"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tout lire</span>
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/4">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Aucune notification</p>
                      <p className="text-xs text-slate-600 mt-0.5">Les messages de l'admin apparaîtront ici</p>
                    </div>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={id => readMutation.mutate(id)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
