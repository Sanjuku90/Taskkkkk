import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Phase = "idle" | "spinning" | "result";
type BetGroup = "color" | "dozen" | "number";
interface Result { result: number; isRed: boolean; multiplier: number; payout: number; won: boolean; }

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const BET_TYPES = [
  { value: "rouge",     label: "🔴 Rouge",   group: "color"  as BetGroup },
  { value: "noir",      label: "⚫ Noir",    group: "color"  as BetGroup },
  { value: "pair",      label: "Pair",       group: "color"  as BetGroup },
  { value: "impair",    label: "Impair",     group: "color"  as BetGroup },
  { value: "douzaine1", label: "1 – 12",     group: "dozen"  as BetGroup },
  { value: "douzaine2", label: "13 – 24",    group: "dozen"  as BetGroup },
  { value: "douzaine3", label: "25 – 36",    group: "dozen"  as BetGroup },
];

const MULTIPLIERS: Record<string, Record<string, number>> = {
  easy:   { color: 1.80, dozen: 2.70, number: 32 },
  medium: { color: 1.72, dozen: 2.58, number: 31 },
  hard:   { color: 1.64, dozen: 2.46, number: 29 },
};

function numColor(n: number): string {
  if (n === 0) return "bg-emerald-600";
  return RED_NUMS.has(n) ? "bg-rose-600" : "bg-zinc-700";
}

export default function Roulette() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [betType, setBetType] = useState("rouge");
  const [betNumber, setBetNumber] = useState<number | null>(null);
  const [useNumber, setUseNumber] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState(9);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [spinNum, setSpinNum] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(user?.balance ?? 0);

  const activeBetType = useNumber ? "number" : betType;
  const activeBetValue = useNumber ? betNumber : null;
  const mults = MULTIPLIERS[difficulty];

  const currentMult = useMemo(() => {
    if (useNumber) return mults.number;
    const t = BET_TYPES.find(b => b.value === betType);
    return t ? mults[t.group] : mults.color;
  }, [useNumber, betType, difficulty]);

  const winChancePct = useMemo(() => {
    if (useNumber) return Math.round(100 / 37);
    if (betType.startsWith("douzaine")) return Math.round(12 / 37 * 100);
    return Math.round(18 / 37 * 100);
  }, [useNumber, betType]);

  const gain = Math.round(betAmount * currentMult * 100) / 100;

  async function spin() {
    setError(null);
    if (useNumber && betNumber === null) { setError("Choisis un numéro (0–36)"); return; }
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }
    setPhase("spinning");
    setResult(null);
    let ticks = 0;
    const tick = setInterval(() => {
      setSpinNum(Math.floor(Math.random() * 37));
      if (++ticks > 20) clearInterval(tick);
    }, 70);
    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, difficulty, betType: activeBetType, betValue: activeBetValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await new Promise(r => setTimeout(r, 1500));
      clearInterval(tick);
      setSpinNum(data.result);
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      clearInterval(tick);
      setError(e.message);
      setPhase("idle");
    }
  }

  function reset() { setPhase("idle"); setResult(null); setSpinNum(null); setError(null); }

  const displayNum = spinNum;

  return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-wide">ROULETTE</h1>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Big result display */}
        <div className="flex flex-col items-center mb-6" style={{ minHeight: 180 }}>
          <AnimatePresence mode="wait">
            {phase === "idle" ? (
              <motion.div key="idle" className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center">
                  <span className="text-5xl font-black text-zinc-700">?</span>
                </div>
                <p className="text-zinc-600 text-sm">Choisis ta mise et lance</p>
              </motion.div>
            ) : (
              <motion.div key="spinning" className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div
                  animate={phase === "spinning" ? { rotate: 360 } : {}}
                  transition={{ duration: 0.3, repeat: phase === "spinning" ? Infinity : 0, ease: "linear" }}
                  className="relative w-32 h-32"
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-6xl font-black text-white shadow-xl ${
                    phase === "result" && result
                      ? result.isRed ? "bg-rose-600 shadow-rose-500/30"
                      : result.result === 0 ? "bg-emerald-700 shadow-emerald-500/30"
                      : "bg-zinc-700 shadow-zinc-500/20"
                      : displayNum !== null ? numColor(displayNum) + " transition-colors"
                      : "bg-zinc-800"
                  }`}>
                    {displayNum !== null ? displayNum : "?"}
                  </div>
                </motion.div>
                {phase === "result" && result && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <p className={`text-2xl font-black ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.won ? `+$${result.payout.toFixed(2)}` : "Perdu"}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {result.result} — {result.result === 0 ? "🟢 Zéro" : result.isRed ? "🔴 Rouge" : "⚫ Noir"}
                      {result.result > 0 && (result.result % 2 === 0 ? " • Pair" : " • Impair")}
                    </p>
                  </motion.div>
                )}
                {phase === "spinning" && <p className="text-zinc-400 text-sm animate-pulse">La bille tourne...</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">x{currentMult}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Multiplicateur</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">${gain.toFixed(2)}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Gain possible</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">{winChancePct}%</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Chance</p>
          </div>
        </div>

        {/* Bet type tabs */}
        {phase !== "spinning" && (
          <>
            {/* Color/Dozen bets */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {BET_TYPES.filter(b => b.group === "color").map(b => (
                <button key={b.value}
                  onClick={() => { setBetType(b.value); setUseNumber(false); reset(); }}
                  className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                    !useNumber && betType === b.value
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                  }`}>
                  {b.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {BET_TYPES.filter(b => b.group === "dozen").map(b => (
                <button key={b.value}
                  onClick={() => { setBetType(b.value); setUseNumber(false); reset(); }}
                  className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                    !useNumber && betType === b.value
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                  }`}>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Number toggle + picker */}
            <div className="mb-4">
              <button onClick={() => { setUseNumber(n => !n); reset(); }}
                className={`w-full py-2.5 rounded-xl border font-bold text-sm transition-all mb-2 ${
                  useNumber ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                            : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}>
                Numéro précis — {mults.number}×
                {betNumber !== null && useNumber ? ` (${betNumber} sélectionné)` : ""}
              </button>
              <AnimatePresence>
                {useNumber && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-9 gap-1 bg-white/3 border border-white/8 rounded-xl p-3">
                      {Array.from({ length: 37 }, (_, i) => i).map(n => (
                        <button key={n} onClick={() => { setBetNumber(n); reset(); }}
                          className={`aspect-square rounded-md text-xs font-bold transition-all ${
                            betNumber === n
                              ? `ring-2 ring-white scale-110 ${n === 0 ? "bg-emerald-600" : RED_NUMS.has(n) ? "bg-rose-600" : "bg-zinc-600"}`
                              : n === 0 ? "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-700/60"
                              : RED_NUMS.has(n) ? "bg-rose-900/60 text-rose-300 hover:bg-rose-800/60"
                              : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60"
                          }`}>{n}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Difficulty */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["easy","medium","hard"].map((d, i) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    difficulty === d ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                                    : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                  }`}>
                  {["Facile","Moyen","Difficile"][i]}
                </button>
              ))}
            </div>
          </>
        )}

        {error && <p className="text-rose-400 text-sm text-center font-medium mb-3">{error}</p>}

        {/* Bet + Pari */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center px-3 py-3 gap-2">
              <span className="text-zinc-400 font-bold text-sm">$</span>
              <input type="number" min="9" step="1" value={betAmount}
                onChange={e => { setBetAmount(Number(e.target.value)); reset(); }}
                disabled={phase === "spinning"}
                className="flex-1 bg-transparent text-white font-bold text-base focus:outline-none w-0" />
            </div>
            <div className="flex border-t border-white/6">
              <button onClick={() => { setBetAmount(a => Math.max(9, Math.floor(a / 2))); reset(); }}
                disabled={phase === "spinning"}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all border-r border-white/6">/2</button>
              <button onClick={() => { setBetAmount(a => Math.min(balance, a * 2)); reset(); }}
                disabled={phase === "spinning"}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all">x2</button>
            </div>
          </div>
          <button onClick={phase === "idle" ? spin : phase === "spinning" ? undefined : reset}
            disabled={phase === "spinning"}
            className={`px-8 rounded-xl font-black text-base transition-all ${
              phase === "spinning" ? "bg-blue-600/50 text-blue-300 cursor-not-allowed"
                                   : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            }`}>
            {phase === "spinning"
              ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : phase === "result" ? "Rejouer" : "Pari 🎡"
            }
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/games"><span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Retour aux jeux</span></Link>
        </div>
      </div>
    </AppLayout>
  );
}
