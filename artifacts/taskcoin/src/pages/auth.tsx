import { PublicLayout } from "@/components/layout";
import { Input, Label, Button } from "@/components/ui-core";
import { useState, useEffect } from "react";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Crown, Users, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-amber-400 to-primary/50" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-xl shadow-primary/30 animate-float">
                  <Crown className="w-8 h-8 text-zinc-950" />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-2xl text-white leading-none">TaskCoin</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold text-white mb-2">{title}</h1>
              <p className="text-zinc-500 text-sm">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordInput({ value, onChange, id, placeholder }: { value: string; onChange: (v: string) => void; id: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        className="pl-10 pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bienvenue !", description: "Connexion réussie." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ title: "Échec de connexion", description: error?.message || "Identifiants invalides", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <PublicLayout>
      <AuthCard title="Bon retour" subtitle="Connectez-vous pour gérer vos investissements">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput id="password" value={password} onChange={setPassword} />
          </div>

          <Button type="submit" className="w-full mt-2 shine-effect" size="lg" isLoading={loginMutation.isPending}>
            Se connecter
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-zinc-600">Pas encore de compte ?</span>
            </div>
          </div>

          <Link href="/register">
            <Button type="button" variant="glass" className="w-full">
              Créer un compte
            </Button>
          </Link>
        </form>
      </AuthCard>
    </PublicLayout>
  );
}

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const body: Record<string, string> = { username, email, password };
      if (referralCode.trim()) body.referralCode = referralCode.trim().toUpperCase();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Inscription échouée");

      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Compte créé !", description: "Bienvenue sur TaskCoin." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Inscription échouée", description: err.message || "Vérifiez vos informations", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <PublicLayout>
      <AuthCard title="Créer un compte" subtitle="Rejoignez TaskCoin et commencez à gagner">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="MonPseudo"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput id="password" value={password} onChange={setPassword} />
            <p className="text-[11px] text-zinc-600">Au moins 6 caractères</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral">
              Code de parrainage
              <span className="text-zinc-600 font-normal ml-1">(optionnel)</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="referral"
                type="text"
                placeholder="ex: ABC12345"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                className="pl-10 tracking-widest font-mono"
                maxLength={12}
              />
            </div>
            {referralCode && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Code appliqué — votre parrain recevra un bonus !
              </p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2 shine-effect" size="lg" isLoading={isPending}>
            Créer mon compte
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-zinc-600">Déjà un compte ?</span>
            </div>
          </div>

          <Link href="/login">
            <Button type="button" variant="glass" className="w-full">
              Se connecter
            </Button>
          </Link>
        </form>
      </AuthCard>
    </PublicLayout>
  );
}
