import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMe, useGetPlans, useGetMyTasks, useGetMyTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Wallet, TrendingUp, CheckCircle, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: plans } = useGetPlans();
  const { data: tasksData } = useGetMyTasks();
  const { data: transactions } = useGetMyTransactions();
  const { t } = useI18n();

  if (authLoading || !user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const activePlan = plans?.find(p => p.id === user.activePlanId);
  const completedTasks = tasksData?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = tasksData?.tasks.length || 0;
  const pendingTxs = transactions?.filter(t => t.status === 'pending').length || 0;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">{t("dashboard", "welcome")}, {user.username}!</h1>
        <p className="text-zinc-400">{t("dashboard", "subtitle")}</p>
      </div>

      {user.isSuspended && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-xl mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">{t("dashboard", "accountSuspended")}</h4>
            <p className="text-sm opacity-90">{t("dashboard", "suspendedDesc")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t("dashboard", "totalBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-primary mb-2">
              {formatCurrency(user.balance)}
            </div>
            <div className="flex gap-2">
              <Link href="/transactions">
                <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30">{t("dashboard", "deposit")}</Button>
              </Link>
              <Link href="/transactions">
                <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30">{t("dashboard", "withdraw")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Active Plan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t("dashboard", "activePlan")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {activePlan ? activePlan.name : t("dashboard", "noPlan")}
              {activePlan && <Badge variant="success">{t("common", "active")}</Badge>}
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              {activePlan ? `${t("dashboard", "dailyPotential")}: ${formatCurrency(activePlan.totalPerDay)}` : t("dashboard", "noPlanSubtitle")}
            </p>
            <Link href="/plans">
              <Button size="sm" variant={activePlan ? "outline" : "default"} className="w-full">
                {activePlan ? t("dashboard", "upgradePlan") : t("dashboard", "viewPlans")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t("dashboard", "todaysTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2 flex items-end gap-2">
              {completedTasks} <span className="text-lg text-zinc-500 mb-1">/ {totalTasks}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0}%` }}
              />
            </div>
            <Link href="/tasks">
              <Button size="sm" className="w-full" disabled={!activePlan || completedTasks === totalTasks}>
                {completedTasks === totalTasks ? t("dashboard", "allDone") : t("dashboard", "completeTasks")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Txs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t("dashboard", "pendingAction")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{pendingTxs}</div>
                <div className="text-sm text-zinc-400">{t("dashboard", "transactions")}</div>
              </div>
            </div>
            <Link href="/transactions">
              <Button size="sm" variant="outline" className="w-full">{t("dashboard", "viewHistory")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">{t("dashboard", "recentActivity")}</h2>
      <Card>
        <div className="divide-y divide-white/5">
          {transactions?.slice(0, 5).map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                )}>
                  {tx.type === 'deposit' ? <TrendingUp className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-white capitalize">
                    {tx.type === 'deposit' ? t("transactions", "deposit") : t("transactions", "withdrawal")}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(tx.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-bold", tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400')}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)} {tx.currency}
                </p>
                <Badge variant={tx.status === 'approved' ? 'success' : tx.status === 'rejected' ? 'destructive' : 'warning'} className="mt-1 text-[10px] px-1.5 py-0 h-4">
                  {tx.status === 'approved' ? t("common", "approved") : tx.status === 'rejected' ? t("common", "rejected") : t("common", "pending")}
                </Badge>
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <div className="p-8 text-center text-zinc-500">
              {t("dashboard", "noActivity")}
            </div>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
