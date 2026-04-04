import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui-core";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import {
  User, Mail, Shield, Wallet, Calendar, Key, Save, Crown,
  Lock, CheckCircle2, AlertCircle
} from "lucide-react";

function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <span className={`text-sm font-medium text-white ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function Profile() {
  useRequireAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [usernameForm, setUsernameForm] = useState({ username: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameForm.username.trim()) return;
    setUsernameLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameForm.username.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setUsernameForm({ username: "" });
      toast({ title: "Pseudo mis à jour", description: `Nouveau pseudo : ${data.username}` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit faire au moins 6 caractères", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Mon Profil</h1>
          </div>
          <p className="text-zinc-400 ml-[52px]">Gérez vos informations personnelles et votre sécurité.</p>
        </div>

        {/* Avatar + Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <CardTitle>Informations du compte</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/30 to-violet-500/20 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <span className="text-3xl font-bold text-amber-400">
                    {user?.username?.slice(0, 2).toUpperCase() ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{user?.username}</p>
                  <p className="text-sm text-zinc-400">{user?.email}</p>
                  {user?.isAdmin && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Administrateur</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info list */}
              <div>
                <InfoRow icon={Mail} label="Email" value={user?.email ?? "—"} />
                <InfoRow icon={Wallet} label="Solde" value={formatCurrency(user?.balance ?? 0)} />
                <InfoRow icon={Crown} label="Plan actif" value={user?.activePlanId ? `Plan #${user.activePlanId}` : "Aucun"} />
                <InfoRow icon={Calendar} label="Membre depuis" value={joinDate} />
                {user?.referralCode && (
                  <InfoRow icon={Key} label="Code parrainage" value={user.referralCode} mono />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Username */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-violet-400" />
                <CardTitle>Changer le pseudo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau pseudo</Label>
                  <Input
                    value={usernameForm.username}
                    onChange={e => setUsernameForm({ username: e.target.value })}
                    placeholder={`Pseudo actuel : ${user?.username ?? ""}`}
                    minLength={3}
                    maxLength={32}
                  />
                  <p className="text-xs text-zinc-500">Entre 3 et 32 caractères.</p>
                </div>
                <Button
                  type="submit"
                  isLoading={usernameLoading}
                  disabled={!usernameForm.username.trim()}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer le pseudo
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <CardTitle>Changer le mot de passe</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Mot de passe actuel</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <p className="text-xs text-zinc-500">Minimum 6 caractères.</p>
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {passwordForm.confirmPassword && passwordForm.newPassword && (
                    <div className={`flex items-center gap-1.5 text-xs ${passwordForm.newPassword === passwordForm.confirmPassword ? "text-emerald-400" : "text-rose-400"}`}>
                      {passwordForm.newPassword === passwordForm.confirmPassword
                        ? <><CheckCircle2 className="w-3.5 h-3.5" />Les mots de passe correspondent</>
                        : <><AlertCircle className="w-3.5 h-3.5" />Les mots de passe ne correspondent pas</>
                      }
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  isLoading={passwordLoading}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Mettre à jour le mot de passe
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
