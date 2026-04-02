import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTasks, useCompleteTask, getGetMyTasksQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, CircleDashed, Gift, Zap, Crown } from "lucide-react";
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

export default function Tasks() {
  const { user } = useRequireAuth();
  const { data: tasksData, isLoading } = useGetMyTasks();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [completingId, setCompletingId] = useState<number | null>(null);

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

  const handleComplete = (taskId: number) => { setCompletingId(taskId); completeMutation.mutate({ taskId }); };

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

    </AppLayout>
  );
}

