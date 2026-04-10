import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui-core";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Trash2, Users, User, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminNotification = {
  id: number;
  title: string;
  message: string;
  targetType: "all" | "user";
  targetUserId: number | null;
  targetUsername: string | null;
  createdAt: string;
};

type UserOption = {
  id: number;
  username: string;
  email: string;
};

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

export default function AdminNotifications() {
  useRequireAuth(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUsername, setTargetUsername] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/admin");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 8);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { title, message, targetType };
      if (targetType === "user" && targetUserId) body.targetUserId = targetUserId;
      const res = await fetch("/api/notifications/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setTitle("");
      setMessage("");
      setTargetType("all");
      setTargetUserId(null);
      setTargetUsername("");
      setUserSearch("");
      toast({ title: "Notification envoyée", description: "Le message a été publié avec succès." });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/admin/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast({ title: "Supprimée", description: "Notification supprimée." });
    },
  });

  const canSubmit = title.trim() && message.trim() && (targetType === "all" || (targetType === "user" && targetUserId));

  return (
    <AppLayout adminMode>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Rédigez et envoyez des messages aux utilisateurs.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              Nouveau message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex : Maintenance programmée, Nouvelle fonctionnalité..."
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Rédigez votre message ici..."
                rows={4}
                maxLength={1000}
                className={cn(
                  "w-full rounded-xl px-3.5 py-2.5 text-sm resize-none transition-all duration-200",
                  "bg-white/4 border border-white/10 text-white placeholder:text-slate-600",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40"
                )}
              />
              <p className="text-xs text-slate-600 text-right">{message.length}/1000</p>
            </div>

            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetType("all")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    targetType === "all"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Tous les utilisateurs
                </button>
                <button
                  onClick={() => setTargetType("user")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    targetType === "user"
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                      : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"
                  )}
                >
                  <User className="w-4 h-4" />
                  Utilisateur spécifique
                </button>
              </div>
            </div>

            <AnimatePresence>
              {targetType === "user" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <Label>Rechercher un utilisateur</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        value={targetUserId ? targetUsername : userSearch}
                        onChange={e => {
                          setUserSearch(e.target.value);
                          setTargetUserId(null);
                          setTargetUsername("");
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                        placeholder="Rechercher par nom ou email..."
                        className={cn(
                          "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200",
                          "bg-white/4 border border-white/10 text-white placeholder:text-slate-600",
                          "focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30",
                          targetUserId && "border-cyan-500/40 text-cyan-300"
                        )}
                        readOnly={!!targetUserId}
                      />
                      {targetUserId && (
                        <button
                          onClick={() => { setTargetUserId(null); setTargetUsername(""); setUserSearch(""); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {showUserDropdown && !targetUserId && userSearch && filteredUsers.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-20 shadow-xl"
                          style={{ background: "hsl(220, 45%, 8%)", border: "1px solid hsl(220, 40%, 16%)" }}
                        >
                          {filteredUsers.map(u => (
                            <button
                              key={u.id}
                              onMouseDown={() => {
                                setTargetUserId(u.id);
                                setTargetUsername(u.username);
                                setShowUserDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-cyan-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-amber-400">{u.username.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">{u.username}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!canSubmit || createMutation.isPending}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer la notification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Notifications envoyées
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/6 text-slate-400 text-xs font-normal">
                {notifications.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Aucune notification envoyée pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-white/6 bg-white/3 group"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      notif.targetType === "all"
                        ? "bg-amber-500/15 border border-amber-500/20"
                        : "bg-cyan-500/15 border border-cyan-500/20"
                    )}>
                      {notif.targetType === "all"
                        ? <Users className="w-3.5 h-3.5 text-amber-400" />
                        : <User className="w-3.5 h-3.5 text-cyan-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{notif.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-600">{timeAgo(notif.createdAt)}</span>
                          {notif.targetType === "user" && notif.targetUsername && (
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-wide border border-cyan-500/15">
                              @{notif.targetUsername}
                            </span>
                          )}
                          {notif.targetType === "all" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wide border border-amber-500/15">
                              Tous
                            </span>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(notif.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
