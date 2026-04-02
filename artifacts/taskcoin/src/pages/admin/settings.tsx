import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui-core";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
type SiteSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  tasksBlocked: boolean;
  withdrawalsBlocked: boolean;
  depositAddress: string;
  referralCommissionRate: number;
};

export default function AdminSettings() {
  useRequireAuth(true);
  const { data: settings, isLoading } = useGetAdminSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formState, setFormState] = useState<SiteSettings>({
    maintenanceMode: false,
    maintenanceMessage: "",
    tasksBlocked: false,
    withdrawalsBlocked: false,
    depositAddress: "",
    referralCommissionRate: 30,
  });

  useEffect(() => {
    if (settings) setFormState(settings);
  }, [settings]);

  const updateMutation = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
        toast({ title: "Settings Saved", description: "Platform configuration updated successfully." });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formState });
  };

  if (isLoading) return <AppLayout adminMode><div className="p-12 text-center">Loading settings...</div></AppLayout>;

  return (
    <AppLayout adminMode>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-zinc-400">Configure global platform behavior.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label>Master Deposit Address (TRC20)</Label>
              <Input 
                value={formState.depositAddress} 
                onChange={e => setFormState({...formState, depositAddress: e.target.value})} 
                placeholder="TRX/USDT Address"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Referral Commission Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={formState.referralCommissionRate}
                onChange={e => setFormState({...formState, referralCommissionRate: Number(e.target.value)})}
                placeholder="5"
              />
              <p className="text-xs text-zinc-500">Percentage of each approved deposit automatically credited to the referrer. Default: 30%.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="font-semibold text-white">Feature Toggles</h3>
              
              <label className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium text-white mb-1">Maintenance Mode</div>
                  <div className="text-sm text-zinc-500">Locks all non-admin users out of the application.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary rounded bg-zinc-900 border-white/10"
                  checked={formState.maintenanceMode}
                  onChange={e => setFormState({...formState, maintenanceMode: e.target.checked})}
                />
              </label>

              {formState.maintenanceMode && (
                <div className="pl-4 border-l-2 border-primary space-y-2">
                  <Label>Maintenance Message</Label>
                  <Input 
                    value={formState.maintenanceMessage} 
                    onChange={e => setFormState({...formState, maintenanceMessage: e.target.value})} 
                    placeholder="We will be back shortly..."
                  />
                </div>
              )}

              <label className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium text-white mb-1">Block New Tasks</div>
                  <div className="text-sm text-zinc-500">Prevents users from earning rewards.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary rounded bg-zinc-900 border-white/10"
                  checked={formState.tasksBlocked}
                  onChange={e => setFormState({...formState, tasksBlocked: e.target.checked})}
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium text-white mb-1">Block Withdrawals</div>
                  <div className="text-sm text-zinc-500">Temporarily suspends withdrawal requests.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary rounded bg-zinc-900 border-white/10"
                  checked={formState.withdrawalsBlocked}
                  onChange={e => setFormState({...formState, withdrawalsBlocked: e.target.checked})}
                />
              </label>
            </div>

            <Button type="submit" className="w-full mt-6" isLoading={updateMutation.isPending}>
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
