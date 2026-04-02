import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, Button, Badge, Input, Label, Modal } from "@/components/ui-core";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Gift, ToggleLeft, ToggleRight, Pencil, Users, TrendingUp, CreditCard, CheckCircle2, Calendar
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CatalogBonus {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: number;
  conditionValue: number;
  isActive: boolean;
  claims: number;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; conditionLabel: (v: number) => string }> = {
  referral: {
    label: "Referral",
    icon: Users,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    conditionLabel: (v) => `${v} friend${v !== 1 ? "s" : ""} must register via your link`,
  },
  first_deposit: {
    label: "First Deposit",
    icon: CreditCard,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    conditionLabel: () => "Make your first approved deposit",
  },
  deposit_milestone: {
    label: "Deposit Milestone",
    icon: TrendingUp,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    conditionLabel: (v) => `Total approved deposits reach $${v}`,
  },
  plan_activation: {
    label: "Plan Activation",
    icon: CheckCircle2,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    conditionLabel: () => "Activate any investment plan",
  },
  task_streak: {
    label: "Task Streak",
    icon: Calendar,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    conditionLabel: (v) => `Complete tasks ${v} consecutive day${v !== 1 ? "s" : ""}`,
  },
};

function useAdminCatalog() {
  return useQuery<CatalogBonus[]>({
    queryKey: ["admin-bonus-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bonus-catalog");
      if (!res.ok) throw new Error("Failed to fetch catalog");
      return res.json();
    },
  });
}

export default function AdminBonusCatalog() {
  useRequireAuth(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: bonuses, isLoading } = useAdminCatalog();

  const [editBonus, setEditBonus] = useState<CatalogBonus | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", reward: "", conditionValue: "" });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/bonus-catalog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bonus-catalog"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; description: string; reward: number; conditionValue: number }) => {
      const res = await fetch(`/api/admin/bonus-catalog/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, description: data.description, reward: data.reward, conditionValue: data.conditionValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-catalog"] });
      toast({ title: "Bonus updated successfully" });
      setEditBonus(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (bonus: CatalogBonus) => {
    setEditBonus(bonus);
    setEditForm({
      title: bonus.title,
      description: bonus.description,
      reward: String(bonus.reward),
      conditionValue: String(bonus.conditionValue),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBonus) return;
    editMutation.mutate({
      id: editBonus.id,
      title: editForm.title,
      description: editForm.description,
      reward: Number(editForm.reward),
      conditionValue: Number(editForm.conditionValue),
    });
  };

  const activeCount = bonuses?.filter(b => b.isActive).length ?? 0;
  const totalClaims = bonuses?.reduce((s, b) => s + b.claims, 0) ?? 0;

  return (
    <AppLayout adminMode>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Bonus Catalog</h1>
          <p className="text-zinc-400">Manage pre-defined bonuses with verifiable conditions. Users earn these automatically once conditions are met.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Bonuses</p>
              <p className="text-2xl font-bold text-white">{bonuses?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Claims</p>
              <p className="text-2xl font-bold text-white">{totalClaims}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {bonuses?.map((bonus) => {
            const meta = TYPE_META[bonus.type] ?? TYPE_META.first_deposit;
            const Icon = meta.icon;
            return (
              <Card key={bonus.id} className={!bonus.isActive ? "opacity-60" : ""}>
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{bonus.title}</h3>
                        <Badge variant={bonus.isActive ? "success" : "outline"} className="text-xs">
                          {bonus.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{bonus.description}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-zinc-400">
                          Reward: <span className="text-amber-400 font-bold">{formatCurrency(bonus.reward)}</span>
                        </span>
                        <span className="text-zinc-400">
                          Condition: <span className="text-white">{meta.conditionLabel(bonus.conditionValue)}</span>
                        </span>
                        <span className="text-zinc-400">
                          Claims: <span className="text-white font-semibold">{bonus.claims}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(bonus)}
                      className="flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: bonus.id, isActive: !bonus.isActive })}
                      className="flex items-center gap-1"
                      isLoading={toggleMutation.isPending}
                    >
                      {bonus.isActive
                        ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                        : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
                      {bonus.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!editBonus} onClose={() => setEditBonus(null)} title={`Edit: ${editBonus?.title}`}>
        {editBonus && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${TYPE_META[editBonus.type]?.color}`}>
                {TYPE_META[editBonus.type]?.label}
              </div>
              <p className="text-xs text-zinc-500 mt-1">The bonus type cannot be changed.</p>
            </div>
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <textarea
                id="edit-desc"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm resize-none"
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-reward">Reward ($)</Label>
                <Input
                  id="edit-reward"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.reward}
                  onChange={e => setEditForm(f => ({ ...f, reward: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-condition">
                  Condition Value
                  <span className="text-zinc-500 text-xs ml-1">
                    ({TYPE_META[editBonus.type]?.conditionLabel(1).split(" ")[0] ?? "#"})
                  </span>
                </Label>
                <Input
                  id="edit-condition"
                  type="number"
                  min="1"
                  step={editBonus.type === "deposit_milestone" ? "1" : "1"}
                  value={editForm.conditionValue}
                  onChange={e => setEditForm(f => ({ ...f, conditionValue: e.target.value }))}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">{TYPE_META[editBonus.type]?.conditionLabel(Number(editForm.conditionValue) || 1)}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" isLoading={editMutation.isPending}>
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditBonus(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppLayout>
  );
}
