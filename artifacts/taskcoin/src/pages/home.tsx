import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui-core";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronRight, ShieldCheck, Zap, Coins, TrendingUp, Users, Star, Check } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

// Incrément déterministe pour l'intervalle i : retourne 2, 3 ou 4
// Même graine → même séquence, peu importe le nombre de rechargements
function seededIncrement(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return 2 + (Math.abs(Math.floor(x * 1000)) % 3);
}

const MEMBER_START = 3101;
const MEMBER_INTERVAL_MS = 5000;
// Epoch fixe partagé par tous les utilisateurs — 2026-04-04T23:35:00Z
const MEMBER_EPOCH = 1743809700000;
// Plafond pour éviter une boucle trop longue si le site est inactif plusieurs jours
const MAX_INTERVALS = 50_000; // ≈ 69 h

function computeCount(now: number): number {
  const n = Math.min(
    Math.max(0, Math.floor((now - MEMBER_EPOCH) / MEMBER_INTERVAL_MS)),
    MAX_INTERVALS
  );
  let total = MEMBER_START;
  for (let i = 0; i < n; i++) total += seededIncrement(i);
  return total;
}

function useMemberCounter() {
  const [count, setCount] = useState<number>(() => computeCount(Date.now()));

  useEffect(() => {
    const tick = () => setCount(computeCount(Date.now()));

    // Attendre le prochain tick naturel aligné sur l'epoch, puis boucler régulièrement
    const elapsed = (Date.now() - MEMBER_EPOCH) % MEMBER_INTERVAL_MS;
    const delay = MEMBER_INTERVAL_MS - elapsed;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, MEMBER_INTERVAL_MS);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  return count.toLocaleString("fr-FR");
}

const stats = [
  { value: null, label: "Membres actifs", color: "text-amber-400", live: true },
  { value: "$2.8M", label: "Distribués en gains", color: "text-cyan-400" },
  { value: "99.9%", label: "Disponibilité", color: "text-emerald-400" },
  { value: "< 72h", label: "Traitement retraits", color: "text-violet-400" },
];

const features = [
  {
    icon: Zap,
    title: "Gains quotidiens garantis",
    desc: "Complétez vos tâches chaque jour et vos gains sont crédités instantanément.",
    grad: "from-amber-500 to-orange-500",
    bg: "from-amber-500/12 to-orange-500/5",
    border: "border-amber-500/25",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité de niveau bancaire",
    desc: "Chiffrement bout-en-bout, audits réguliers et protection de vos dépôts.",
    grad: "from-cyan-400 to-blue-500",
    bg: "from-cyan-500/12 to-blue-500/5",
    border: "border-cyan-500/25",
  },
  {
    icon: Coins,
    title: "7 plans d'investissement",
    desc: "Du Starter au VIP Elite : choisissez selon votre budget et vos ambitions.",
    grad: "from-violet-500 to-purple-600",
    bg: "from-violet-500/12 to-purple-500/5",
    border: "border-violet-500/25",
  },
  {
    icon: Users,
    title: "Parrainage rémunérateur",
    desc: "Chaque filleul actif vous rapporte des commissions automatiques et durables.",
    grad: "from-emerald-400 to-teal-500",
    bg: "from-emerald-500/12 to-teal-500/5",
    border: "border-emerald-500/25",
  },
  {
    icon: TrendingUp,
    title: "ROI jusqu'à 378$/jour",
    desc: "Le plan VIP Elite génère des gains journaliers parmi les plus élevés du marché.",
    grad: "from-rose-500 to-pink-600",
    bg: "from-rose-500/12 to-pink-500/5",
    border: "border-rose-500/25",
  },
  {
    icon: Star,
    title: "Bonus & récompenses",
    desc: "Déverrouillez des bonus exclusifs et montez de niveau avec notre catalogue de rewards.",
    grad: "from-amber-400 to-cyan-400",
    bg: "from-amber-500/10 to-cyan-500/8",
    border: "border-amber-500/20",
  },
];

const plans = [
  { name: "Starter", deposit: "$45", daily: "$21", tasks: 3, color: "from-slate-400 to-slate-500", glow: "shadow-slate-500/20" },
  { name: "Gold", deposit: "$120", daily: "$85", tasks: 5, popular: true, color: "from-amber-400 to-amber-600", glow: "shadow-amber-500/35" },
  { name: "Platinum", deposit: "$200", daily: "$175", tasks: 6, color: "from-violet-400 to-violet-600", glow: "shadow-violet-500/25" },
  { name: "VIP Elite", deposit: "$400", daily: "$378", tasks: 7, color: "from-cyan-400 to-blue-500", glow: "shadow-cyan-500/25" },
];

export default function Home() {
  const memberCount = useMemberCounter();
  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col">

        {/* ───── HERO ───── */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden grid-bg">
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-radial from-blue-600/20 via-indigo-600/8 to-transparent blur-3xl" />
            <div className="absolute top-1/2 -right-32 w-[500px] h-[400px] bg-cyan-500/10 blur-[80px] rounded-full" />
            <div className="absolute bottom-0 -left-16 w-[400px] h-[300px] bg-violet-500/8 blur-[80px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">

              {/* Left */}
              <div>
                <motion.div {...fadeUp(0)}>
                  <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-bold mb-8"
                    style={{
                      background: "linear-gradient(135deg, hsl(43 100% 58% / 0.12), hsl(185 85% 52% / 0.08))",
                      borderColor: "hsl(43 100% 58% / 0.3)",
                      color: "hsl(43 100% 68%)"
                    }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                    Version 2.0 — Maintenant disponible
                  </span>
                </motion.div>

                <motion.h1 {...fadeUp(0.07)} className="text-4xl sm:text-5xl lg:text-[4.5rem] font-display font-black tracking-tight leading-[1.04] mb-6">
                  <span className="text-white">Investis</span>
                  <br />
                  <span className="gradient-text text-glow">intelligent.</span>
                  <br />
                  <span className="text-slate-300">Gagne chaque jour.</span>
                </motion.h1>

                <motion.p {...fadeUp(0.14)} className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                  La plateforme crypto premium qui connecte investissements stratégiques et récompenses actives quotidiennes. Simple, transparent, rentable.
                </motion.p>

                <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto shine-effect animate-pulse-glow gap-2">
                      Commencer gratuitement
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/plans">
                    <Button size="lg" variant="glass" className="w-full sm:w-auto gap-2">
                      Voir les plans
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust indicators */}
                <motion.div {...fadeUp(0.26)} className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-sm text-slate-600">
                  {["Gratuit à l'inscription", "Retrait en 72h", "Support 7j/7"].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Right — Dashboard mockup */}
              <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="relative hidden lg:block"
              >
                {/* Glow */}
                <div className="absolute -inset-8 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-cyan-500/10 to-violet-500/15 blur-3xl rounded-full" />
                </div>

                {/* Main panel */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10"
                  style={{ background: "linear-gradient(135deg, hsl(220 40% 9%) 0%, hsl(222 50% 6%) 100%)" }}
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <Coins className="w-3.5 h-3.5 text-zinc-950" />
                      </div>
                      <span className="font-bold text-white text-sm">Mon tableau de bord</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">● En ligne</span>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Balance */}
                    <div className="rounded-2xl p-5 border border-amber-500/20"
                      style={{ background: "linear-gradient(135deg, hsl(43 80% 12% / 0.8) 0%, hsl(220 40% 8%) 100%)" }}
                    >
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Solde total</p>
                      <p className="text-5xl font-display font-black text-amber-400 text-glow mb-3">$1,284.50</p>
                      <div className="flex gap-3">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold">↑ Dépôt</span>
                        <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-xs font-bold">↓ Retrait</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Plan actif", value: "Gold ⭐", color: "text-amber-400", bg: "hsl(43 80% 12% / 0.5)", border: "hsl(43 100% 50% / 0.2)" },
                        { label: "Gain aujourd'hui", value: "+$85.00", color: "text-emerald-400", bg: "hsl(150 60% 8% / 0.5)", border: "hsl(150 60% 45% / 0.2)" },
                        { label: "Tâches", value: "5 / 5 ✓", color: "text-cyan-400", bg: "hsl(185 60% 8% / 0.5)", border: "hsl(185 85% 50% / 0.2)" },
                        { label: "Filleuls", value: "7 actifs", color: "text-violet-400", bg: "hsl(270 50% 10% / 0.5)", border: "hsl(270 60% 60% / 0.2)" },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl p-3.5 border" style={{ background: item.bg, borderColor: item.border }}>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 font-bold">{item.label}</p>
                          <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent transaction */}
                    <div className="rounded-xl p-3.5 border border-white/6 flex items-center gap-3"
                      style={{ background: "hsl(220 40% 7% / 0.6)" }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">Tâche #5 complétée</p>
                        <p className="text-[10px] text-slate-600">Il y a 2 minutes</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">+$17.00</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ───── STATS BAR ───── */}
        <section className="stat-bar py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-center px-6 py-2"
                >
                  <p className={`text-3xl md:text-4xl font-display font-black mb-1 ${stat.color}`}>
                    {stat.live ? (
                      <span className="tabular-nums">{memberCount}</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">
                    {stat.live && (
                      <span className="inline-flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                        </span>
                      </span>
                    )}{" "}
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/6 blur-[120px] rounded-full" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div {...fadeUp(0)} className="text-center mb-16">
              <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">Pourquoi nous choisir</p>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-5">
                Tout pour <span className="gradient-text">réussir</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                Un écosystème complet conçu pour maximiser vos gains et simplifier vos investissements crypto.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`group relative rounded-2xl p-6 border ${feat.border} bg-gradient-to-br ${feat.bg} transition-all duration-300 hover:-translate-y-2 hover:shadow-lg overflow-hidden cursor-default`}
                >
                  {/* Gradient icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.grad} flex items-center justify-center mb-5 shadow-lg`}>
                    <feat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>

                  {/* Hover shimmer */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.grad} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl pointer-events-none`} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── PLANS PREVIEW ───── */}
        <section className="py-24 section-alt">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-3">Plans d'investissement</p>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-5">
                Votre <span className="gradient-text">niveau</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Quatre paliers d'accès, chacun débloquant plus de tâches et de gains quotidiens.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-3 ${plan.popular ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-white/8"}`}
                  style={{ background: "linear-gradient(160deg, hsl(220 40% 9%) 0%, hsl(222 50% 6%) 100%)" }}
                >
                  {plan.popular && (
                    <div className={`h-1 bg-gradient-to-r ${plan.color}`} />
                  )}

                  <div className="p-6">
                    {plan.popular && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
                        ⭐ Populaire
                      </div>
                    )}

                    {/* Plan icon */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg ${plan.glow}`}>
                      <Coins className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-600 mb-5">Plan d'investissement</p>

                    {/* Deposit */}
                    <div className="mb-5 pb-5 border-b border-white/6">
                      <p className="text-xs text-slate-600 mb-1">Dépôt requis</p>
                      <p className="text-4xl font-display font-black text-white">{plan.deposit}</p>
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><span className="text-white font-semibold">{plan.tasks}</span> tâches par jour</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Gain : <span className="text-emerald-400 font-bold">{plan.daily}</span>/jour</span>
                      </div>
                    </div>

                    <Link href="/register">
                      {plan.popular ? (
                        <Button className="w-full shine-effect">Démarrer</Button>
                      ) : (
                        <Button variant="glass" className="w-full">Démarrer</Button>
                      )}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/register">
                <Button variant="ghost" className="text-slate-500 hover:text-white gap-2">
                  Voir les 7 plans complets <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className="py-24 relative overflow-hidden">
          {/* Vivid background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/12 blur-[80px] rounded-full" />
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div {...fadeUp(0)}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white leading-tight mb-6">
                Rejoins la communauté<br />
                <span className="gradient-text">TaskCoin</span> aujourd'hui
              </h2>
              <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto">
                Des milliers d'investisseurs gagnent déjà. À toi de jouer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="animate-pulse-glow shine-effect gap-3 px-10">
                    Créer mon compte gratuitement
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-700">Pas de frais à l'inscription · Retrait disponible sous 72h</p>
            </motion.div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
