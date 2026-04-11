import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetPlans, useActivatePlan, useCreateTransaction, useGetMyTransactions, getGetMeQueryKey, getGetMyTasksQueryKey, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge, Modal, Label, Input } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Zap, Shield, Star, TrendingUp, Lock, Copy, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SUBSCRIPTION_DURATION_DAYS = 6;

function useSubscriptionCountdown(activatedAt: string | null | undefined) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);

  useEffect(() => {
    if (!activatedAt) { setRemaining(null); return; }
    const calc = () => {
      const expiry = new Date(activatedAt).getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000;
      const diff = expiry - Date.now();
      if (diff <= 0) { setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [activatedAt]);

  return remaining;
}

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

const SUBSCRIPTION_ADDRESS = "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS";

export default function Plans() {
  const { user } = useRequireAuth();
  const { data: plans, isLoading } = useGetPlans();
  const { data: transactions } = useGetMyTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [subHash, setSubHash] = useState("");

  const currentPlan = plans?.find(p => p.id === user?.activePlanId);
  const currentPlanDeposit = currentPlan ? currentPlan.depositRequired : -1;

  const hasPendingSubscription = transactions?.some(
    tx => (tx.type as string) === "subscription" && tx.status === "pending"
  ) ?? false;
  const subscriptionActive = user?.subscriptionActive ?? false;
  const isSelected = user?.isSubscriptionSelected ?? false;
  const subscriptionPrice = isSelected ? 9 : 40;
  const countdown = useSubscriptionCountdown(subscriptionActive ? user?.subscriptionActivatedAt : null);

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

  const subscriptionMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        toast({ title: "Abonnement soumis !", description: `Votre paiement de ${subscriptionPrice}$ est en attente de validation. L'accès sera activé sous peu.` });
        setIsSubscribeOpen(false);
        setSubHash("");
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error?.message || "Impossible de soumettre l'abonnement.", variant: "destructive" });
      },
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    subscriptionMutation.mutate({ data: { type: "subscription", amount: subscriptionPrice, currency: "USDT", txHash: subHash } });
  };

  const copySubscriptionAddress = () => {
    navigator.clipboard.writeText(SUBSCRIPTION_ADDRESS);
    toast({ title: "Adresse copiée !", description: `Envoyez exactement ${subscriptionPrice} USDT (TRC20) à cette adresse.` });
  };

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

      {/* Retrait Rapide Subscription Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-10"
      >
        <div className={`relative rounded-3xl overflow-hidden border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 ${isSelected ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent" : "border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent"}`}>
          {/* Glow */}
          <div className={`absolute inset-0 pointer-events-none ${isSelected ? "bg-gradient-to-r from-amber-500/5 to-transparent" : "bg-gradient-to-r from-cyan-500/5 to-transparent"}`} />

          {/* Top-right badge */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isSelected ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"}`}>⚡ PREMIUM</span>
            {isSelected && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">✓ SÉLECTIONNÉ</span>
            )}
          </div>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 ${isSelected ? "bg-amber-500/15 border-amber-500/25" : "bg-cyan-500/15 border-cyan-500/25"}`}>
            <Zap className={`w-8 h-8 ${isSelected ? "text-amber-400" : "text-cyan-400"}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-white mb-1">Abonnement Retrait Rapide</h2>

            {isSelected ? (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 font-semibold">Vous avez été sélectionné par l'administrateur — tarif préférentiel de <span className="text-emerald-200">9$</span> au lieu de 40$</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-rose-500/8 border border-rose-500/15 w-fit">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-sm text-zinc-400">Vous n'êtes pas encore sélectionné — tarif standard de <span className="text-white font-semibold">40$</span></p>
              </div>
            )}

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Obtenez des retraits <span className={`font-semibold ${isSelected ? "text-amber-400" : "text-cyan-400"}`}>instantanés sans délai</span> — dépôt direct en USDT TRC20.
              Remboursement immédiat en cas de non-satisfaction.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-5">
              {[
                { icon: "⚡", text: "Retrait instantané" },
                { icon: "🔒", text: "Sans délai d'attente" },
                { icon: "↩️", text: "Remboursement garanti" },
                { icon: "💎", text: "USDT TRC20 uniquement" },
              ].map(({ icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
                  {icon} {text}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-baseline gap-2">
                {!isSelected && (
                  <span className="text-xl font-bold text-zinc-600 line-through">$40</span>
                )}
                <span className={`text-3xl font-display font-extrabold ${isSelected ? "text-amber-400" : "text-cyan-400"}`}>
                  ${subscriptionPrice}
                </span>
                <span className="text-zinc-500 text-sm">/mois</span>
                {isSelected && (
                  <span className="text-sm font-bold text-zinc-600 line-through ml-1">$40</span>
                )}
              </div>
              {subscriptionActive ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                    <Check className="w-4 h-4" />
                    Abonnement actif
                  </div>
                  {countdown && !countdown.expired && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/8">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-xs text-zinc-500 mr-1">Expire dans :</span>
                      <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
                        <span className="px-2 py-0.5 rounded-lg bg-white/8 text-cyan-300">{String(countdown.days).padStart(2, "0")}<span className="text-[9px] text-zinc-600 ml-0.5 font-normal">j</span></span>
                        <span className="text-zinc-700">:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/8 text-cyan-300">{String(countdown.hours).padStart(2, "0")}<span className="text-[9px] text-zinc-600 ml-0.5 font-normal">h</span></span>
                        <span className="text-zinc-700">:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/8 text-cyan-300">{String(countdown.minutes).padStart(2, "0")}<span className="text-[9px] text-zinc-600 ml-0.5 font-normal">m</span></span>
                        <span className="text-zinc-700">:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/8 text-cyan-300">{String(countdown.seconds).padStart(2, "0")}<span className="text-[9px] text-zinc-600 ml-0.5 font-normal">s</span></span>
                      </div>
                    </div>
                  )}
                  {countdown?.expired && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Abonnement expiré — veuillez renouveler
                    </div>
                  )}
                  {!countdown && (
                    <div className="text-xs text-zinc-600 px-1">Durée : 6 jours</div>
                  )}
                </div>
              ) : hasPendingSubscription ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-semibold">
                  <Clock className="w-4 h-4" />
                  En cours de validation…
                </div>
              ) : (
                <Button
                  className={isSelected ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/15 gap-2" : "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 gap-2"}
                  variant="outline"
                  onClick={() => setIsSubscribeOpen(true)}
                  disabled={user?.isSuspended}
                >
                  <Zap className="w-4 h-4" />
                  Souscrire maintenant
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {plans?.map((plan, i) => {
            const isActive = user?.activePlanId === plan.id;
            const isLocked = !isActive && currentPlanDeposit >= 0 && plan.depositRequired <= currentPlanDeposit;
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
                <div className={`relative glass-card rounded-3xl overflow-hidden bg-gradient-to-br ${tierStyle.gradient} border ${tierStyle.border} ${tierStyle.glow} transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col ${isActive ? "ring-2 ring-primary/50" : ""} ${isLocked ? "opacity-50 grayscale pointer-events-none" : ""}`}>
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
                      disabled={isActive || isLocked || activatingId === plan.id || user?.isSuspended}
                      isLoading={activatingId === plan.id}
                      onClick={() => handleActivate(plan.id)}
                    >
                      {isActive ? "✓ Plan actuel" : isLocked ? <><Lock className="w-3.5 h-3.5 mr-1.5 inline" />Non disponible</> : "Activer ce plan"}
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

      {/* SUBSCRIPTION MODAL */}
      <Modal
        isOpen={isSubscribeOpen}
        onClose={() => { setIsSubscribeOpen(false); setSubHash(""); }}
        title="Abonnement Retrait Rapide"
        description={`Payez ${subscriptionPrice}$ en USDT TRC20 pour activer les retraits instantanés sans délai.`}
      >
        {isSelected && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-semibold">Tarif préférentiel : <span className="text-amber-200">9$ USDT</span> (au lieu de 40$)</p>
          </div>
        )}

        <div className={`mb-6 rounded-2xl bg-gradient-to-br to-transparent border p-4 ${isSelected ? "from-amber-500/10 border-amber-500/20" : "from-cyan-500/10 border-cyan-500/20"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-cyan-400"}`} />
            <p className="text-sm font-semibold text-white">Adresse de paiement USDT TRC20</p>
          </div>
          <p className="text-xs text-zinc-500 mb-3">Envoyez exactement <span className={`font-bold ${isSelected ? "text-amber-400" : "text-cyan-400"}`}>{subscriptionPrice} USDT</span> sur le réseau Tron (TRC20).</p>
          <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-xl p-3">
            <span className="flex-1 font-mono text-xs text-zinc-300 truncate">{SUBSCRIPTION_ADDRESS}</span>
            <button
              onClick={copySubscriptionAddress}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mb-5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-400 mb-0.5">Remboursement garanti</p>
              <p className="text-xs text-zinc-400">En cas de non-satisfaction, votre remboursement est immédiat et sans conditions.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-2">
            <Label>Hash de la transaction</Label>
            <Input
              required
              value={subHash}
              onChange={e => setSubHash(e.target.value)}
              placeholder="Collez le hash de votre transaction USDT TRC20..."
            />
            <p className="text-xs text-zinc-600">Copiez le hash après avoir envoyé exactement {subscriptionPrice} USDT.</p>
          </div>
          <Button
            type="submit"
            className={`w-full gap-2 ${isSelected ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/15" : "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15"}`}
            variant="outline"
            isLoading={subscriptionMutation.isPending}
          >
            <Zap className="w-4 h-4" />
            Confirmer l'abonnement
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
