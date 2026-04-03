import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Phase = "setup" | "drawing" | "result";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    payouts: [0,0,0.8,3.5,25,150] },
  { value: "medium", label: "Moyen",     payouts: [0,0,0.5,2.5,20,120] },
  { value: "hard",   label: "Difficile", payouts: [0,0,0.3,1.5,12,80]  },
];

interface Result { drawn: number[]; matches: number; multiplier: number; payout: number; won: boolean; }

export default function Keno() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState(9);
  const [picks, setPicks] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<Result | null>(null);
  const [animDrawn, setAnimDrawn] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(user?.balance ?? 0);
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;

  function togglePick(n: number) {
    if (phase !== "setup") return;
    setPicks(prev => prev.includes(n) ? prev.filter(p => p !== n) : prev.length < 5 ? [...prev, n] : prev);
  }

  async function play() {
    setError(null);
    if (picks.length !== 5) { setError("Choisis exactement 5 numéros"); return; }
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }
    setPhase("drawing");
    setAnimDrawn([]);
    try {
      const res = await fetch("/api/games/keno", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, difficulty, picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      for (let i = 0; i < data.drawn.length; i++) {
        await new Promise(r => setTimeout(r, 180));
        setAnimDrawn(prev => [...prev, data.drawn[i]]);
      }
      await new Promise(r => setTimeout(r, 300));
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) { setError(e.message); setPhase("setup"); }
  }

  function reset() { setPhase("setup"); setResult(null); setPicks([]); setAnimDrawn([]); setError(null); }

  const isDrawn = (n: number) => animDrawn.includes(n);
  const isPick = (n: number) => picks.includes(n);
  const isMatch = (n: number) => isPick(n) && isDrawn(n);

  const estimatedGain = picks.length === 5 ? Math.round(betAmount * diff.payouts[3] * 100) / 100 : 0;

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
          <h1 className="text-lg font-bold text-white tracking-wide">KENO</h1>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">{picks.length}/5</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Numéros choisis</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">{animDrawn.length}/10</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Tirés</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-emerald-400 font-black text-lg">
              {phase === "result" && result ? `$${result.payout.toFixed(2)}` : `$${estimatedGain.toFixed(2)}`}
            </p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">
              {phase === "result" ? "Gagné" : "3 matchs →"}
            </p>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`mb-4 rounded-xl py-3 px-4 text-center font-bold text-lg ${
                result.won ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                           : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              }`}>
              {result.won
                ? `+$${result.payout.toFixed(2)} — ${result.matches} match${result.matches > 1 ? "s" : ""} !`
                : `${result.matches} match${result.matches > 1 ? "s" : ""} — Perdu`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid 1–40 */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 40 }, (_, i) => i + 1).map(n => (
              <motion.button key={n} onClick={() => togglePick(n)}
                disabled={phase !== "setup" && !isPick(n)}
                whileTap={phase === "setup" ? { scale: 0.85 } : {}}
                className={`aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isMatch(n)  ? "bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 scale-110 shadow-md shadow-emerald-500/20"
                  : isPick(n) ? "bg-blue-500/25 border border-blue-500/50 text-blue-300"
                  : isDrawn(n)? "bg-white/10 border border-white/20 text-white/70"
                  : "bg-white/4 border border-white/8 text-zinc-500 hover:bg-white/10 hover:text-white"
                }`}>
                {n}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-[10px] text-zinc-600">
              <span className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500/40 inline-block" /> Ton choix
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-600">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/40 inline-block" /> Match
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-600">
              <span className="w-3 h-3 rounded-sm bg-white/10 border border-white/20 inline-block" /> Tiré
            </span>
          </div>
        </div>

        {/* Payout table */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-zinc-500 font-semibold mb-2 text-center">GAINS PAR MATCH</p>
          <div className="flex justify-between">
            {[2,3,4,5].map(n => (
              <div key={n} className="text-center">
                <p className="text-zinc-400 text-[10px]">{n} 🎯</p>
                <p className="text-white font-black text-xs">{diff.payouts[n]}×</p>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        {phase === "setup" && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTIES.map(d => (
              <button key={d.value} onClick={() => setDifficulty(d.value)}
                className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                  difficulty === d.value
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        )}

        {phase === "drawing" && (
          <div className="text-center py-2 mb-4">
            <p className="text-zinc-400 font-semibold text-sm animate-pulse">Tirage en cours...</p>
          </div>
        )}

        {error && <p className="text-rose-400 text-sm text-center font-medium mb-3">{error}</p>}

        {/* Bet + Pari / Rejouer */}
        {phase !== "drawing" && (
          <div className="flex items-stretch gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center px-3 py-3 gap-2">
                <span className="text-zinc-400 font-bold text-sm">$</span>
                <input type="number" min="9" step="1" value={betAmount}
                  onChange={e => setBetAmount(Number(e.target.value))}
                  disabled={phase !== "setup"}
                  className="flex-1 bg-transparent text-white font-bold text-base focus:outline-none w-0" />
              </div>
              <div className="flex border-t border-white/6">
                <button onClick={() => setBetAmount(a => Math.max(9, Math.floor(a / 2)))} disabled={phase !== "setup"}
                  className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all border-r border-white/6">/2</button>
                <button onClick={() => setBetAmount(a => Math.min(balance, a * 2))} disabled={phase !== "setup"}
                  className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all">x2</button>
              </div>
            </div>
            <button
              onClick={phase === "setup" ? play : reset}
              disabled={phase === "setup" && picks.length !== 5}
              className={`px-8 rounded-xl font-black text-base transition-all ${
                phase === "setup" && picks.length !== 5
                  ? "bg-white/5 border border-white/10 text-zinc-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              }`}>
              {phase === "setup" ? "Pari 🎱" : "Rejouer"}
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/games"><span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Retour aux jeux</span></Link>
        </div>
      </div>
    </AppLayout>
  );
}
