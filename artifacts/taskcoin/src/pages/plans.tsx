import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetPlans, useActivatePlan, getGetMeQueryKey, getGetMyTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Shield } from "lucide-react";
import { useState } from "react";

export default function Plans() {
  const { user } = useRequireAuth();
  const { data: plans, isLoading } = useGetPlans();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const activateMutation = useActivatePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTasksQueryKey() });
        toast({ title: "Success", description: "Plan activated successfully! You can now complete your tasks." });
        setActivatingId(null);
      },
      onError: (error: any) => {
        toast({ title: "Activation Failed", description: error?.message || "Insufficient balance or invalid plan.", variant: "destructive" });
        setActivatingId(null);
      }
    }
  });

  const handleActivate = (planId: number) => {
    if (!user) return;
    const plan = plans?.find(p => p.id === planId);
    if (plan && user.balance < plan.depositRequired) {
      toast({ title: "Insufficient Balance", description: `You need ${formatCurrency(plan.depositRequired)} to activate this plan. Please deposit funds first.`, variant: "destructive" });
      return;
    }
    setActivatingId(planId);
    activateMutation.mutate({ data: { planId } });
  };

  return (
    <AppLayout>
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Investment Plans</h1>
        <p className="text-zinc-400">Choose a tier that matches your investment goals. Higher tiers unlock more daily tasks and greater rewards per task.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans?.map((plan) => {
            const isActive = user?.activePlanId === plan.id;
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 ${isActive ? 'border-primary shadow-lg shadow-primary/20 bg-gradient-to-b from-primary/5 to-transparent' : ''}`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                    CURRENT PLAN
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 border-b border-white/5">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="flex justify-center items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{formatCurrency(plan.depositRequired)}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">Required Deposit</p>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>{plan.tasksPerDay} Daily Tasks</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>{formatCurrency(plan.gainPerTask)} per task</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-white">
                      <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{formatCurrency(plan.totalPerDay)} Daily Profit</span>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    <Button 
                      className="w-full" 
                      variant={isActive ? "outline" : "default"}
                      disabled={isActive || activatingId === plan.id || user?.isSuspended}
                      isLoading={activatingId === plan.id}
                      onClick={() => handleActivate(plan.id)}
                    >
                      {isActive ? "Currently Active" : "Activate Plan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
