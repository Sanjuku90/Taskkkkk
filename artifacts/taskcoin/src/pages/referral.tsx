import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Copy, Check, Gift, TrendingUp, UserCheck, Link2,
  ChevronRight, Star, Crown, Zap, CircleDashed
} from "lucide-react";

interface ReferredUser {
  id: number;
  username: string;
  joinedAt: string | null;
  hasActivePlan: boolean;
  totalDeposited: number;
}

interface ReferralData {
  referralCode: string | null;
  referralCount: number;
  referredUsers: ReferredUser[];
  totalReferralEarned: number;
}

interface CatalogBonus {
  id: number;
  type: string;
  title: string;
  reward: number;
  conditionValue: number;
  eligible: boolean;
  claimed: boolean;
  progress: number;
  total: number;
  progressLabel: string;
}

function useReferralData() {
  return useQuery<ReferralData>({
    queryKey: ["referral-data"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/referral");
      if (!res.ok) throw new Error("Failed to fetch referral data");
      return res.json();
    },
  });
}

function useReferralBonuses() {
  return useQuery<CatalogBonus[]>({
    queryKey: ["catalog-bonuses-referral"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/catalog");
      if (!res.ok) throw new Error("Failed to fetch bonuses");
      const all: CatalogBonus[] = await res.json();
      return all.filter(b => b.type === "referral");
    },
  });
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Referral() {
  useRequireAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const { data, isLoading } = useReferralData();
  const { data: bonuses } = useReferralBonuses();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}register`
    : "";
  const referralLink = data?.referralCode ? `${baseUrl}?ref=${data.referralCode}` : null;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: t("common", "copied"), description: referralLink });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const activePlanCount = data?.referredUsers.filter(u => u.hasActivePlan).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">{t("referral", "title")}</h1>
          </div>
          <p className="text-zinc-400 ml-[52px]">{t("referral", "subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <StatCard
              icon={Users}
              label={t("referral", "totalInvited")}
              value={data?.referralCount ?? 0}
              color="bg-violet-500/10 border border-violet-500/20 text-violet-400"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <StatCard
              icon={UserCheck}
              label={t("referral", "activePlans")}
              value={activePlanCount}
              color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <StatCard
              icon={Gift}
              label={t("referral", "totalEarned")}
              value={formatCurrency(data?.totalReferralEarned ?? 0)}
              color="bg-amber-500/10 border border-amber-500/20 text-amber-400"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Link Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-violet-400" />
                  <CardTitle>{t("referral", "yourLink")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-zinc-400 leading-relaxed">{t("referral", "linkDescription")}</p>

                {/* Referral URL */}
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Lien complet</p>
                  <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 overflow-hidden">
                    <p className="font-mono text-xs text-zinc-300 truncate">
                      {referralLink ?? (isLoading ? "Chargement…" : "Code non disponible")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={!referralLink}
                    className="w-full border-violet-500/40 text-violet-400 hover:bg-violet-500/10 gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t("common", "copied") : t("common", "copy")}
                  </Button>
                </div>

                {/* Code only */}
                {data?.referralCode && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{t("referral", "yourCode")}</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-5 py-3 font-mono text-lg font-bold text-violet-300 tracking-widest">
                        {data.referralCode}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="text-zinc-400 hover:text-white"
                      >
                        {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <CardTitle>{t("referral", "howItWorks")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: Link2, text: t("referral", "step1"), color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
                    { icon: Users, text: t("referral", "step2"), color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                    { icon: Gift, text: t("referral", "step3"), color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${step.color}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-sm text-zinc-300 leading-relaxed">{step.text}</p>
                      </div>
                      {i < 2 && <ChevronRight className="w-4 h-4 text-zinc-600 self-center hidden" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bonus Tiers */}
        {bonuses && bonuses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <CardTitle>{t("referral", "bonusTiers")}</CardTitle>
                </div>
                <p className="text-sm text-zinc-500 mt-1">{t("referral", "tierProgress")}</p>
              </CardHeader>
              <CardContent>
                <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bonuses.map((bonus) => {
                    const pct = Math.round((bonus.progress / bonus.total) * 100);
                    return (
                      <div
                        key={bonus.id}
                        className={`rounded-xl border p-4 space-y-3 transition-all ${
                          bonus.claimed
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : bonus.eligible
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-white/8 bg-white/3"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-white">{bonus.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{bonus.progressLabel}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-amber-400">{formatCurrency(bonus.reward)}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="w-full bg-white/8 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              className={`h-full rounded-full ${
                                bonus.claimed ? "bg-emerald-500" : bonus.eligible ? "bg-amber-400" : "bg-violet-500"
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {bonus.claimed ? (
                            <Badge variant="success" className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              {t("common", "claimed")}
                            </Badge>
                          ) : bonus.eligible ? (
                            <Badge variant="warning" className="text-xs">
                              {t("common", "eligible")} — {t("tasks", "bonuses")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-zinc-500">
                              <CircleDashed className="w-3 h-3 mr-1" />
                              {pct}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referred Users Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle>{t("referral", "friendsTable")}</CardTitle>
                </div>
                <Badge variant="outline" className="text-zinc-400">
                  {data?.referralCount ?? 0} {data?.referralCount === 1 ? "ami" : "amis"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!data || data.referredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">{t("referral", "noFriends")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("referral", "username")}</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("referral", "joinedOn")}</th>
                        <th className="text-center py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("referral", "planStatus")}</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("referral", "deposited")}</th>
                        <th className="text-center py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.referredUsers.map((u, i) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-white/3 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-white">{u.username}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-zinc-400">
                            {u.joinedAt
                              ? new Date(u.joinedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {u.hasActivePlan ? (
                              <Badge variant="success" className="text-xs">{t("referral", "hasPlan")}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-zinc-500">{t("referral", "noPlan")}</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-medium text-white">
                            {formatCurrency(u.totalDeposited)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {u.totalDeposited > 0 ? (
                              <Badge variant="success" className="text-xs">Qualifié</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">En attente</Badge>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
