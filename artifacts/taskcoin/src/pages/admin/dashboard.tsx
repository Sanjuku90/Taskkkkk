import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-core";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function AdminDashboard() {
  useRequireAuth(true); // requires admin
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) return <AppLayout adminMode><div className="p-12 text-center">Loading stats...</div></AppLayout>;

  return (
    <AppLayout adminMode>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-zinc-400">System-wide statistics and metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-sm text-zinc-500 mt-1">{stats.activeUsers} Active Subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4" /> Total Deposited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-400">{formatCurrency(stats.totalDeposited)}</div>
            <p className="text-sm text-zinc-500 mt-1">{stats.pendingDeposits} Pending Requests</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4" /> Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-rose-400">{formatCurrency(stats.totalWithdrawn)}</div>
            <p className="text-sm text-zinc-500 mt-1">{stats.pendingWithdrawals} Pending Requests</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
