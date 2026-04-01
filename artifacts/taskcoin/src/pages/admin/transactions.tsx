import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetAdminTransactions, useValidateTransaction, getGetAdminTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, Button, Badge, Modal, Label } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const REJECTION_REASONS = [
  "Hash de transaction invalide ou introuvable",
  "Montant ne correspond pas à la transaction",
  "Adresse de portefeuille invalide",
  "Transaction déjà utilisée",
  "Informations manquantes ou incomplètes",
  "Activité suspecte détectée",
  "Solde insuffisant pour le retrait",
  "Retrait temporairement suspendu",
  "Autre (voir note)",
];

export default function AdminTransactions() {
  useRequireAuth(true);
  const { data: transactions, isLoading } = useGetAdminTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; txId: number | null }>({ open: false, txId: null });
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const validateMutation = useValidateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminTransactionsQueryKey() });
        toast({ title: "Succès", description: "Statut de la transaction mis à jour." });
        setRejectModal({ open: false, txId: null });
        setSelectedReasons([]);
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de mettre à jour la transaction.", variant: "destructive" });
      }
    }
  });

  const handleApprove = (txId: number) => {
    validateMutation.mutate({ txId, data: { action: "approve" } });
  };

  const openRejectModal = (txId: number) => {
    setSelectedReasons([]);
    setRejectModal({ open: true, txId: txId });
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirmReject = () => {
    if (!rejectModal.txId) return;
    if (selectedReasons.length === 0) {
      toast({ title: "Cause requise", description: "Veuillez sélectionner au moins une cause de refus.", variant: "destructive" });
      return;
    }
    const note = selectedReasons.join(" | ");
    validateMutation.mutate({ txId: rejectModal.txId, data: { action: "reject", note } });
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
                    <div className="space-y-1">
                      <Badge variant={tx.status === 'approved' ? 'success' : tx.status === 'rejected' ? 'destructive' : 'warning'}>
                        {tx.status}
                      </Badge>
                      {tx.status === 'rejected' && tx.note && (
                        <div className="text-xs text-rose-400/80 max-w-[180px]">{tx.note}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {tx.status === 'pending' ? (
                      <>
                        <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleApprove(tx.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={() => openRejectModal(tx.id)}>
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

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, txId: null })}
        title="Motif du refus"
        description="Sélectionnez une ou plusieurs causes de refus. Elles seront visibles par l'utilisateur."
      >
        <div className="space-y-3">
          <Label className="text-zinc-300 text-sm">Causes de refus</Label>
          <div className="space-y-2">
            {REJECTION_REASONS.map((reason) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                    isSelected
                      ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
                      isSelected ? "border-rose-500 bg-rose-500" : "border-zinc-600"
                    )}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    {reason}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedReasons.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-black/30 border border-rose-500/20">
              <p className="text-xs text-zinc-400 mb-1">Message envoyé à l'utilisateur :</p>
              <p className="text-xs text-rose-300">{selectedReasons.join(" | ")}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectModal({ open: false, txId: null })}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
              variant="outline"
              onClick={handleConfirmReject}
              isLoading={validateMutation.isPending}
              disabled={selectedReasons.length === 0}
            >
              Confirmer le refus
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
