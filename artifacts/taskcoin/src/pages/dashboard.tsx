import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMe, useGetPlans, useGetMyTasks, useGetMyTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Wallet, TrendingUp, CheckCircle, ArrowRightLeft, AlertCircle, Crown, Zap, ArrowDownToLine, ArrowUpFromLine, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

function StatCard({
  label, value, sub, icon: Icon, gradient, iconBg, iconColor, delay = 0, children
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ElementType;
  gradient: string; iconBg: string; iconColor: string; delay?: number; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} border-white/8 h-full`}>
        <div className="absolute top-0 right-0 p-5 opacity-[0.06]">
          <Icon className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} border flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-white leading-none mb-1">{value}</div>
              {sub && <div className="text-xs text-zinc-500">{sub}</div>}
            </div>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: plans } = useGetPlans();
  const { data: tasksData } = useGetMyTasks();
  const { data: transactions } = useGetMyTransactions();
  const { t } = useI18n();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center animate-pulse">
            <Crown className="w-6 h-6 text-zinc-950" />
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const activePlan = plans?.find(p => p.id === user.activePlanId);
  const completedTasks = tasksData?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = tasksData?.tasks.length || 0;
  const pendingTxs = transactions?.filter(t => t.status === "pending").length || 0;
  const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-zinc-500 text-sm mb-1">{t("dashboard", "subtitle")}</p>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                {t("dashboard", "welcome")}, <span className="gradient-text">{user.username}</span> 👋
              </h1>
            </div>
            {activePlan && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{activePlan.name}</span>
                <Badge variant="success" className="text-[10px]">Actif</Badge>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {user.isSuspended && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/30 p-4 rounded-2xl mb-8 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
          <div>
            <h4 className="font-semibold text-white">{t("dashboard", "accountSuspended")}</h4>
            <p className="text-sm text-zinc-400">{t("dashboard", "suspendedDesc")}</p>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t("dashboard", "totalBalance")}
          value={<span className="text-primary text-glow">{formatCurrency(user.balance)}</span>}
          icon={Wallet}
          gradient="from-primary/8 to-transparent"
          iconBg="bg-primary/15 border-primary/25"
          iconColor="text-primary"
          delay={0}
        >
          <div className="flex gap-2 mt-1">
            <Link href="/transactions">
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                {t("dashboard", "deposit")}
              </Button>
            </Link>
            <Link href="/transactions">
              <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 gap-1.5">
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                {t("dashboard", "withdraw")}
              </Button>
            </Link>
          </div>
        </StatCard>

        <StatCard
          label={t("dashboard", "activePlan")}
          value={activePlan ? activePlan.name : <span className="text-zinc-500 text-xl">{t("dashboard", "noPlan")}</span>}
          sub={activePlan ? `${t("dashboard", "dailyPotential")}: ${formatCurrency(activePlan.totalPerDay)}` : t("dashboard", "noPlanSubtitle")}
          icon={Crown}
          gradient="from-amber-500/8 to-transparent"
          iconBg="bg-amber-500/15 border-amber-500/25"
          iconColor="text-amber-400"
          delay={0.06}
        >
          <Link href="/plans" className="block mt-2">
            <Button size="sm" variant={activePlan ? "outline" : "default"} className="w-full h-8 text-xs">
              {activePlan ? t("dashboard", "upgradePlan") : t("dashboard", "viewPlans")}
            </Button>
          </Link>
        </StatCard>

        <StatCard
          label={t("dashboard", "todaysTasks")}
          value={
            <span className="flex items-baseline gap-1.5">
              {completedTasks}
              <span className="text-xl text-zinc-600">/ {totalTasks}</span>
            </span>
          }
          icon={CheckCircle}
          gradient="from-emerald-500/8 to-transparent"
          iconBg="bg-emerald-500/15 border-emerald-500/25"
          iconColor="text-emerald-400"
          delay={0.12}
        >
          <div className="mt-2 space-y-2">
            <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
              />
            </div>
            <Link href="/tasks">
              <Button size="sm" className="w-full h-8 text-xs" disabled={!activePlan || completedTasks === totalTasks}>
                {completedTasks === totalTasks && totalTasks > 0 ? t("dashboard", "allDone") : t("dashboard", "completeTasks")}
              </Button>
            </Link>
          </div>
        </StatCard>

        <StatCard
          label={t("dashboard", "pendingAction")}
          value={pendingTxs}
          sub={t("dashboard", "transactions")}
          icon={ArrowRightLeft}
          gradient="from-orange-500/8 to-transparent"
          iconBg="bg-orange-500/15 border-orange-500/25"
          iconColor="text-orange-400"
          delay={0.18}
        >
          <Link href="/transactions" className="block mt-3">
            <Button size="sm" variant="outline" className="w-full h-8 text-xs">
              {t("dashboard", "viewHistory")}
            </Button>
          </Link>
        </StatCard>
      </div>

      {/* Recent activity */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{t("dashboard", "recentActivity")}</h2>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1 text-xs">
            Tout voir <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <Card>
        <div className="divide-y divide-white/5">
          {transactions?.slice(0, 6).map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="p-4 flex items-center justify-between hover:bg-white/3 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  tx.type === "deposit" ? "bg-emerald-500/12 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/12 border border-rose-500/20 text-rose-400"
                )}>
                  {tx.type === "deposit" ? <ArrowDownToLine className="w-4.5 h-4.5" /> : <ArrowUpFromLine className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm capitalize">
                    {tx.type === "deposit" ? t("transactions", "deposit") : t("transactions", "withdrawal")}
                  </p>
                  <p className="text-xs text-zinc-600">{formatDate(tx.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-bold text-sm", tx.type === "deposit" ? "text-emerald-400" : "text-rose-400")}>
                  {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)} <span className="text-xs font-normal opacity-60">{tx.currency}</span>
                </p>
                <Badge
                  variant={tx.status === "approved" ? "success" : tx.status === "rejected" ? "destructive" : "warning"}
                  className="mt-1 text-[10px] px-1.5 py-0 h-4"
                >
                  {tx.status === "approved" ? t("common", "approved") : tx.status === "rejected" ? t("common", "rejected") : t("common", "pending")}
                </Badge>
              </div>
            </motion.div>
          ))}

          {(!transactions || transactions.length === 0) && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">{t("dashboard", "noActivity")}</p>
              <Link href="/transactions">
                <Button size="sm" variant="outline" className="mt-4 gap-2">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Faire un dépôt
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
