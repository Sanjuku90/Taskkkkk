import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, Button, Badge, Input, Label, Modal } from "@/components/ui-core";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Star, Plus, Trash2, ToggleLeft, ToggleRight, Users, User } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useGetAdminUsers } from "@workspace/api-client-react";

interface BonusTask {
  id: number;
  title: string;
  description: string | null;
  reward: number;
  forUserId: number | null;
  forUsername: string | null;
  expiresAt: string | null;
  isActive: boolean;
  completions: number;
  createdAt: string;
}

function useAdminBonusTasks() {
  return useQuery<BonusTask[]>({
    queryKey: ["admin-bonus-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bonus-tasks");
      if (!res.ok) throw new Error("Failed to fetch bonus tasks");
      return res.json();
    },
  });
}

export default function AdminBonusTasks() {
  useRequireAuth(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tasks, isLoading } = useAdminBonusTasks();
  const { data: users } = useGetAdminUsers();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    forUserId: "",
    expiresAt: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch("/api/admin/bonus-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-tasks"] });
      toast({ title: "Bonus task created successfully" });
      setShowCreate(false);
      setForm({ title: "", description: "", reward: "", forUserId: "", expiresAt: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/bonus-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bonus-tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/bonus-tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-tasks"] });
      toast({ title: "Bonus task deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      reward: Number(form.reward),
      forUserId: form.forUserId ? Number(form.forUserId) : undefined,
      expiresAt: form.expiresAt || undefined,
    });
  };

  return (
    <AppLayout adminMode>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Special Bonus Tasks</h1>
          <p className="text-zinc-400">Create and manage special reward tasks for users.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Bonus Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : !tasks?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Bonus Tasks</h3>
            <p className="text-zinc-400 mb-6">Create your first special bonus task to reward users.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bonus Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={!task.isActive ? "opacity-60" : ""}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{task.title}</h3>
                    <Badge variant={task.isActive ? "success" : "outline"} className="text-xs">
                      {task.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {task.forUserId ? (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.forUsername ?? `User #${task.forUserId}`}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        All users
                      </Badge>
                    )}
                  </div>
                  {task.description && <p className="text-sm text-zinc-400 mb-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <span>Reward: <span className="text-amber-400 font-bold">{formatCurrency(task.reward)}</span></span>
                    <span>Completions: <span className="text-white font-semibold">{task.completions}</span></span>
                    {task.expiresAt && <span>Expires: {new Date(task.expiresAt).toLocaleDateString()}</span>}
                    <span>Created: {formatDate(task.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMutation.mutate({ id: task.id, isActive: !task.isActive })}
                    className="flex items-center gap-1"
                  >
                    {task.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
                    {task.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:border-red-500/30"
                    onClick={() => {
                      if (confirm(`Delete "${task.title}"?`)) deleteMutation.mutate(task.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Bonus Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Weekend Special"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of the task"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="reward">Reward ($) *</Label>
            <Input
              id="reward"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 25"
              value={form.reward}
              onChange={e => setForm(f => ({ ...f, reward: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="forUser">Assign to specific user (optional — leave blank for all)</Label>
            <select
              id="forUser"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm"
              value={form.forUserId}
              onChange={e => setForm(f => ({ ...f, forUserId: e.target.value }))}
            >
              <option value="">All users</option>
              {users?.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="expires">Expiry date (optional)</Label>
            <Input
              id="expires"
              type="datetime-local"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
              Create Task
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
