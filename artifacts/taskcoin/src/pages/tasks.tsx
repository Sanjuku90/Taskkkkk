import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTasks, useCompleteTask, getGetMyTasksQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, CircleDashed, Gift, Star, Zap, Users, TrendingUp, CreditCard, Calendar, Copy, BookOpen, Crown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    setSeconds(initialSeconds);
    const interval = setInterval(() => setSeconds(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [initialSeconds]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return (
    <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="font-mono font-bold text-amber-400 text-lg tabular-nums">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

interface BonusTask {
  id: number; title: string; description: string | null;
  reward: number; expiresAt: string | null; completed: boolean; completedAt: string | null;
}
interface CatalogBonus {
  id: number; type: string; title: string; description: string;
  reward: number; conditionValue: number; eligible: boolean; claimed: boolean;
  claimedAt: string | null; progress: number; total: number; progressLabel: string;
}

const CATALOG_TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  referral: { icon: Users, color: "text-violet-400", bg: "bg-violet-500/12", border: "border-violet-500/20" },
  first_deposit: { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/12", border: "border-emerald-500/20" },
  deposit_milestone: { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/12", border: "border-blue-500/20" },
  plan_activation: { icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/12", border: "border-amber-500/20" },
  task_streak: { icon: Calendar, color: "text-rose-400", bg: "bg-rose-500/12", border: "border-rose-500/20" },
};

function useBonusTasks() {
  return useQuery<BonusTask[]>({
    queryKey: ["bonus-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/bonus");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}
function useCatalogBonuses() {
  return useQuery<CatalogBonus[]>({
    queryKey: ["catalog-bonuses"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/catalog");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}
function useReferral() {
  return useQuery<{ referralCode: string | null; referralCount: number }>({
    queryKey: ["referral-info"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/referral");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}
function useCompleteBonusTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/tasks/bonus/${taskId}/complete`, { method: "POST" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      return res.json() as Promise<{ message: string; gain: number; newBalance: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bonus-tasks"] });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Bonus réclamé !", description: `Vous avez gagné ${formatCurrency(data.gain)}.` });
    },
    onError: (e: any) => toast({ title: "Échec", description: e?.message, variant: "destructive" }),
  });
}
function useClaimCatalogBonus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (bonusId: number) => {
      const res = await fetch(`/api/bonuses/catalog/${bonusId}/claim`, { method: "POST" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      return res.json() as Promise<{ message: string; gain: number; newBalance: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-bonuses"] });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Bonus réclamé !", description: `Vous avez gagné ${formatCurrency(data.gain)}.` });
    },
    onError: (e: any) => toast({ title: "Impossible de réclamer", description: e?.message, variant: "destructive" }),
  });
}

export default function Tasks() {
  const { user } = useRequireAuth();
  const { data: tasksData, isLoading } = useGetMyTasks();
  const { data: bonusTasks } = useBonusTasks();
  const { data: catalogBonuses } = useCatalogBonuses();
  const { data: referralInfo } = useReferral();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completingBonusId, setCompletingBonusId] = useState<number | null>(null);

  const completeMutation = useCompleteTask({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMyTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Tâche complétée !", description: `Vous avez gagné ${formatCurrency(data.gain)}.` });
        setCompletingId(null);
      },
      onError: (e: any) => {
        toast({ title: "Échec", description: e?.message, variant: "destructive" });
        setCompletingId(null);
      },
    },
  });

  const completeBonusMutation = useCompleteBonusTask();
  const claimCatalogMutation = useClaimCatalogBonus();

  const handleComplete = (taskId: number) => { setCompletingId(taskId); completeMutation.mutate({ taskId }); };
  const handleCompleteBonus = async (taskId: number) => {
    setCompletingBonusId(taskId);
    try { await completeBonusMutation.mutateAsync(taskId); } finally { setCompletingBonusId(null); }
  };

  if (isLoading) return (
    <AppLayout>
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!tasksData?.plan) {
    return (
      <AppLayout>
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-600/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">{t("tasks", "noActivePlan")}</h2>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">{t("tasks", "noActivePlanSubtitle")}</p>
          <Link href="/plans">
            <Button size="lg" className="w-full shine-effect gap-2">
              <Crown className="w-5 h-5" />
              {t("tasks", "viewPlans")}
            </Button>
          </Link>
        </div>

        {bonusTasks && bonusTasks.length > 0 && (
          <div className="mt-12 max-w-2xl mx-auto">
            <BonusTasksSection bonusTasks={bonusTasks} onComplete={handleCompleteBonus} completingId={completingBonusId} suspended={!!user?.isSuspended} t={t} />
          </div>
        )}
        {catalogBonuses && catalogBonuses.length > 0 && (
          <div className="mt-10 max-w-2xl mx-auto">
            <CatalogBonusesSection
              bonuses={catalogBonuses}
              referralCode={(referralInfo as any)?.referralCode ?? null}
              onClaim={id => claimCatalogMutation.mutate(id)}
              claimingId={claimCatalogMutation.isPending ? (claimCatalogMutation.variables as number) : null}
              suspended={!!user?.isSuspended}
              t={t}
            />
          </div>
        )}
      </AppLayout>
    );
  }

  const completedCount = tasksData.tasks.filter(t => t.completed).length;
  const totalCount = tasksData.tasks.length;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mb-1">{t("tasks", "title")}</h1>
          <p className="text-zinc-500 text-sm">{t("tasks", "subtitle")}</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{t("tasks", "taskResets")}</p>
          <CountdownTimer initialSeconds={tasksData.secondsUntilReset} />
        </div>
      </div>

      {/* Progress overview */}
      <Card className="mb-6 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="shrink-0">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - progressPct }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{Math.round(progressPct)}%</span>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white">{t("tasks", "progressOverview")}</h3>
            <Badge variant="default" className="text-[10px]">{tasksData.plan.name}</Badge>
          </div>
          <div className="w-full bg-white/6 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-amber-500 to-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            <span className="text-white font-semibold">{completedCount}</span> / {totalCount} {t("tasks", "title")} complétées
          </p>
        </div>
      </Card>

      {/* All done banner */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/25 p-6 rounded-2xl mb-8 flex items-center gap-4 text-emerald-400"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t("tasks", "allDone")}</h2>
            <p className="text-sm text-emerald-400/80">{t("tasks", "allDoneSubtitle")}</p>
          </div>
        </motion.div>
      )}

      {/* Task list */}
      <div className="grid gap-3 mb-10">
        {tasksData.tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={cn(
              "transition-all duration-300",
              task.completed ? "opacity-50 border-white/4" : "hover:border-primary/25 hover:-translate-y-0.5"
            )}>
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                  task.completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                )}>
                  {task.completed
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <CircleDashed className="w-5 h-5 text-zinc-600" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-white text-sm sm:text-base">{t("tasks", "dailyTask")} #{task.taskNumber}</h4>
                    {task.completed && <Badge variant="success" className="text-[10px] h-4 px-1.5">✓</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {t("tasks", "reward")}:{" "}
                    <span className={cn("font-bold", task.completed ? "text-emerald-400" : "text-primary")}>
                      +{formatCurrency(task.gain)}
                    </span>
                    {task.completed && task.completedAt && (
                      <span className="ml-2 text-zinc-700">{new Date(task.completedAt).toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>

                {/* Action */}
                {!task.completed && (
                  <Button
                    size="sm"
                    className="shrink-0 px-5 sm:px-8 gap-2 shine-effect"
                    onClick={() => handleComplete(task.id)}
                    isLoading={completingId === task.id}
                    disabled={completingId !== null || user?.isSuspended}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {t("tasks", "complete")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bonus tasks */}
      {bonusTasks && bonusTasks.length > 0 && (
        <BonusTasksSection bonusTasks={bonusTasks} onComplete={handleCompleteBonus} completingId={completingBonusId} suspended={!!user?.isSuspended} t={t} />
      )}

      {/* Catalog bonuses */}
      {catalogBonuses && catalogBonuses.length > 0 && (
        <div className="mt-10">
          <CatalogBonusesSection
            bonuses={catalogBonuses}
            referralCode={(referralInfo as any)?.referralCode ?? null}
            onClaim={id => claimCatalogMutation.mutate(id)}
            claimingId={claimCatalogMutation.isPending ? (claimCatalogMutation.variables as number) : null}
            suspended={!!user?.isSuspended}
            t={t}
          />
        </div>
      )}
    </AppLayout>
  );
}

function SectionHeader({ icon: Icon, iconBg, iconColor, title, subtitle }: {
  icon: React.ElementType; iconBg: string; iconColor: string; title: string; subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

function BonusTasksSection({ bonusTasks, onComplete, completingId, suspended, t }: {
  bonusTasks: BonusTask[]; onComplete: (id: number) => void;
  completingId: number | null; suspended: boolean; t: (s: string, k: string) => string;
}) {
  return (
    <div className="mb-10">
      <SectionHeader
        icon={Star}
        iconBg="bg-amber-500/12 border-amber-500/25"
        iconColor="text-amber-400"
        title={t("tasks", "specialBonuses")}
        subtitle={t("tasks", "specialBonusesSubtitle")}
      />
      <div className="grid gap-4">
        {bonusTasks.map((task, i) => (
          <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className={cn(
              "transition-all duration-300",
              task.completed ? "opacity-50 border-white/5" : "border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent hover:border-amber-500/35"
            )}>
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={cn(
                    "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                    task.completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/12 border-amber-500/20"
                  )}>
                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Zap className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{task.title}</h4>
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">BONUS</Badge>
                    </div>
                    {task.description && <p className="text-xs text-zinc-500 mb-1">{task.description}</p>}
                    <p className="text-xs text-zinc-500">{t("tasks", "reward")}: <span className="text-amber-400 font-bold">{formatCurrency(task.reward)}</span></p>
                    {task.expiresAt && !task.completed && (
                      <p className="text-[10px] text-zinc-600 mt-1">{t("tasks", "expires")}: {new Date(task.expiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                {task.completed ? (
                  <Badge variant="success" className="px-4 py-2 text-sm shrink-0">✓ {t("tasks", "completed")}</Badge>
                ) : (
                  <Button
                    className="shrink-0 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold gap-2 shine-effect"
                    onClick={() => onComplete(task.id)}
                    isLoading={completingId === task.id}
                    disabled={completingId !== null || suspended}
                  >
                    <Gift className="w-4 h-4" />
                    {t("tasks", "claimBonus")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CatalogBonusesSection({ bonuses, referralCode, onClaim, claimingId, suspended, t }: {
  bonuses: CatalogBonus[]; referralCode: string | null;
  onClaim: (id: number) => void; claimingId: number | null; suspended: boolean; t: (s: string, k: string) => string;
}) {
  const { toast } = useToast();
  const referralLink = referralCode
    ? `${window.location.origin}${import.meta.env.BASE_URL}register?ref=${referralCode}`
    : null;

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: t("common", "copied"), description: referralLink });
  };

  const hasReferralBonus = bonuses.some(b => b.type === "referral");

  return (
    <div>
      <SectionHeader
        icon={BookOpen}
        iconBg="bg-violet-500/12 border-violet-500/25"
        iconColor="text-violet-400"
        title={t("tasks", "rewardBonuses")}
        subtitle={t("tasks", "rewardBonusesSubtitle")}
      />

      {hasReferralBonus && referralCode && (
        <Card className="mb-5 border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("tasks", "shareReferral")}</p>
                <p className="text-xs text-zinc-500">{t("tasks", "referralDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-white/8 rounded-xl px-3 py-2 overflow-hidden">
                <span className="block font-mono text-xs text-zinc-400 truncate">{referralLink}</span>
              </div>
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                {t("common", "copy")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {bonuses.map((bonus, i) => {
          const meta = CATALOG_TYPE_META[bonus.type] ?? CATALOG_TYPE_META.first_deposit;
          const Icon = meta.icon;
          const pct = bonus.total > 0 ? Math.min(100, (bonus.progress / bonus.total) * 100) : 0;

          return (
            <motion.div key={bonus.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={cn(
                "transition-all duration-300",
                bonus.claimed ? "opacity-55 border-white/5" :
                  bonus.eligible ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent" :
                    "hover:border-white/12"
              )}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.bg} ${meta.border}`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">{bonus.title}</h4>
                          {bonus.claimed && <Badge variant="success" className="text-[10px]">{t("common", "claimed")}</Badge>}
                          {!bonus.claimed && bonus.eligible && <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">{t("tasks", "readyToClaim")}</Badge>}
                        </div>
                        <p className="text-xs text-zinc-500 mb-2 leading-relaxed">{bonus.description}</p>
                        <p className="text-xs text-zinc-500">{t("tasks", "reward")}: <span className="text-amber-400 font-bold">{formatCurrency(bonus.reward)}</span></p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {bonus.claimed ? (
                        <Badge variant="success" className="px-3 py-1.5">✓ {t("common", "claimed")}</Badge>
                      ) : bonus.eligible ? (
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shine-effect"
                          onClick={() => onClaim(bonus.id)}
                          isLoading={claimingId === bonus.id}
                          disabled={claimingId !== null || suspended}
                          size="sm"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          {t("tasks", "claimBonus")} +${bonus.reward}
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono bg-white/5 px-3 py-1.5 rounded-lg">{Math.round(pct)}%</span>
                      )}
                    </div>
                  </div>

                  {!bonus.claimed && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-zinc-600 mb-1.5">
                        <span>{bonus.progressLabel}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className={cn(
                            "h-full rounded-full",
                            bonus.eligible ? "bg-emerald-500" : `bg-gradient-to-r ${meta.color.replace("text-", "from-").split("-")[0]}-500 to-transparent`
                          )}
                          style={{ background: bonus.eligible ? undefined : `var(--tw-gradient-from, hsl(var(--primary)))` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
