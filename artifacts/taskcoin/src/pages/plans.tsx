import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetPlans, useActivatePlan, getGetMeQueryKey, getGetMyTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Zap, Shield, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const TIER_STYLES: Record<number, { gradient: string; border: string; glow: string; badge?: string }> = {
  0: { gradient: "from-zinc-700/30 to-transparent", border: "border-white/8", glow: "" },
  1: { gradient: "from-zinc-600/30 to-transparent", border: "border-white/10", glow: "" },
  2: { gradient: "from-zinc-500/30 to-transparent", border: "border-white/10", glow: "" },
  3: { gradient: "from-amber-500/20 to-transparent", border: "border-amber-500/30", glow: "box-glow", badge: "⭐ Populaire" },
  4: { gradient: "from-violet-500/20 to-transparent", border: "border-violet-500/30", glow: "" },
  5: { gradient: "from-blue-500/20 to-transparent", border: "border-blue-500/30", glow: "" },
  6: { gradient: "from-primary/25 to-amber-600/10", border: "border-primary/40", glow: "box-glow-strong", badge: "👑 VIP Elite" },
};

const TIER_ICONS = [Shield, Shield, Shield, Star, TrendingUp, Crown, Crown];
const TIER_COLORS = [
  "text-zinc-400", "text-zinc-300", "text-zinc-200",
  "text-amber-400", "text-violet-400", "text-blue-400", "text-primary"
];

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
        toast({ title: "Plan activé !", description: "Vous pouvez maintenant compléter vos tâches quotidiennes." });
        setActivatingId(null);
      },
      onError: (error: any) => {
        toast({ title: "Activation échouée", description: error?.message || "Solde insuffisant ou plan invalide.", variant: "destructive" });
        setActivatingId(null);
      },
    },
  });

  const handleActivate = (planId: number) => {
    if (!user) return;
    const plan = plans?.find(p => p.id === planId);
    if (plan && user.balance < plan.depositRequired) {
      toast({
        title: "Solde insuffisant",
        description: `Vous avez besoin de ${formatCurrency(plan.depositRequired)} pour activer ce plan.`,
        variant: "destructive",
      });
      return;
    }
    setActivatingId(planId);
    activateMutation.mutate({ data: { planId } });
  };

  return (
    <AppLayout>
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-5">
            <Crown className="w-4 h-4" />
            Plans d'investissement
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-4">
            Choisissez votre <span className="gradient-text">niveau</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Investissez selon votre budget et déverrouillez plus de tâches quotidiennes avec des gains plus élevés par palier.
          </p>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {plans?.map((plan, i) => {
            const isActive = user?.activePlanId === plan.id;
            const tierStyle = TIER_STYLES[i] ?? TIER_STYLES[0];
            const TierIcon = TIER_ICONS[i] ?? Shield;
            const iconColor = TIER_COLORS[i] ?? "text-zinc-400";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className={`relative glass-card rounded-3xl overflow-hidden bg-gradient-to-br ${tierStyle.gradient} border ${tierStyle.border} ${tierStyle.glow} transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col ${isActive ? "ring-2 ring-primary/50" : ""}`}>
                  {/* Active banner */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary/50" />
                  )}

                  {/* Badge */}
                  {tierStyle.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary">
                        {tierStyle.badge}
                      </span>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="success" className="text-[10px]">Plan actuel</Badge>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6 mt-2">
                      <div className={`w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center`}>
                        <TierIcon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-white leading-none">{plan.name}</h3>
                        <p className="text-xs text-zinc-600 mt-0.5">Plan #{i + 1}</p>
                      </div>
                    </div>

                    {/* Deposit */}
                    <div className="text-center mb-6 py-4 rounded-2xl bg-white/4 border border-white/6">
                      <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Dépôt requis</p>
                      <p className={`text-4xl font-display font-extrabold ${i >= 5 ? "gradient-text" : "text-white"}`}>
                        {formatCurrency(plan.depositRequired)}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-zinc-300">
                          <span className="text-white font-semibold">{plan.tasksPerDay}</span> tâches / jour
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Zap className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-zinc-300">
                          <span className="text-white font-semibold">{formatCurrency(plan.gainPerTask)}</span> par tâche
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span>
                          <span className="text-emerald-400 font-bold">{formatCurrency(plan.totalPerDay)}</span>
                          <span className="text-zinc-500"> / jour</span>
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      className={`w-full ${i >= 5 ? "shine-effect" : ""}`}
                      variant={isActive ? "outline" : i >= 3 ? "default" : "outline"}
                      disabled={isActive || activatingId === plan.id || user?.isSuspended}
                      isLoading={activatingId === plan.id}
                      onClick={() => handleActivate(plan.id)}
                    >
                      {isActive ? "✓ Plan actuel" : "Activer ce plan"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-xs text-zinc-600">
          Le dépôt requis est débité de votre solde. Assurez-vous d'avoir le montant nécessaire avant d'activer un plan.
        </p>
      </motion.div>
    </AppLayout>
  );
}
