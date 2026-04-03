import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Button } from "@/components/ui-core";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Direction = "over" | "under";
type Phase = "idle" | "rolling" | "result";

function calcStats(threshold: number, direction: Direction, bet: number) {
  const winChancePct = direction === "over" ? 100 - threshold : threshold - 1;
  const winChance = winChancePct / 100;
  const multiplier = winChance > 0 ? Math.round((0.96 / winChance) * 100) / 100 : 0;
  const gain = Math.round(bet * multiplier * 100) / 100;
  return { multiplier, gain, winChancePct };
}

export default function Dice() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [threshold, setThreshold] = useState(54);
  const [direction, setDirection] = useState<Direction>("over");
  const [betAmount, setBetAmount] = useState(9);
  const [phase, setPhase] = useState<Phase>("idle");
  const [rolledNum, setRolledNum] = useState<number | null>(null);
  const [animNum, setAnimNum] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ won: boolean; payout: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(user?.balance ?? 0);
  const stats = useMemo(() => calcStats(threshold, direction, betAmount), [threshold, direction, betAmount]);

  // Slider background gradient
  const sliderBg = useMemo(() => {
    const pct = ((threshold - 2) / 96) * 100;
    if (direction === "over") {
      // Red on left (lose), blue on right (win)
      return `linear-gradient(to right, #ef4444 0%, #ef4444 ${pct}%, #3b82f6 ${pct}%, #3b82f6 100%)`;
    } else {
      // Blue on left (win), red on right (lose)
      return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #ef4444 ${pct}%, #ef4444 100%)`;
    }
  }, [threshold, direction]);

  async function play() {
    setError(null);
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }

    setPhase("rolling");
    setRolledNum(null);
    setLastResult(null);

    let ticks = 0;
    const tick = setInterval(() => {
      setAnimNum(Math.floor(Math.random() * 100) + 1);
      if (++ticks > 14) clearInterval(tick);
    }, 70);

    try {
      const res = await fetch("/api/games/dice", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, threshold, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      await new Promise(r => setTimeout(r, 1100));
      clearInterval(tick);
      setAnimNum(null);
      setRolledNum(data.roll);
      setLastResult({ won: data.won, payout: data.payout });
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      clearInterval(tick);
      setAnimNum(null);
      setError(e.message);
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setRolledNum(null);
    setAnimNum(null);
    setLastResult(null);
    setError(null);
  }

  const displayRolled = animNum ?? rolledNum;
  const isRolling = phase === "rolling";

  return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col gap-0 min-h-[calc(100vh-120px)]">

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">DICE</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Main numbers display */}
        <div className="flex items-end justify-between mb-8 px-2">
          {/* Ton numéro */}
          <div className="text-center">
            <motion.div
              key={threshold}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-black text-white leading-none tracking-tight tabular-nums"
            >
              {threshold}
            </motion.div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Ton numéro</p>
          </div>

          {/* Dice icon center */}
          <div className="flex flex-col items-center gap-1 pb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-400" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="7" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/>
              </svg>
            </div>
          </div>

          {/* Numéro tombé */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayRolled ?? "empty"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className={`text-8xl font-black leading-none tracking-tight tabular-nums ${
                  phase === "result" && lastResult
                    ? lastResult.won ? "text-emerald-400" : "text-rose-400"
                    : isRolling ? "text-blue-400" : "text-zinc-700"
                }`}
              >
                {displayRolled ?? "00"}
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Numéro tombé</p>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && lastResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 rounded-xl py-3 px-4 text-center font-bold text-lg ${
                lastResult.won
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              }`}
            >
              {lastResult.won ? `+$${lastResult.payout.toFixed(2)} — Gagné !` : "Perdu"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">x{stats.multiplier.toFixed(2)}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Multiplicateur</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">${stats.gain.toFixed(2)}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Gain possible</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">{stats.winChancePct}%</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Chance de gagner</p>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-400 w-6 text-right">{threshold}</span>
            <div className="relative flex-1 h-5 flex items-center">
              <input
                type="range" min={2} max={98} value={threshold}
                onChange={e => { setThreshold(Number(e.target.value)); reset(); }}
                disabled={isRolling}
                className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none dice-slider"
                style={{ background: sliderBg }}
              />
            </div>
          </div>
          {/* Labels */}
          <div className="flex justify-between px-9 text-[10px] font-semibold">
            <span className={direction === "under" ? "text-blue-400" : "text-rose-400"}>1</span>
            <span className={direction === "over" ? "text-blue-400" : "text-rose-400"}>100</span>
          </div>
        </div>

        {/* Direction buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => { setDirection("under"); reset(); }}
            disabled={isRolling}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
              direction === "under"
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <ChevronDown className="w-4 h-4" /> Inférieur
          </button>
          <button
            onClick={() => { setDirection("over"); reset(); }}
            disabled={isRolling}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
              direction === "over"
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <ChevronUp className="w-4 h-4" /> Supérieur
          </button>
        </div>

        {/* Bet input + button */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center px-3 py-3 gap-2">
              <span className="text-zinc-400 font-bold text-sm">$</span>
              <input
                type="number" min="9" step="1" value={betAmount}
                onChange={e => { setBetAmount(Number(e.target.value)); reset(); }}
                disabled={isRolling}
                className="flex-1 bg-transparent text-white font-bold text-base focus:outline-none w-0"
              />
            </div>
            <div className="flex border-t border-white/6">
              <button onClick={() => { setBetAmount(a => Math.max(9, Math.floor(a / 2))); reset(); }}
                disabled={isRolling}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all border-r border-white/6">
                /2
              </button>
              <button onClick={() => { setBetAmount(a => Math.min(balance, a * 2)); reset(); }}
                disabled={isRolling}
                className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                x2
              </button>
            </div>
          </div>

          <button
            onClick={phase === "result" ? reset : play}
            disabled={isRolling}
            className={`px-8 rounded-xl font-black text-base transition-all flex items-center gap-2 ${
              isRolling
                ? "bg-blue-600/50 text-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            }`}
          >
            {isRolling ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : phase === "result" ? "Rejouer" : (
              <>
                Pari
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="12" r="1.5"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm text-center font-medium mt-3">{error}</p>}

        <div className="mt-4 text-center">
          <Link href="/games"><span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Retour aux jeux</span></Link>
        </div>
      </div>

      <style>{`
        .dice-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #1e1e2e;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        .dice-slider::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #1e1e2e;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
          cursor: pointer;
        }
      `}</style>
    </AppLayout>
  );
}
