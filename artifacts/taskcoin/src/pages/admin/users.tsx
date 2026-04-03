import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetAdminUsers, useSuspendUser, useAddBonus, getGetAdminUsersQueryKey } from "@workspace/api-client-react";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/ui-core";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search, Ban, CheckCircle, Gift, MinusCircle } from "lucide-react";

export default function AdminUsers() {
  useRequireAuth(true);
  const { data: users, isLoading } = useGetAdminUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  
  const [bonusModalUser, setBonusModalUser] = useState<{id: number, username: string} | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");

  const [deductModalUser, setDeductModalUser] = useState<{id: number, username: string} | null>(null);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductLoading, setDeductLoading] = useState(false);

  const suspendMutation = useSuspendUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
        toast({ title: "Updated", description: "User status updated successfully." });
      }
    }
  });

  const bonusMutation = useAddBonus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
        toast({ title: "Bonus Added", description: "Funds added to user balance." });
        setBonusModalUser(null);
        setBonusAmount("");
      }
    }
  });

  const handleToggleSuspend = (userId: number, currentStatus: boolean) => {
    suspendMutation.mutate({ userId, data: { suspended: !currentStatus } });
  };

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalUser) return;
    bonusMutation.mutate({ userId: bonusModalUser.id, data: { amount: Number(bonusAmount), note: "Admin Bonus" } });
  };

  const handleDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductModalUser) return;
    const amount = Number(deductAmount);
    if (!amount || amount <= 0) return;
    setDeductLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deductModalUser.id}/deduct`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
      toast({ title: "Solde déduit", description: `$${amount} retiré du solde de ${deductModalUser.username}.` });
      setDeductModalUser(null);
      setDeductAmount("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setDeductLoading(false);
    }
  };

  const filteredUsers = users?.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout adminMode>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Users</h1>
          <p className="text-zinc-400">View accounts, adjust balances, and manage access.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            className="pl-9" 
            placeholder="Search by username or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Balance</th>
                <th className="px-6 py-4 font-medium">Stats (In/Out)</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
              ) : filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{user.username} {user.isAdmin && <Badge variant="outline" className="ml-2 text-[10px]">ADMIN</Badge>}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                    <div className="text-[10px] text-zinc-600 mt-1">Joined: {formatDate(user.createdAt)}</div>
                    {(user as any).registrationIp && (
                      <div className="text-[10px] text-zinc-700 mt-0.5 font-mono">IP: {(user as any).registrationIp}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {user.planName || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    {formatCurrency(user.balance)}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="text-emerald-400">{formatCurrency(user.totalDeposited)}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-rose-400">{formatCurrency(user.totalWithdrawn)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isSuspended ? (
                      <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" /> Suspended</Badge>
                    ) : (
                      <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setBonusModalUser({id: user.id, username: user.username})}>
                      <Gift className="w-4 h-4 mr-1" /> Bonus
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => setDeductModalUser({id: user.id, username: user.username})}>
                      <MinusCircle className="w-4 h-4 mr-1" /> Déduire
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.isSuspended ? "default" : "destructive"}
                      onClick={() => handleToggleSuspend(user.id, user.isSuspended)}
                      disabled={user.isAdmin}
                    >
                      {user.isSuspended ? "Reactivate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!bonusModalUser} onClose={() => setBonusModalUser(null)} title={`Add Bonus for ${bonusModalUser?.username}`}>
        <form onSubmit={handleAddBonus} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" required value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0.00" />
          </div>
          <Button type="submit" className="w-full mt-4" isLoading={bonusMutation.isPending}>Add Funds</Button>
        </form>
      </Modal>

      <Modal isOpen={!!deductModalUser} onClose={() => { setDeductModalUser(null); setDeductAmount(""); }} title={`Déduire du solde — ${deductModalUser?.username}`}>
        <form onSubmit={handleDeduct} className="space-y-4">
          <p className="text-sm text-zinc-400">Le montant sera retiré directement du solde sans créer d'historique de transaction.</p>
          <div className="space-y-2">
            <Label>Montant à déduire ($)</Label>
            <Input type="number" step="0.01" min="0.01" required value={deductAmount} onChange={e => setDeductAmount(e.target.value)} placeholder="0.00" />
          </div>
          <Button type="submit" className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white" isLoading={deductLoading}>
            <MinusCircle className="w-4 h-4 mr-2" /> Déduire
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
