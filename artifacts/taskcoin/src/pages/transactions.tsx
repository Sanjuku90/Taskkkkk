import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTransactions, useCreateTransaction, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge, Input, Label, Modal } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, Copy } from "lucide-react";
// Re-export specific enums if needed, or use strings directly since zod allows it via schema typing
type TxType = "deposit" | "withdrawal";
type Currency = "USDT" | "TRX";

export default function Transactions() {
  const { user } = useRequireAuth();
  const { data: transactions, isLoading } = useGetMyTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Deposit Form State
  const [depAmount, setDepAmount] = useState("");
  const [depCurrency, setDepCurrency] = useState<Currency>("USDT");
  const [depHash, setDepHash] = useState("");
  
  // Withdraw Form State
  const [withAmount, setWithAmount] = useState("");
  const [withCurrency, setWithCurrency] = useState<Currency>("USDT");
  const [withAddress, setWithAddress] = useState("");

  const createTxMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        toast({ title: "Request Submitted", description: "Your transaction is pending admin approval." });
        setIsDepositOpen(false);
        setIsWithdrawOpen(false);
        // Reset forms
        setDepAmount(""); setDepHash("");
        setWithAmount(""); setWithAddress("");
      },
      onError: (error: any) => {
        toast({ title: "Request Failed", description: error?.message || "Invalid input or blocked.", variant: "destructive" });
      }
    }
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    createTxMutation.mutate({
      data: {
        type: "deposit",
        amount: Number(depAmount),
        currency: depCurrency,
        txHash: depHash
      }
    });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    createTxMutation.mutate({
      data: {
        type: "withdrawal",
        amount: Number(withAmount),
        currency: withCurrency,
        walletAddress: withAddress
      }
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText("TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS");
    toast({ title: "Copied!", description: "Deposit address copied to clipboard." });
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Transactions</h1>
          <p className="text-zinc-400">Manage your deposits and withdrawals.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsDepositOpen(true)}>
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Deposit
          </Button>
          <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={() => setIsWithdrawOpen(true)}>
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Type / Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Currency</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
              ) : transactions?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No transactions found.</td></tr>
              ) : (
                transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}>
                          {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-white capitalize">{tx.type}</div>
                          <div className="text-xs text-zinc-500">{formatDate(tx.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300">
                      {tx.currency}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge variant={tx.status === 'approved' ? 'success' : tx.status === 'rejected' ? 'destructive' : 'warning'}>
                          {tx.status}
                        </Badge>
                        {tx.status === 'rejected' && tx.note && (
                          <div className="text-xs text-rose-400/80 max-w-[180px] leading-snug">{tx.note}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs text-zinc-500 font-mono">
                      {tx.txHash ? `Hash: ${tx.txHash.substring(0,8)}...` : tx.walletAddress ? `To: ${tx.walletAddress.substring(0,8)}...` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DEPOSIT MODAL */}
      <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title="Make a Deposit" description="Send funds to the address below and submit the transaction hash.">
        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/10 text-center">
          <p className="text-sm text-zinc-400 mb-2">Official Deposit Address (TRC20)</p>
          <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-white/5 font-mono text-sm text-primary">
            <span className="truncate mr-4">TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-white/10 hover:text-white" onClick={copyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" min="1" required value={depAmount} onChange={e => setDepAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                value={depCurrency} onChange={(e) => setDepCurrency(e.target.value as Currency)}
              >
                <option value="USDT">USDT (TRC20)</option>
                <option value="TRX">TRX (Tron)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Transaction Hash (TXID)</Label>
            <Input required value={depHash} onChange={e => setDepHash(e.target.value)} placeholder="Enter hash from your wallet" />
          </div>
          <Button type="submit" className="w-full mt-4" isLoading={createTxMutation.isPending}>Submit Deposit Request</Button>
        </form>
      </Modal>

      {/* WITHDRAW MODAL */}
      <Modal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Request Withdrawal" description={`Available Balance: ${formatCurrency(user?.balance || 0)}`}>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" min="60" max={user?.balance} required value={withAmount} onChange={e => setWithAmount(e.target.value)} placeholder="0.00" />
              <p className="text-xs text-zinc-500">Minimum withdrawal: $60</p>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                value={withCurrency} onChange={(e) => setWithCurrency(e.target.value as Currency)}
              >
                <option value="USDT">USDT (TRC20)</option>
                <option value="TRX">TRX (Tron)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Your Wallet Address</Label>
            <Input required value={withAddress} onChange={e => setWithAddress(e.target.value)} placeholder="Enter TRC20 address" />
          </div>
          <Button type="submit" className="w-full mt-4" isLoading={createTxMutation.isPending}>Request Withdrawal</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
