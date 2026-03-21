import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTasks, useCompleteTask, getGetMyTasksQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, CircleDashed, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

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

export default function Tasks() {
  const { user } = useRequireAuth();
  const { data: tasksData, isLoading } = useGetMyTasks();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);

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

  const handleComplete = (taskId: number) => {
    setCompletingId(taskId);
    completeMutation.mutate({ taskId });
  };

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></AppLayout>;

  if (!tasksData?.plan) {
    return (
      <AppLayout>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Gift className="w-10 h-10 text-zinc-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">No Active Plan</h2>
          <p className="text-zinc-400 mb-8">You need an active investment plan to receive daily tasks and earn rewards.</p>
          <Link href="/plans">
            <Button size="lg" className="w-full">View Investment Plans</Button>
          </Link>
        </div>
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
          <h1 className="text-4xl font-display font-bold text-white mb-2">Daily Tasks</h1>
          <p className="text-zinc-400">Complete these tasks to earn your daily ROI.</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Resets in</span>
          <CountdownTimer initialSeconds={tasksData.secondsUntilReset} />
        </div>
      </div>

      <div className="mb-8 glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Progress Overview</h3>
          <p className="text-sm text-zinc-400">Plan: <span className="text-primary font-medium">{tasksData.plan.name}</span></p>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-white">{completedCount} / {totalCount} Tasks</span>
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
          <h2 className="text-2xl font-bold">All tasks completed!</h2>
          <p>Great job! Come back tomorrow when the timer resets for more rewards.</p>
        </motion.div>
      )}

      <div className="grid gap-4">
        {tasksData.tasks.map((task, idx) => (
          <Card key={task.id} className={`transition-all duration-300 ${task.completed ? 'opacity-60 bg-zinc-900 border-white/5' : 'hover:border-primary/30'}`}>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {task.completed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                ) : (
                  <CircleDashed className="w-8 h-8 text-zinc-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-lg text-white">Daily Review Task {task.taskNumber}</h4>
                  <p className="text-sm text-zinc-400">Reward: <span className="text-primary font-bold">{formatCurrency(task.gain)}</span></p>
                </div>
              </div>
              
              <div className="w-full sm:w-auto flex justify-end">
                {task.completed ? (
                  <Badge variant="success" className="px-4 py-2 text-sm">Completed at {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}</Badge>
                ) : (
                  <Button 
                    className="w-full sm:w-auto px-8" 
                    onClick={() => handleComplete(task.id)}
                    isLoading={completingId === task.id}
                    disabled={completingId !== null || user?.isSuspended}
                  >
                    Complete Task
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
