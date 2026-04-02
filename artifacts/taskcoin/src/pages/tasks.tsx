import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTasks, useCompleteTask, getGetMyTasksQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, CircleDashed, Gift, Star, Zap, Users, TrendingUp, CreditCard, Calendar, Copy, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
    const interval = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [initialSeconds]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className="flex items-center gap-2 text-xl font-mono font-bold text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20">
      <Clock className="w-5 h-5" />
      <span>{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>
    </div>
  );
}

interface BonusTask {
  id: number;
  title: string;
  description: string | null;
  reward: number;
  expiresAt: string | null;
  completed: boolean;
  completedAt: string | null;
}

interface CatalogBonus {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: number;
  conditionValue: number;
  eligible: boolean;
  claimed: boolean;
  claimedAt: string | null;
  progress: number;
  total: number;
  progressLabel: string;
}

const CATALOG_TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  referral: { icon: Users, color: "text-violet-400" },
  first_deposit: { icon: CreditCard, color: "text-emerald-400" },
  deposit_milestone: { icon: TrendingUp, color: "text-blue-400" },
  plan_activation: { icon: CheckCircle2, color: "text-amber-400" },
  task_streak: { icon: Calendar, color: "text-rose-400" },
};

function useBonusTasks() {
  return useQuery<BonusTask[]>({
    queryKey: ["bonus-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/bonus");
      if (!res.ok) throw new Error("Failed to fetch bonus tasks");
      return res.json();
    },
  });
}

function useCatalogBonuses() {
  return useQuery<CatalogBonus[]>({
    queryKey: ["catalog-bonuses"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/catalog");
      if (!res.ok) throw new Error("Failed to fetch catalog bonuses");
      return res.json();
    },
  });
}

function useReferral() {
  return useQuery<{ referralCode: string | null; referralCount: number }>({
    queryKey: ["referral-info"],
    queryFn: async () => {
      const res = await fetch("/api/bonuses/referral");
      if (!res.ok) throw new Error("Failed to fetch referral info");
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete bonus task");
      }
      return res.json() as Promise<{ message: string; gain: number; newBalance: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bonus-tasks"] });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({
        title: "Bonus Task Completed!",
        description: `You earned ${formatCurrency(data.gain)}. New balance: ${formatCurrency(data.newBalance)}`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error?.message || "Could not complete bonus task.", variant: "destructive" });
    },
  });
}

function useClaimCatalogBonus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (bonusId: number) => {
      const res = await fetch(`/api/bonuses/catalog/${bonusId}/claim`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to claim bonus");
      }
      return res.json() as Promise<{ message: string; gain: number; newBalance: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-bonuses"] });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({
        title: "Bonus Claimed!",
        description: `You earned ${formatCurrency(data.gain)}. New balance: ${formatCurrency(data.newBalance)}`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Cannot Claim", description: error?.message || "Could not claim bonus.", variant: "destructive" });
    },
  });
}

export default function Tasks() {
  const { user } = useRequireAuth();
  const { data: tasksData, isLoading } = useGetMyTasks();
  const { data: bonusTasks, isLoading: bonusLoading } = useBonusTasks();
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
        toast({ 
          title: "Task Completed!", 
          description: `You earned ${formatCurrency(data.gain)}. New balance: ${formatCurrency(data.newBalance)}`,
        });
        setCompletingId(null);
      },
      onError: (error: any) => {
        toast({ title: "Task Failed", description: error?.message || "Could not complete task.", variant: "destructive" });
        setCompletingId(null);
      }
    }
  });

  const completeBonusMutation = useCompleteBonusTask();
  const claimCatalogMutation = useClaimCatalogBonus();

  const handleComplete = (taskId: number) => {
    setCompletingId(taskId);
    completeMutation.mutate({ taskId });
  };

  const handleCompleteBonus = async (taskId: number) => {
    setCompletingBonusId(taskId);
    try {
      await completeBonusMutation.mutateAsync(taskId);
    } finally {
      setCompletingBonusId(null);
    }
  };

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></AppLayout>;

  if (!tasksData?.plan) {
    return (
      <AppLayout>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Gift className="w-10 h-10 text-zinc-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">{t("tasks", "noActivePlan")}</h2>
          <p className="text-zinc-400 mb-8">{t("tasks", "noActivePlanSubtitle")}</p>
          <Link href="/plans">
            <Button size="lg" className="w-full">{t("tasks", "viewPlans")}</Button>
          </Link>
        </div>

        {bonusTasks && bonusTasks.length > 0 && (
          <div className="mt-12 max-w-2xl mx-auto">
            <BonusTasksSection bonusTasks={bonusTasks} onComplete={handleCompleteBonus} completingId={completingBonusId} suspended={!!user?.isSuspended} t={t} />
          </div>
        )}

        {catalogBonuses && catalogBonuses.length > 0 && (
          <div className="mt-12 max-w-2xl mx-auto">
            <CatalogBonusesSection
              bonuses={catalogBonuses}
              referralCode={(referralInfo as any)?.referralCode ?? null}
              onClaim={(id) => claimCatalogMutation.mutate(id)}
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

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">{t("tasks", "title")}</h1>
          <p className="text-zinc-400">{t("tasks", "subtitle")}</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">{t("tasks", "taskResets")}</span>
          <CountdownTimer initialSeconds={tasksData.secondsUntilReset} />
        </div>
      </div>

      <div className="mb-8 glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{t("tasks", "progressOverview")}</h3>
          <p className="text-sm text-zinc-400">{t("tasks", "plan")}: <span className="text-primary font-medium">{tasksData.plan.name}</span></p>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-white">{completedCount} / {totalCount} {t("tasks", "title")}</span>
            <span className="text-primary">{Math.round((completedCount/totalCount)*100)}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden inset-0">
            <div 
              className="bg-gradient-to-r from-amber-500 to-primary h-full rounded-full transition-all duration-1000 relative"
              style={{ width: `${(completedCount/totalCount)*100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {allDone && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl mb-8 flex flex-col items-center text-center gap-3"
        >
          <CheckCircle2 className="w-12 h-12" />
          <h2 className="text-2xl font-bold">{t("tasks", "allDone")}</h2>
          <p>{t("tasks", "allDoneSubtitle")}</p>
        </motion.div>
      )}

      <div className="grid gap-4 mb-10">
        {tasksData.tasks.map((task) => (
          <Card key={task.id} className={`transition-all duration-300 ${task.completed ? 'opacity-60 bg-zinc-900 border-white/5' : 'hover:border-primary/30'}`}>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {task.completed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                ) : (
                  <CircleDashed className="w-8 h-8 text-zinc-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-lg text-white">{t("tasks", "dailyTask")} {task.taskNumber}</h4>
                  <p className="text-sm text-zinc-400">{t("tasks", "reward")}: <span className="text-primary font-bold">{formatCurrency(task.gain)}</span></p>
                </div>
              </div>
              <div className="w-full sm:w-auto flex justify-end">
                {task.completed ? (
                  <Badge variant="success" className="px-4 py-2 text-sm">{t("tasks", "completedAt")} {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}</Badge>
                ) : (
                  <Button 
                    className="w-full sm:w-auto px-8" 
                    onClick={() => handleComplete(task.id)}
                    isLoading={completingId === task.id}
                    disabled={completingId !== null || user?.isSuspended}
                  >
                    {t("tasks", "complete")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!bonusLoading && bonusTasks && bonusTasks.length > 0 && (
        <BonusTasksSection bonusTasks={bonusTasks} onComplete={handleCompleteBonus} completingId={completingBonusId} suspended={!!user?.isSuspended} t={t} />
      )}

      {catalogBonuses && catalogBonuses.length > 0 && (
        <div className="mt-10">
          <CatalogBonusesSection
            bonuses={catalogBonuses}
            referralCode={(referralInfo as any)?.referralCode ?? null}
            onClaim={(id) => claimCatalogMutation.mutate(id)}
            claimingId={claimCatalogMutation.isPending ? (claimCatalogMutation.variables as number) : null}
            suspended={!!user?.isSuspended}
            t={t}
          />
        </div>
      )}
    </AppLayout>
  );
}

function BonusTasksSection({ bonusTasks, onComplete, completingId, suspended, t }: {
  bonusTasks: BonusTask[];
  onComplete: (id: number) => void;
  completingId: number | null;
  suspended: boolean;
  t: (section: string, key: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">{t("tasks", "specialBonuses")}</h2>
          <p className="text-sm text-zinc-400">{t("tasks", "specialBonusesSubtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {bonusTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-amber-500/20 transition-all duration-300 ${task.completed ? 'opacity-60 bg-zinc-900 border-white/5' : 'hover:border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent'}`}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {task.completed ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  ) : (
                    <Zap className="w-8 h-8 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg text-white">{task.title}</h4>
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">BONUS</Badge>
                    </div>
                    {task.description && <p className="text-sm text-zinc-400 mb-1">{task.description}</p>}
                    <p className="text-sm text-zinc-400">{t("tasks", "reward")}: <span className="text-amber-400 font-bold">{formatCurrency(task.reward)}</span></p>
                    {task.expiresAt && !task.completed && (
                      <p className="text-xs text-zinc-500 mt-1">{t("tasks", "expires")}: {new Date(task.expiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                  {task.completed ? (
                    <Badge variant="success" className="px-4 py-2 text-sm">{t("tasks", "completed")}</Badge>
                  ) : (
                    <Button
                      className="w-full sm:w-auto px-8 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                      onClick={() => onComplete(task.id)}
                      isLoading={completingId === task.id}
                      disabled={completingId !== null || suspended}
                    >
                      {t("tasks", "claimBonus")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CatalogBonusesSection({ bonuses, referralCode, onClaim, claimingId, suspended, t }: {
  bonuses: CatalogBonus[];
  referralCode: string | null;
  onClaim: (id: number) => void;
  claimingId: number | null;
  suspended: boolean;
  t: (section: string, key: string) => string;
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">{t("tasks", "rewardBonuses")}</h2>
          <p className="text-sm text-zinc-400">{t("tasks", "rewardBonusesSubtitle")}</p>
        </div>
      </div>

      {hasReferralBonus && referralCode && (
        <Card className="mb-6 border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white mb-1">{t("tasks", "shareReferral")}</p>
              <p className="text-xs text-zinc-400 mb-2">{t("tasks", "referralDesc")}</p>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-zinc-300 break-all">
                <span className="flex-1 truncate">{referralLink}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 flex items-center gap-2">
              <Copy className="w-4 h-4" />
              {t("common", "copy")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {bonuses.map((bonus) => {
          const meta = CATALOG_TYPE_META[bonus.type] ?? CATALOG_TYPE_META.first_deposit;
          const Icon = meta.icon;
          const pct = bonus.total > 0 ? Math.min(100, (bonus.progress / bonus.total) * 100) : 0;

          return (
            <motion.div
              key={bonus.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`transition-all duration-300 ${
                bonus.claimed
                  ? "opacity-60 bg-zinc-900 border-white/5"
                  : bonus.eligible
                  ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent hover:border-emerald-500/50"
                  : "hover:border-white/10"
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-white">{bonus.title}</h4>
                          {bonus.claimed && <Badge variant="success" className="text-xs">{t("common", "claimed")}</Badge>}
                          {!bonus.claimed && bonus.eligible && <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">{t("tasks", "readyToClaim")}</Badge>}
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">{bonus.description}</p>
                        <p className="text-sm text-zinc-400">
                          {t("tasks", "reward")}: <span className="text-amber-400 font-bold">{formatCurrency(bonus.reward)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex justify-end shrink-0">
                      {bonus.claimed ? (
                        <Badge variant="success" className="px-4 py-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {t("common", "claimed")}
                        </Badge>
                      ) : bonus.eligible ? (
                        <Button
                          className="w-full sm:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          onClick={() => onClaim(bonus.id)}
                          isLoading={claimingId === bonus.id}
                          disabled={claimingId !== null || suspended}
                        >
                          {t("tasks", "claimBonus")} ${bonus.reward}
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-500 font-mono">{Math.round(pct)}%</span>
                      )}
                    </div>
                  </div>

                  {!bonus.claimed && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>{bonus.progressLabel}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            bonus.eligible ? "bg-emerald-500" : "bg-primary/70"
                          }`}
                          style={{ width: `${pct}%` }}
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
