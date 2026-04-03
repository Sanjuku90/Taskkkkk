import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Phase = "idle" | "flipping" | "result";
type Side = "pile" | "face";
interface Result { result: Side; won: boolean; payout: number; multiplier: number; }

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",   mult: 1.4,  chance: 69 },
  { value: "medium", label: "Moyen",    mult: 1.6,  chance: 60 },
  { value: "hard",   label: "Difficile",mult: 1.85, chance: 52 },
];

export default function CoinFlip() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState(9);
  const [choice, setChoice] = useState<Side>("pile");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [animSide, setAnimSide] = useState<Side | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(user?.balance ?? 0);
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;
  const gain = Math.round(betAmount * diff.mult * 100) / 100;

  async function play() {
    setError(null);
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }
    setPhase("flipping");
    setResult(null);
    let ticks = 0;
    const tick = setInterval(() => {
      setAnimSide(ticks % 2 === 0 ? "pile" : "face");
      if (++ticks > 10) clearInterval(tick);
    }, 120);
    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, choice, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await new Promise(r => setTimeout(r, 1400));
      clearInterval(tick);
      setAnimSide(data.result);
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      clearInterval(tick);
      setError(e.message);
      setPhase("idle");
    }
  }

  function reset() { setPhase("idle"); setResult(null); setAnimSide(null); setError(null); }

  const displaySide = animSide ?? (phase === "idle" ? null : null);
  const isFlipping = phase === "flipping";

  return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-wide">PILE OU FACE</h1>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Main display — Ton choix | Résultat */}
        <div className="flex items-end justify-between mb-8 px-2">
          <div className="text-center">
            <motion.div
              animate={isFlipping ? { rotateY: [0, 180, 360, 540, 720] } : {}}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl text-5xl font-black mx-auto ${
                choice === "pile"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30 text-zinc-900"
                  : "bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-zinc-400/20 text-zinc-900"
              }`}
            >
              {choice === "pile" ? "P" : "F"}
            </motion.div>
            <p className="text-xs text-zinc-500 mt-3 font-medium">Ton choix</p>
          </div>

          <div className="flex flex-col items-center pb-8">
            <span className="text-zinc-700 text-2xl font-black">VS</span>
          </div>

          <div className="text-center">
            <AnimatePresence mode="wait">
              {phase === "idle" ? (
                <motion.div key="idle"
                  className="w-28 h-28 rounded-full bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center mx-auto">
                  <span className="text-4xl text-zinc-700">?</span>
                </motion.div>
              ) : (
                <motion.div key={displaySide ?? "flip"}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl text-5xl font-black mx-auto ${
                    phase === "result" && result
                      ? result.won
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30 text-white"
                        : "bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/30 text-white"
                      : displaySide === "pile"
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-900"
                        : "bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-900"
                  }`}
                >
                  {displaySide ? (displaySide === "pile" ? "P" : "F") : "?"}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-xs text-zinc-500 mt-3 font-medium">Résultat</p>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`mb-4 rounded-xl py-3 px-4 text-center font-bold text-lg ${
                result.won ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                           : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              }`}>
              {result.won ? `+$${result.payout.toFixed(2)} — Gagné !` : "Perdu"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">x{diff.mult.toFixed(2)}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Multiplicateur</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">${gain.toFixed(2)}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Gain possible</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">{diff.chance}%</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Chance</p>
          </div>
        </div>

        {/* Difficulty */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {DIFFICULTIES.map(d => (
            <button key={d.value} onClick={() => { setDifficulty(d.value); reset(); }} disabled={isFlipping}
              className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                difficulty === d.value
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                  : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}>
              <p>{d.label}</p>
              <p className="text-[11px] font-black mt-0.5">{d.mult}×</p>
            </button>
          ))}
        </div>

        {/* Choice */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(["pile", "face"] as Side[]).map(s => (
            <button key={s} onClick={() => { setChoice(s); reset(); }} disabled={isFlipping}
              className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                choice === s
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                  : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}>
              {s === "pile" ? "🟡 Pile" : "⚪ Face"}
            </button>
          ))}
        </div>

        {/* Bet + Pari */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center px-3 py-3 gap-2">
              <span className="text-zinc-400 font-bold text-sm">$</span>
              <input type="number" min="9" step="1" value={betAmount}
                onChange={e => { setBetAmount(Number(e.target.value)); reset(); }}
                disabled={isFlipping}
                className="flex-1 bg-transparent text-white font-bold text-base focus:outline-none w-0" />
            </div>
            <div className="flex border-t border-white/6">
              <button onClick={() => { setBetAmount(a => Math.max(9, Math.floor(a / 2))); reset(); }}
                disabled={isFlipping}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all border-r border-white/6">
                /2
              </button>
              <button onClick={() => { setBetAmount(a => Math.min(balance, a * 2)); reset(); }}
                disabled={isFlipping}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                x2
              </button>
            </div>
          </div>
          <button onClick={phase === "result" ? reset : play} disabled={isFlipping}
            className={`px-8 rounded-xl font-black text-base transition-all ${
              isFlipping ? "bg-blue-600/50 text-blue-300 cursor-not-allowed"
                         : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            }`}>
            {isFlipping ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : phase === "result" ? "Rejouer" : "Pari 🪙"}
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm text-center font-medium mt-3">{error}</p>}
        <div className="mt-4 text-center">
          <Link href="/games"><span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Retour aux jeux</span></Link>
        </div>
      </div>
    </AppLayout>
  );
}
