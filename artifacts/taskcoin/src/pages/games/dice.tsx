import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    threshold: 50, multiplier: "1.88×", desc: "Roll > 50",  color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { value: "medium", label: "Moyen",     threshold: 65, multiplier: "2.65×", desc: "Roll > 65",  color: "border-amber-500/40  bg-amber-500/10  text-amber-400" },
  { value: "hard",   label: "Difficile", threshold: 80, multiplier: "4.56×", desc: "Roll > 80",  color: "border-rose-500/40   bg-rose-500/10   text-rose-400" },
];

type Phase = "idle" | "rolling" | "result";
interface Result { roll: number; threshold: number; won: boolean; payout: number; multiplier: number; }

export default function Dice() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.balance ?? 0;
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;

  async function roll() {
    setError(null);
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) { setError("Mise minimum : $9"); return; }
    if (amount > Number(balance)) { setError("Solde insuffisant"); return; }
    setPhase("rolling");
    setDisplayRoll(null);

    // Animate random numbers before result
    let ticks = 0;
    const tick = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 100) + 1);
      if (++ticks > 12) clearInterval(tick);
    }, 80);

    try {
      const res = await fetch("/api/games/dice", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      await new Promise(r => setTimeout(r, 1100));
      clearInterval(tick);
      setDisplayRoll(data.roll);
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      clearInterval(tick);
      setError(e.message);
      setPhase("idle");
    }
  }

  function reset() { setPhase("idle"); setResult(null); setDisplayRoll(null); setError(null); }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Dices className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dice</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Roll display */}
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-5">
            <AnimatePresence mode="wait">
              {phase === "idle" ? (
                <motion.div key="idle" className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center">
                  <Dices className="w-14 h-14 text-zinc-700" />
                </motion.div>
              ) : (
                <motion.div
                  key="rolling"
                  animate={phase === "rolling" ? { rotate: [0, 10, -10, 8, -8, 0] } : {}}
                  transition={{ duration: 0.15, repeat: phase === "rolling" ? Infinity : 0 }}
                  className={`w-32 h-32 rounded-3xl border-2 flex items-center justify-center text-5xl font-black shadow-xl transition-all ${
                    phase === "result" && result
                      ? result.won
                        ? "border-emerald-500/60 bg-emerald-500/15 shadow-emerald-500/20"
                        : "border-rose-500/60 bg-rose-500/15 shadow-rose-500/20"
                      : "border-cyan-500/40 bg-cyan-500/10 shadow-cyan-500/15"
                  }`}
                >
                  <span className={phase === "result" && result ? (result.won ? "text-emerald-400" : "text-rose-400") : "text-cyan-400"}>
                    {displayRoll ?? "?"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center space-y-1">
              <p className="text-zinc-500 text-sm">
                Condition : <span className="text-white font-semibold">Roll &gt; {diff.threshold}</span>
                <span className="mx-2 text-zinc-700">•</span>
                Gain : <span className="text-amber-400 font-semibold">{diff.multiplier}</span>
              </p>
              <AnimatePresence mode="wait">
                {phase === "result" && result && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`text-2xl font-black flex items-center justify-center gap-2 ${result.won ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {result.won
                      ? <><TrendingUp className="w-5 h-5" /> +${result.payout.toFixed(2)}</>
                      : <><TrendingDown className="w-5 h-5" /> Perdu</>
                    }
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Roll bar */}
            <div className="w-full space-y-1.5">
              <div className="relative w-full h-4 rounded-full overflow-hidden bg-white/6">
                <div className="absolute inset-y-0 left-0 rounded-full bg-rose-500/40" style={{ width: `${diff.threshold}%` }} />
                <div className="absolute inset-y-0 rounded-full bg-emerald-500/40" style={{ left: `${diff.threshold}%`, right: 0 }} />
                {phase !== "idle" && displayRoll && (
                  <motion.div
                    animate={{ left: `${displayRoll - 1}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
                    style={{ left: `${(displayRoll ?? 50) - 1}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 font-medium">
                <span>1 ← Perdant</span>
                <span className="text-zinc-500">{diff.threshold}</span>
                <span>Gagnant → 100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {phase !== "result" ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d.value} onClick={() => setDifficulty(d.value)} disabled={phase === "rolling"}
                    className={`p-3 rounded-xl border text-center transition-all ${difficulty === d.value ? d.color : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"}`}>
                    <p className="font-bold text-xs">{d.label}</p>
                    <p className="text-base font-black mt-0.5">{d.multiplier}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Mise</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input type="number" min="9" step="1" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                    disabled={phase === "rolling"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all" />
                </div>
                <div className="flex gap-2">
                  {[9, 25, 50, 100].map(v => (
                    <button key={v} onClick={() => setBetAmount(String(Math.min(v, Number(balance))))}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-semibold">
                      ${v}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-600">Gain potentiel : <span className="text-amber-400 font-semibold">${(Number(betAmount || 0) * Number(diff.multiplier)).toFixed(2)}</span></p>
              </CardContent>
            </Card>

            {error && <p className="text-rose-400 text-sm text-center font-medium">{error}</p>}

            <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              onClick={roll} disabled={phase === "rolling"} isLoading={phase === "rolling"}>
              <Dices className="w-4 h-4 mr-2" /> Lancer le dé
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Button className="w-full h-12 text-base font-bold" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Rejouer
            </Button>
            <Link href="/games"><Button variant="ghost" className="w-full">Retour aux jeux</Button></Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
