import { AppLayout } from "@/components/layout";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent } from "@/components/ui-core";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bomb, TrendingUp, CircleDot, ChevronRight, Zap, Dices, Grid3x3 } from "lucide-react";

const games = [
  {
    href: "/games/mines",
    icon: Bomb,
    title: "Mines",
    desc: "Révèle des cases sans tomber sur une mine. Plus tu révèles, plus ton multiplicateur monte.",
    gradient: "from-rose-500 to-orange-500",
    bg: "from-rose-500/10 to-orange-500/8",
    border: "border-rose-500/20",
    tag: "Stratégie",
    tagColor: "bg-rose-500/15 text-rose-400",
  },
  {
    href: "/games/crash",
    icon: TrendingUp,
    title: "Crash",
    desc: "Le multiplicateur monte... mais peut crasher à tout moment. Encaisse avant qu'il s'effondre.",
    gradient: "from-violet-500 to-cyan-500",
    bg: "from-violet-500/10 to-cyan-500/8",
    border: "border-violet-500/20",
    tag: "Adrénaline",
    tagColor: "bg-violet-500/15 text-violet-400",
  },
  {
    href: "/games/coinflip",
    icon: CircleDot,
    title: "Pile ou Face",
    desc: "Simple et rapide. Choisis ton côté, mise, et tente ta chance sur un seul lancer.",
    gradient: "from-amber-400 to-yellow-500",
    bg: "from-amber-500/10 to-yellow-500/8",
    border: "border-amber-500/20",
    tag: "Chance",
    tagColor: "bg-amber-500/15 text-amber-400",
  },
  {
    href: "/games/dice",
    icon: Dices,
    title: "Dice",
    desc: "Lance un dé de 1 à 100. Dépasse le seuil choisi pour remporter la mise. Plus c'est difficile, plus ça paye.",
    gradient: "from-cyan-500 to-blue-600",
    bg: "from-cyan-500/10 to-blue-500/8",
    border: "border-cyan-500/20",
    tag: "Classique",
    tagColor: "bg-cyan-500/15 text-cyan-400",
  },
  {
    href: "/games/keno",
    icon: Grid3x3,
    title: "Keno",
    desc: "Choisis 5 numéros parmi 40. Plus tu en matches dans les 10 tirés, plus ton gain explose.",
    gradient: "from-emerald-500 to-teal-600",
    bg: "from-emerald-500/10 to-teal-500/8",
    border: "border-emerald-500/20",
    tag: "Jackpot",
    tagColor: "bg-emerald-500/15 text-emerald-400",
  },
  {
    href: "/games/roulette",
    icon: CircleDot,
    title: "Roulette",
    desc: "Mise sur rouge, noir, pair, impair, douzaine ou un numéro précis. Jusqu'à 32× sur un seul chiffre.",
    gradient: "from-rose-500 to-pink-600",
    bg: "from-rose-500/10 to-pink-500/8",
    border: "border-pink-500/20",
    tag: "Casino",
    tagColor: "bg-pink-500/15 text-pink-400",
  },
];

export default function GamesHub() {
  useRequireAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mini Jeux</h1>
              <p className="text-sm text-zinc-500">Mise minimum : $9 — Joue et tente ta chance</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {games.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={game.href}>
                  <Card className={`cursor-pointer border ${game.border} bg-gradient-to-br ${game.bg} hover:scale-[1.02] transition-all duration-200 group`}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${game.tagColor}`}>
                          {game.tag}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">{game.title}</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">{game.desc}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}>
                        Jouer maintenant
                        <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
