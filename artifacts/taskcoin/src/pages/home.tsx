import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui-core";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Zap, Coins, TrendingUp, Users, Star } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

const stats = [
  { value: "12,400+", label: "Utilisateurs actifs" },
  { value: "$2.8M", label: "Distribués en gains" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "< 24h", label: "Traitement des retraits" },
];

const features = [
  {
    icon: Zap,
    title: "Gains quotidiens",
    desc: "Complétez vos tâches quotidiennes et voyez vos gains crédités instantanément sur votre solde.",
    color: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/15 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "Plateforme sécurisée",
    desc: "Sécurité de niveau entreprise pour vos dépôts et retraits USDT et TRX.",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconBg: "bg-emerald-500/15 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Coins,
    title: "Plans multiples",
    desc: "Du Starter au VIP Elite, trouvez un plan d'investissement adapté à vos objectifs.",
    color: "from-violet-500/20 to-violet-500/5",
    iconBg: "bg-violet-500/15 border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Users,
    title: "Programme de parrainage",
    desc: "Invitez vos amis et gagnez des bonus supplémentaires pour chaque filleul actif.",
    color: "from-blue-500/20 to-blue-500/5",
    iconBg: "bg-blue-500/15 border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "ROI élevé",
    desc: "Nos plans offrent jusqu'à 378 $ de gains quotidiens avec le plan VIP Elite.",
    color: "from-rose-500/20 to-rose-500/5",
    iconBg: "bg-rose-500/15 border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Star,
    title: "Bonus exclusifs",
    desc: "Débloquez des récompenses spéciales grâce à notre catalogue de bonus progressifs.",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15 border-primary/20",
    iconColor: "text-primary",
  },
];

const plans = [
  { name: "Starter", deposit: "$45", daily: "$21", tasks: 3 },
  { name: "Gold", deposit: "$120", daily: "$85", tasks: 5, popular: true },
  { name: "VIP Elite", deposit: "$400", daily: "$378", tasks: 7 },
];

export default function Home() {
  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="relative pt-16 pb-24 overflow-hidden grid-bg">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute top-2/3 right-0 w-[400px] h-[300px] bg-violet-500/8 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left">
                <motion.div {...fadeUp(0)}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-sm font-semibold mb-8">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Version 2.0 — Maintenant disponible
                  </div>
                </motion.div>

                <motion.h1 {...fadeUp(0.08)} className="text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white mb-6 leading-[1.05]">
                  Investis
                  <br />
                  <span className="gradient-text text-glow">
                    intelligent.
                  </span>
                  <br />
                  <span className="text-zinc-200">Gagne chaque jour.</span>
                </motion.h1>

                <motion.p {...fadeUp(0.16)} className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  TaskCoin est la plateforme premium qui connecte les investissements crypto stratégiques à des récompenses actives quotidiennes. Complète des tâches simples et multiplie ton portefeuille.
                </motion.p>

                <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto group shine-effect animate-pulse-glow">
                      Commencer à gagner
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/plans">
                    <Button size="lg" variant="glass" className="w-full sm:w-auto">
                      Voir les plans
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Right: floating card mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="relative hidden lg:flex flex-col gap-4"
              >
                <div className="absolute -inset-10 bg-gradient-to-tr from-primary/15 to-violet-500/10 blur-3xl rounded-full" />

                {/* Main card */}
                <div className="relative glass-card rounded-3xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Solde total</p>
                      <p className="text-4xl font-display font-bold text-primary text-glow">$1,284.50</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/30 animate-float">
                      <Coins className="w-7 h-7 text-zinc-950" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Plan actif", value: "Gold" },
                      { label: "Gains aujourd'hui", value: "+$85.00" },
                      { label: "Tâches complétées", value: "5/5" },
                      { label: "Filleuls actifs", value: "7" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="font-bold text-white text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating mini cards */}
                <div className="flex gap-3">
                  <div className="flex-1 glass-card rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Dépôt approuvé</p>
                      <p className="text-sm font-bold text-white">+$250.00</p>
                    </div>
                  </div>
                  <div className="flex-1 glass-card rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Tâche gagnée</p>
                      <p className="text-sm font-bold text-primary">+$17.00</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-white/5 bg-white/2 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-y-2 md:divide-y-0 md:divide-x divide-white/5">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-center px-6 py-2"
                >
                  <p className="text-2xl md:text-3xl font-display font-bold gradient-text mb-1">{stat.value}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-16">
              <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Pourquoi TaskCoin ?</p>
              <h2 className="text-4xl font-display font-bold text-white mb-4">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                Un écosystème sécurisé, transparent et hautement rémunérateur pour les investisseurs crypto modernes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`glass-card-hover rounded-2xl p-6 bg-gradient-to-br ${feature.color}`}
                >
                  <div className={`w-12 h-12 ${feature.iconBg} border rounded-2xl flex items-center justify-center mb-5`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans preview */}
        <section className="py-24 bg-white/2 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Plans d'investissement</p>
              <h2 className="text-4xl font-display font-bold text-white mb-4">Choisissez votre niveau</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Des plans adaptés à chaque budget, du débutant au trader expert.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className={`relative glass-card rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 ${plan.popular ? "border-primary/40 box-glow" : "border-white/8"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-zinc-950 text-xs font-bold px-4 py-1 rounded-full">
                      ⭐ Populaire
                    </div>
                  )}
                  <p className="text-lg font-bold text-white mb-1">{plan.name}</p>
                  <p className="text-xs text-zinc-500 mb-4">Dépôt requis</p>
                  <p className="text-4xl font-display font-bold gradient-text mb-4">{plan.deposit}</p>
                  <div className="space-y-2 text-sm text-zinc-400 mb-6">
                    <p><span className="text-white font-semibold">{plan.tasks}</span> tâches / jour</p>
                    <p>Gain quotidien : <span className="text-emerald-400 font-bold">{plan.daily}</span></p>
                  </div>
                  <Link href="/register">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} size="sm">
                      Démarrer
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/register">
                <Button variant="ghost" className="text-zinc-400 hover:text-white gap-2">
                  Voir tous les plans <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div {...fadeUp(0)}>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6 leading-tight">
                Prêt à commencer<br />
                <span className="gradient-text">ton voyage financier ?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10">
                Rejoins des milliers d'investisseurs qui gagnent chaque jour avec TaskCoin.
              </p>
              <Link href="/register">
                <Button size="lg" className="animate-pulse-glow shine-effect gap-3">
                  Créer mon compte gratuitement
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
