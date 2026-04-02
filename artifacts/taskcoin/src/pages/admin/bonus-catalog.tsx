import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, Button, Badge, Input, Label, Modal } from "@/components/ui-core";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Gift, ToggleLeft, ToggleRight, Pencil, Users, TrendingUp, CreditCard,
  CheckCircle2, Calendar, Plus, Trash2, ChevronRight, ArrowLeft
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

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

const TYPE_META: Record<string, {
  label: string;
  labelFr: string;
  icon: React.ElementType;
  color: string;
  description: string;
  conditionLabel: (v: number) => string;
  conditionHint: string;
  conditionPlaceholder: string;
  defaultCondition: string;
  needsCondition: boolean;
}> = {
  referral: {
    label: "Referral",
    labelFr: "Parrainage",
    icon: Users,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    description: "Récompense quand un utilisateur invite X amis via son lien de parrainage.",
    conditionLabel: (v) => `${v} ami${v !== 1 ? "s" : ""} invité${v !== 1 ? "s" : ""} via le lien`,
    conditionHint: "Nombre d'amis à inviter pour déclencher ce bonus",
    conditionPlaceholder: "ex: 1, 3, 5, 10…",
    defaultCondition: "1",
    needsCondition: true,
  },
  first_deposit: {
    label: "First Deposit",
    labelFr: "Premier dépôt",
    icon: CreditCard,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    description: "Récompense accordée lors du tout premier dépôt approuvé.",
    conditionLabel: () => "Premier dépôt approuvé",
    conditionHint: "Laisser à 1 (non modifiable pour ce type)",
    conditionPlaceholder: "1",
    defaultCondition: "1",
    needsCondition: false,
  },
  deposit_milestone: {
    label: "Deposit Milestone",
    labelFr: "Palier de dépôt",
    icon: TrendingUp,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    description: "Récompense quand le total cumulé des dépôts approuvés dépasse un seuil.",
    conditionLabel: (v) => `Total dépôts ≥ $${v.toLocaleString()}`,
    conditionHint: "Montant total en $ à atteindre",
    conditionPlaceholder: "ex: 100, 250, 500, 1000…",
    defaultCondition: "100",
    needsCondition: true,
  },
  plan_activation: {
    label: "Plan Activation",
    labelFr: "Activation de plan",
    icon: CheckCircle2,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    description: "Récompense lors de l'activation du premier plan d'investissement.",
    conditionLabel: () => "Un plan d'investissement actif",
    conditionHint: "Laisser à 1 (non modifiable pour ce type)",
    conditionPlaceholder: "1",
    defaultCondition: "1",
    needsCondition: false,
  },
  task_streak: {
    label: "Task Streak",
    labelFr: "Série de tâches",
    icon: Calendar,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    description: "Récompense pour une série consécutive de jours avec au moins une tâche complétée.",
    conditionLabel: (v) => `${v} jour${v !== 1 ? "s" : ""} consécutif${v !== 1 ? "s" : ""} de tâches`,
    conditionHint: "Nombre de jours consécutifs requis",
    conditionPlaceholder: "ex: 3, 7, 14, 30…",
    defaultCondition: "7",
    needsCondition: true,
  },
};

const BONUS_TYPES = Object.keys(TYPE_META) as (keyof typeof TYPE_META)[];

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

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [createForm, setCreateForm] = useState({ title: "", description: "", reward: "", conditionValue: "" });

  const [deleteTarget, setDeleteTarget] = useState<CatalogBonus | null>(null);

  const openCreate = () => {
    setCreateStep(1);
    setSelectedType("");
    setCreateForm({ title: "", description: "", reward: "", conditionValue: "" });
    setCreateOpen(true);
  };

  const selectType = (type: string) => {
    setSelectedType(type);
    const meta = TYPE_META[type];
    setCreateForm(f => ({
      ...f,
      conditionValue: meta.defaultCondition,
    }));
    setCreateStep(2);
  };

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; description: string; reward: number; conditionValue: number }) => {
      const res = await fetch("/api/admin/bonus-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-catalog"] });
      toast({ title: "Bonus créé avec succès" });
      setCreateOpen(false);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = TYPE_META[selectedType];
    createMutation.mutate({
      type: selectedType,
      title: createForm.title,
      description: createForm.description,
      reward: Number(createForm.reward),
      conditionValue: meta.needsCondition ? Number(createForm.conditionValue) : 1,
    });
  };

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
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; description: string; reward: number; conditionValue: number }) => {
      const res = await fetch(`/api/admin/bonus-catalog/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, description: data.description, reward: data.reward, conditionValue: data.conditionValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-catalog"] });
      toast({ title: "Bonus mis à jour" });
      setEditBonus(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/bonus-catalog/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-catalog"] });
      toast({ title: "Bonus supprimé" });
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      toast({ title: "Impossible de supprimer", description: e.message, variant: "destructive" });
      setDeleteTarget(null);
    },
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
          <h1 className="text-4xl font-display font-bold text-white mb-2">Catalogue de Bonus</h1>
          <p className="text-zinc-400">Créez et gérez les bonus avec conditions vérifiables. Les utilisateurs les réclament une fois les conditions remplies.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
          <Plus className="w-5 h-5" />
          Créer un bonus
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Total</p>
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
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Actifs</p>
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
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Réclamations</p>
              <p className="text-2xl font-bold text-white">{totalClaims}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : bonuses?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gift className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-300 mb-2">Aucun bonus dans le catalogue</h3>
            <p className="text-zinc-500 mb-6 max-w-sm mx-auto">Créez votre premier bonus en choisissant un type parmi ceux disponibles.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer un bonus
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bonuses?.map((bonus, i) => {
            const meta = TYPE_META[bonus.type] ?? TYPE_META.first_deposit;
            const Icon = meta.icon;
            return (
              <motion.div
                key={bonus.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={!bonus.isActive ? "opacity-60" : ""}>
                  <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{bonus.title}</h3>
                          <Badge variant={bonus.isActive ? "success" : "outline"} className="text-xs">
                            {bonus.isActive ? "Actif" : "Inactif"}
                          </Badge>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                            {meta.labelFr}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{bonus.description}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                          <span className="text-zinc-400">
                            Récompense : <span className="text-amber-400 font-bold">{formatCurrency(bonus.reward)}</span>
                          </span>
                          <span className="text-zinc-400">
                            Condition : <span className="text-white">{meta.conditionLabel(bonus.conditionValue)}</span>
                          </span>
                          <span className="text-zinc-400">
                            Réclamations : <span className="text-white font-semibold">{bonus.claims}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(bonus)}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
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
                        {bonus.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(bonus)}
                        className="flex items-center gap-1"
                        disabled={bonus.claims > 0}
                        title={bonus.claims > 0 ? "Impossible de supprimer un bonus déjà réclamé" : "Supprimer"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={createStep === 1 ? "Choisir un type de bonus" : `Configurer : ${TYPE_META[selectedType]?.labelFr}`}
        description={createStep === 1 ? "Sélectionnez le type de condition que vous souhaitez définir." : "Personnalisez le titre, la description et la récompense."}
      >
        {createStep === 1 ? (
          <div className="grid grid-cols-1 gap-3">
            {BONUS_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectType(type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5 text-left group ${meta.color.includes('violet') ? 'border-violet-500/20' : meta.color.includes('emerald') ? 'border-emerald-500/20' : meta.color.includes('blue') ? 'border-blue-500/20' : meta.color.includes('amber') ? 'border-amber-500/20' : 'border-rose-500/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{meta.labelFr}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{meta.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setCreateStep(1)}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de type
            </button>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${TYPE_META[selectedType]?.color}`}>
              {TYPE_META[selectedType]?.labelFr}
            </div>

            <div>
              <Label htmlFor="c-title">Titre *</Label>
              <Input
                id="c-title"
                value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                placeholder={`ex: ${TYPE_META[selectedType]?.labelFr} — Niveau 1`}
                required
              />
            </div>

            <div>
              <Label htmlFor="c-desc">Description</Label>
              <textarea
                id="c-desc"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez ce que l'utilisateur doit faire pour obtenir ce bonus…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-reward">Récompense ($) *</Label>
                <Input
                  id="c-reward"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={createForm.reward}
                  onChange={e => setCreateForm(f => ({ ...f, reward: e.target.value }))}
                  placeholder="ex: 20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-condition">
                  {TYPE_META[selectedType]?.needsCondition ? "Valeur condition *" : "Condition"}
                </Label>
                <Input
                  id="c-condition"
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.conditionValue}
                  onChange={e => setCreateForm(f => ({ ...f, conditionValue: e.target.value }))}
                  placeholder={TYPE_META[selectedType]?.conditionPlaceholder}
                  disabled={!TYPE_META[selectedType]?.needsCondition}
                  required={TYPE_META[selectedType]?.needsCondition}
                />
              </div>
            </div>
            {selectedType && (
              <p className="text-xs text-zinc-500 -mt-2">
                {TYPE_META[selectedType].conditionLabel(Number(createForm.conditionValue) || 1)}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
                Créer le bonus
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={!!editBonus} onClose={() => setEditBonus(null)} title={`Modifier : ${editBonus?.title}`}>
        {editBonus && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${TYPE_META[editBonus.type]?.color}`}>
                {TYPE_META[editBonus.type]?.labelFr}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Le type ne peut pas être modifié.</p>
            </div>
            <div>
              <Label htmlFor="edit-title">Titre</Label>
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
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-reward">Récompense ($)</Label>
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
                <Label htmlFor="edit-condition">Valeur condition</Label>
                <Input
                  id="edit-condition"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.conditionValue}
                  onChange={e => setEditForm(f => ({ ...f, conditionValue: e.target.value }))}
                  disabled={!TYPE_META[editBonus.type]?.needsCondition}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">{TYPE_META[editBonus.type]?.conditionLabel(Number(editForm.conditionValue) || 1)}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" isLoading={editMutation.isPending}>
                Enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditBonus(null)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce bonus ?"
        description={`"${deleteTarget?.title}" sera supprimé définitivement.`}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Cette action est irréversible. Le bonus ne sera plus visible ni réclamable par les utilisateurs.
          </p>
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              isLoading={deleteMutation.isPending}
            >
              Supprimer définitivement
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
