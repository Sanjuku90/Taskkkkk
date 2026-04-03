import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDot, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    edge: "10% marge", multipliers: { color: "1.80×", dozen: "2.70×", number: "32×" } },
  { value: "medium", label: "Moyen",     edge: "14% marge", multipliers: { color: "1.72×", dozen: "2.58×", number: "31×" } },
  { value: "hard",   label: "Difficile", edge: "18% marge", multipliers: { color: "1.64×", dozen: "2.46×", number: "29×" } },
];

const BET_TYPES = [
  { value: "rouge",     label: "🔴 Rouge",    group: "color",  desc: "18 numéros" },
  { value: "noir",      label: "⚫ Noir",     group: "color",  desc: "18 numéros" },
  { value: "pair",      label: "2️⃣ Pair",     group: "color",  desc: "1–36 pairs" },
  { value: "impair",    label: "1️⃣ Impair",   group: "color",  desc: "1–36 impairs" },
  { value: "douzaine1", label: "1–12",         group: "dozen",  desc: "Douzaine" },
  { value: "douzaine2", label: "13–24",        group: "dozen",  desc: "Douzaine" },
  { value: "douzaine3", label: "25–36",        group: "dozen",  desc: "Douzaine" },
];

type Phase = "setup" | "spinning" | "result";
interface Result { result: number; isRed: boolean; multiplier: number; payout: number; won: boolean; }

function numColor(n: number) {
  if (n === 0) return "bg-emerald-600 text-white";
  return RED_NUMS.has(n) ? "bg-rose-600 text-white" : "bg-zinc-800 text-white";
}

export default function Roulette() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [betType, setBetType] = useState("rouge");
  const [betNumber, setBetNumber] = useState<number | null>(null);
  const [useNumber, setUseNumber] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<Result | null>(null);
  const [spinNum, setSpinNum] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.balance ?? 0;
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;

  const activeBetType = useNumber ? "number" : betType;
  const activeBetValue = useNumber ? betNumber : null;

  async function spin() {
    setError(null);
    if (useNumber && betNumber === null) { setError("Choisis un numéro (0–36)"); return; }
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) { setError("Mise minimum : $9"); return; }
    if (amount > Number(balance)) { setError("Solde insuffisant"); return; }

    setPhase("spinning");
    setSpinNum(null);

    let ticks = 0;
    const tick = setInterval(() => {
      setSpinNum(Math.floor(Math.random() * 37));
      if (++ticks > 18) clearInterval(tick);
    }, 80);

    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, difficulty, betType: activeBetType, betValue: activeBetValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      await new Promise(r => setTimeout(r, 1600));
      clearInterval(tick);
      setSpinNum(data.result);
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      clearInterval(tick);
      setError(e.message);
      setPhase("setup");
    }
  }

  function reset() { setPhase("setup"); setResult(null); setSpinNum(null); setError(null); }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <CircleDot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Roulette</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Ball display */}
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-5">
            <motion.div
              animate={phase === "spinning" ? { rotate: 360 } : {}}
              transition={{ duration: 0.4, repeat: phase === "spinning" ? Infinity : 0, ease: "linear" }}
              className="relative w-36 h-36"
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900" />
              {/* Color segments hint */}
              <div className="absolute inset-3 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-rose-700/40" />
                <div className="flex-1 bg-zinc-800/60" />
              </div>
              {/* Center number */}
              <div className={`absolute inset-8 rounded-full flex items-center justify-center font-black text-2xl shadow-inner ${
                spinNum !== null ? numColor(spinNum) :
                phase === "result" && result ? numColor(result.result) : "bg-zinc-800 text-zinc-500"
              }`}>
                {phase === "setup" ? <CircleDot className="w-8 h-8 text-zinc-600" /> : (spinNum ?? result?.result ?? "?")}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {phase === "result" && result ? (
                <motion.div key="res" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
                  <p className="text-sm text-zinc-400">
                    <span className={`font-bold ${result.isRed ? "text-rose-400" : result.result === 0 ? "text-emerald-400" : "text-white"}`}>
                      {result.result} {result.result === 0 ? "🟢" : result.isRed ? "🔴" : "⚫"}
                    </span>
                  </p>
                  <p className={`text-2xl font-black ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.won ? `+$${result.payout.toFixed(2)}` : "Perdu"}
                  </p>
                  {result.won && <p className="text-xs text-zinc-500">{result.multiplier}× la mise</p>}
                </motion.div>
              ) : phase === "spinning" ? (
                <motion.p key="spin" className="text-zinc-400 font-semibold animate-pulse text-sm">La bille tourne...</motion.p>
              ) : (
                <motion.p key="idle" className="text-zinc-600 text-sm">Choisis ta mise et lance</motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {phase !== "result" ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Difficulty */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => {
                  const active = difficulty === d.value;
                  return (
                    <button key={d.value} onClick={() => setDifficulty(d.value)} disabled={phase === "spinning"}
                      className={`p-3 rounded-xl border text-center transition-all ${active ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"}`}>
                      <p className="font-bold text-xs">{d.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{d.edge}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Bet type */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Type de mise</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Numéro précis ({diff.multipliers.number})</span>
                    <button
                      onClick={() => setUseNumber(n => !n)}
                      className={`w-10 h-5 rounded-full transition-all relative ${useNumber ? "bg-rose-500" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useNumber ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {useNumber ? (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-500">Choisis un numéro (0–36) — gain {diff.multipliers.number}</p>
                    <div className="grid grid-cols-9 gap-1">
                      {Array.from({ length: 37 }, (_, i) => i).map(n => (
                        <button key={n} onClick={() => setBetNumber(n)}
                          disabled={phase === "spinning"}
                          className={`aspect-square rounded-md text-xs font-bold transition-all ${
                            betNumber === n
                              ? "ring-2 ring-white scale-110 " + (n === 0 ? "bg-emerald-600" : RED_NUMS.has(n) ? "bg-rose-600" : "bg-zinc-600")
                              : n === 0 ? "bg-emerald-800/60 text-emerald-300 hover:bg-emerald-700/60"
                              : RED_NUMS.has(n) ? "bg-rose-900/60 text-rose-300 hover:bg-rose-800/60"
                              : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60"
                          }`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {BET_TYPES.filter(b => b.group === "color").map(b => (
                        <button key={b.value} onClick={() => setBetType(b.value)} disabled={phase === "spinning"}
                          className={`p-3 rounded-xl border text-center transition-all ${betType === b.value ? "border-rose-500/50 bg-rose-500/15 text-white" : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/15 hover:text-white"}`}>
                          <p className="font-semibold text-sm">{b.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{diff.multipliers.color}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {BET_TYPES.filter(b => b.group === "dozen").map(b => (
                        <button key={b.value} onClick={() => setBetType(b.value)} disabled={phase === "spinning"}
                          className={`p-3 rounded-xl border text-center transition-all ${betType === b.value ? "border-rose-500/50 bg-rose-500/15 text-white" : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/15 hover:text-white"}`}>
                          <p className="font-semibold text-sm">{b.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{diff.multipliers.dozen}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bet amount */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Mise</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input type="number" min="9" step="1" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                    disabled={phase === "spinning"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-rose-500/50 focus:bg-white/8 transition-all" />
                </div>
                <div className="flex gap-2">
                  {[9, 25, 50, 100].map(v => (
                    <button key={v} onClick={() => setBetAmount(String(Math.min(v, Number(balance))))}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-semibold">
                      ${v}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-rose-400 text-sm text-center font-medium">{error}</p>}

            <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
              onClick={spin} disabled={phase === "spinning"} isLoading={phase === "spinning"}>
              <CircleDot className="w-4 h-4 mr-2" /> Lancer la roulette
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
