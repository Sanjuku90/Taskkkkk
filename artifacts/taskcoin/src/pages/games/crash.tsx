import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Phase = "setup" | "playing" | "won" | "lost";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    desc: "~2×" },
  { value: "medium", label: "Moyen",     desc: "~1.4×" },
  { value: "hard",   label: "Difficile", desc: "~1.15×" },
];

function getMultiplierAtTime(startedAt: Date): number {
  const elapsed = (Date.now() - startedAt.getTime()) / 1000;
  return Math.round(Math.exp(0.07 * elapsed) * 100) / 100;
}

function multiplierColor(m: number) {
  if (m < 1.5) return "text-white";
  if (m < 2)   return "text-amber-300";
  if (m < 3)   return "text-amber-400";
  if (m < 5)   return "text-orange-400";
  return "text-rose-400";
}

export default function Crash() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState(9);
  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [currentMult, setCurrentMult] = useState(1.0);
  const [finalMult, setFinalMult] = useState<number | null>(null);
  const [payout, setPayout] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = Number(user?.balance ?? 0);

  const stopAll = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  function startAnimation(start: Date) {
    const tick = () => {
      setCurrentMult(getMultiplierAtTime(start));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function startPolling(sid: number) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/crash/${sid}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "lost") {
          stopAll();
          setFinalMult(data.crashPoint ?? data.currentMultiplier);
          setPhase("lost");
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      } catch {}
    }, 800);
  }

  async function startGame() {
    setError(null);
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }
    try {
      const res = await fetch("/api/games/crash/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      const start = new Date(data.startedAt);
      setSessionId(data.sessionId);
      setStartedAt(start);
      setCurrentMult(1.0);
      setFinalMult(null);
      setCashedOut(false);
      setPayout(0);
      setPhase("playing");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      startAnimation(start);
      startPolling(data.sessionId);
    } catch (e: any) { setError(e.message); }
  }

  async function cashOut() {
    if (!sessionId || phase !== "playing" || cashedOut) return;
    setCashedOut(true);
    try {
      const res = await fetch(`/api/games/crash/${sessionId}/cashout`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("Crashé")) {
          stopAll(); setFinalMult(data.crashPoint); setPhase("lost");
        } else { setError(data.error ?? "Erreur"); setCashedOut(false); }
        return;
      }
      stopAll();
      setPayout(data.payout);
      setFinalMult(data.multiplier);
      setPhase("won");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) { setError(e.message); setCashedOut(false); }
  }

  function reset() {
    stopAll();
    setPhase("setup"); setSessionId(null); setStartedAt(null);
    setCurrentMult(1.0); setFinalMult(null); setPayout(0);
    setError(null); setCashedOut(false);
  }

  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;

  return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games">
            <button onClick={() => { if (phase === "playing") stopAll(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-wide">CRASH</h1>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Big multiplier display */}
        <div className="flex flex-col items-center justify-center mb-6" style={{ minHeight: 200 }}>
          <AnimatePresence mode="wait">
            {phase === "setup" && (
              <motion.div key="idle" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-8xl font-black text-zinc-700 tabular-nums">1.00×</p>
                <p className="text-zinc-600 text-sm mt-3">Choisis ta mise et lance</p>
              </motion.div>
            )}
            {phase === "playing" && (
              <motion.div key="playing" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className={`text-8xl font-black tabular-nums transition-colors duration-200 ${multiplierColor(currentMult)}`}>
                  {currentMult.toFixed(2)}×
                </p>
                <p className="text-zinc-500 text-sm mt-3 animate-pulse">Encaisse avant le crash !</p>
                <div className="w-48 bg-white/5 rounded-full h-1.5 overflow-hidden mt-4 mx-auto">
                  <motion.div className={`h-full rounded-full transition-colors duration-500 ${
                    currentMult > 3 ? "bg-rose-500" : currentMult > 2 ? "bg-orange-500" : "bg-violet-500"
                  }`} style={{ width: `${Math.min(100, (currentMult - 1) * 20)}%` }} />
                </div>
              </motion.div>
            )}
            {phase === "won" && (
              <motion.div key="won" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4 }} className="text-center">
                <p className="text-7xl font-black text-emerald-400 tabular-nums">{finalMult?.toFixed(2)}×</p>
                <p className="text-3xl font-black text-emerald-300 mt-2">+${payout.toFixed(2)}</p>
                <p className="text-zinc-500 text-sm mt-1">Encaissé avec succès !</p>
              </motion.div>
            )}
            {phase === "lost" && (
              <motion.div key="lost" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.3 }} className="text-center">
                <p className="text-7xl font-black text-rose-400 tabular-nums">💥 {finalMult?.toFixed(2)}×</p>
                <p className="text-zinc-400 text-sm mt-3">Crash ! Mise perdue.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">${betAmount}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Mise</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">
              ${phase === "playing" ? (betAmount * currentMult).toFixed(2) : gain(betAmount, diff.value)}
            </p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">
              {phase === "playing" ? "Si encaissé" : "Gain estimé"}
            </p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg">{diff.desc}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">{diff.label}</p>
          </div>
        </div>

        {/* Difficulty — only during setup */}
        {phase === "setup" && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTIES.map(d => (
              <button key={d.value} onClick={() => setDifficulty(d.value)}
                className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                  difficulty === d.value
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-white/4 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}>
                <p>{d.label}</p>
                <p className="text-[11px] font-black mt-0.5">{d.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Cashout button during play */}
        {phase === "playing" && !cashedOut && (
          <button onClick={cashOut}
            className="w-full py-4 rounded-xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-4 transition-all">
            ENCAISSER — ${(betAmount * currentMult).toFixed(2)}
          </button>
        )}
        {phase === "playing" && cashedOut && (
          <div className="w-full py-4 rounded-xl font-black text-base bg-emerald-600/30 text-emerald-300 text-center mb-4 animate-pulse">
            Encaissement en cours...
          </div>
        )}

        {/* Bet + Pari / Rejouer */}
        {(phase === "setup" || phase === "won" || phase === "lost") && (
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
            <button onClick={phase === "setup" ? startGame : reset}
              className="px-8 rounded-xl font-black text-base bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all">
              {phase === "setup" ? <>Pari 🚀</> : "Rejouer"}
            </button>
          </div>
        )}

        {error && <p className="text-rose-400 text-sm text-center font-medium mt-3">{error}</p>}
        <div className="mt-4 text-center">
          <Link href="/games"><span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Retour aux jeux</span></Link>
        </div>
      </div>
    </AppLayout>
  );
}

function gain(bet: number, diff: string): string {
  const means: Record<string, number> = { easy: 2, medium: 1.4, hard: 1.15 };
  return (bet * means[diff]).toFixed(2);
}
