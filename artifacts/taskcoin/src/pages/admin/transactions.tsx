import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetAdminTransactions, useValidateTransaction, getGetAdminTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, Button, Badge } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminTransactions() {
  useRequireAuth(true);
  const { data: transactions, isLoading } = useGetAdminTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const validateMutation = useValidateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminTransactionsQueryKey() });
        toast({ title: "Success", description: "Transaction status updated." });
      }
    }
  });

  const handleValidate = (txId: number, action: "approve" | "reject") => {
    validateMutation.mutate({ txId, data: { action } });
  };

  return (
    <AppLayout adminMode>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Review Transactions</h1>
        <p className="text-zinc-400">Approve or reject pending deposits and withdrawals.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Details (Hash/Address)</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
              ) : transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{tx.username}</div>
                    <div className="text-xs text-zinc-500">{tx.email}</div>
                  </td>
                  <td className="px-6 py-4 capitalize font-medium text-zinc-300">
                    {tx.type}
                  </td>
                  <td className={cn("px-6 py-4 font-bold whitespace-nowrap", tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400')}>
                    {formatCurrency(tx.amount)} {tx.currency}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-400 max-w-[200px] truncate" title={tx.txHash || tx.walletAddress || ''}>
                    {tx.txHash || tx.walletAddress || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={tx.status === 'approved' ? 'success' : tx.status === 'rejected' ? 'destructive' : 'warning'}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {tx.status === 'pending' ? (
                      <>
                        <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleValidate(tx.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={() => handleValidate(tx.id, 'reject')}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-zinc-600 italic text-xs">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
