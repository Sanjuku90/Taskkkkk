import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetMyTransactions, useCreateTransaction, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, Button, Badge, Input, Label, Modal } from "@/components/ui-core";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, Copy, AlertTriangle, Wallet, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

type TxType = "deposit" | "withdrawal";
type Currency = "USDT" | "TRX";

const DEPOSIT_ADDRESS = "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS";

function CurrencySelect({ value, onChange }: { value: Currency; onChange: (v: Currency) => void }) {
  return (
    <select
      className="flex h-12 w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value as Currency)}
    >
      <option value="USDT">USDT (TRC20)</option>
      <option value="TRX">TRX (Tron)</option>
    </select>
  );
}

export default function Transactions() {
  const { user } = useRequireAuth();
  const { data: transactions, isLoading } = useGetMyTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [depAmount, setDepAmount] = useState("");
  const [depCurrency, setDepCurrency] = useState<Currency>("USDT");
  const [depHash, setDepHash] = useState("");

  const [withAmount, setWithAmount] = useState("");
  const [withCurrency, setWithCurrency] = useState<Currency>("USDT");
  const [withAddress, setWithAddress] = useState("");
  const [withDisclaimer, setWithDisclaimer] = useState(false);

  const createTxMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        toast({ title: "Demande envoyée", description: "Votre transaction est en attente de validation. Délai de traitement : jusqu'à 72 heures." });
        setIsDepositOpen(false);
        setIsWithdrawOpen(false);
        setDepAmount(""); setDepHash("");
        setWithAmount(""); setWithAddress(""); setWithDisclaimer(false);
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error?.message || "Données invalides ou opération bloquée.", variant: "destructive" });
      },
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    createTxMutation.mutate({ data: { type: "deposit", amount: Number(depAmount), currency: depCurrency, txHash: depHash } });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    createTxMutation.mutate({ data: { type: "withdrawal", amount: Number(withAmount), currency: withCurrency, walletAddress: withAddress } });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    toast({ title: t("common", "copied"), description: "Adresse copiée !" });
  };

  const approved = transactions?.filter(t => t.status === "approved") ?? [];
  const totalDeposited = approved.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = approved.filter(t => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mb-1">{t("transactions", "title")}</h1>
          <p className="text-zinc-500 text-sm">{t("transactions", "subtitle")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-3">
          <Button
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
            variant="outline"
            onClick={() => setIsDepositOpen(true)}
          >
            <ArrowDownToLine className="w-4 h-4" />
            {t("transactions", "deposit")}
          </Button>
          <Button
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-2"
            variant="outline"
            onClick={() => setIsWithdrawOpen(true)}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            {t("transactions", "withdrawal")}
          </Button>
        </motion.div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Solde disponible", value: formatCurrency(user?.balance ?? 0), icon: Wallet, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
          { label: "Total déposé (approuvé)", value: formatCurrency(totalDeposited), icon: ArrowDownToLine, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Total retiré (approuvé)", value: formatCurrency(totalWithdrawn), icon: ArrowUpFromLine, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="flex items-center gap-4 p-5">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider font-semibold">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/6 bg-white/2">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("transactions", "typeDate")}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("transactions", "amount")}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden sm:table-cell">{t("transactions", "currency")}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("common", "status")}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">{t("transactions", "details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : !transactions?.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 text-sm">{t("transactions", "noTransactions")}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/3 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          tx.type === "deposit" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                          {tx.type === "deposit" ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {tx.type === "deposit" ? t("transactions", "deposit") : t("transactions", "withdrawal")}
                          </p>
                          <p className="text-xs text-zinc-600">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("font-bold", tx.type === "deposit" ? "text-emerald-400" : "text-rose-400")}>
                        {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-lg bg-white/8 text-xs font-mono font-semibold text-zinc-300">{tx.currency}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <Badge variant={tx.status === "approved" ? "success" : tx.status === "rejected" ? "destructive" : "warning"}>
                          {tx.status === "approved" ? t("common", "approved") : tx.status === "rejected" ? t("common", "rejected") : t("common", "pending")}
                        </Badge>
                        {tx.status === "rejected" && tx.note && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-500/8 border border-rose-500/15">
                            <span className="text-rose-400 text-xs">⚠</span>
                            <div>
                              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide">{t("transactions", "rejectionReason")}</p>
                              <p className="text-xs text-rose-300">{tx.note}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-zinc-600 font-mono">
                      {tx.txHash ? `Hash: ${tx.txHash.substring(0, 10)}…` : tx.walletAddress ? `To: ${tx.walletAddress.substring(0, 10)}…` : "—"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DEPOSIT MODAL */}
      <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title={t("transactions", "makeDeposit")} description={t("transactions", "depositDesc")}>
        {/* Address block */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white">{t("transactions", "depositAddress")}</p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-xl p-3">
            <span className="flex-1 font-mono text-xs text-zinc-300 truncate">{DEPOSIT_ADDRESS}</span>
            <button
              onClick={copyAddress}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">Réseau Tron (TRC20) uniquement</p>
        </div>

        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("transactions", "amount")}</Label>
              <Input type="number" step="0.01" min="1" required value={depAmount} onChange={e => setDepAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>{t("transactions", "currency")}</Label>
              <CurrencySelect value={depCurrency} onChange={setDepCurrency} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("transactions", "txHashLabel")}</Label>
            <Input required value={depHash} onChange={e => setDepHash(e.target.value)} placeholder={t("transactions", "txHashPlaceholder")} />
          </div>
          <Button type="submit" className="w-full mt-2 shine-effect" isLoading={createTxMutation.isPending}>
            {t("transactions", "submitDeposit")}
          </Button>
        </form>
      </Modal>

      {/* WITHDRAW MODAL */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => { setIsWithdrawOpen(false); setWithDisclaimer(false); }}
        title={t("transactions", "requestWithdrawal")}
        description={`${t("transactions", "availableBalance")}: ${formatCurrency(user?.balance || 0)}`}
      >
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("transactions", "amount")}</Label>
              <Input type="number" step="0.01" min="60" max={user?.balance} required value={withAmount} onChange={e => setWithAmount(e.target.value)} placeholder="0.00" />
              <p className="text-[11px] text-zinc-600">{t("transactions", "minWithdrawal")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("transactions", "currency")}</Label>
              <CurrencySelect value={withCurrency} onChange={setWithCurrency} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("transactions", "yourWallet")}</Label>
            <Input required value={withAddress} onChange={e => setWithAddress(e.target.value)} placeholder={t("transactions", "walletPlaceholder")} />
          </div>

          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400 mb-1">{t("transactions", "importantWarning")}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{t("transactions", "warningText")}</p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={withDisclaimer}
                onChange={e => setWithDisclaimer(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-rose-500 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 group-hover:text-white transition-colors leading-snug">
                {t("transactions", "disclaimerText")}
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={createTxMutation.isPending}
            disabled={!withDisclaimer || createTxMutation.isPending}
          >
            {t("transactions", "submitWithdrawal")}
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
