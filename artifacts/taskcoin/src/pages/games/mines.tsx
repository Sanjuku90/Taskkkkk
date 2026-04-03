import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type CellState = "hidden" | "safe" | "mine" | "revealed-mine";
type Phase = "setup" | "playing" | "won" | "lost";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    mines: 5  },
  { value: "medium", label: "Moyen",     mines: 10 },
  { value: "hard",   label: "Difficile", mines: 18 },
];

export default function Mines() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState(9);
  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [cells, setCells] = useState<CellState[]>(Array(25).fill("hidden"));
  const [multiplier, setMultiplier] = useState(1);
  const [potentialPayout, setPotentialPayout] = useState(0);
  const [finalPayout, setFinalPayout] = useState(0);
  const [mineCount, setMineCount] = useState(10);
  const [loadingCell, setLoadingCell] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(user?.balance ?? 0);
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;
  const revealedCount = cells.filter(c => c === "safe").length;

  async function startGame() {
    setError(null);
    if (betAmount < 9) { setError("Mise minimum : $9"); return; }
    if (betAmount > balance) { setError("Solde insuffisant"); return; }
    try {
      const res = await fetch("/api/games/mines/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSessionId(data.sessionId);
      setMineCount(data.mineCount);
      setCells(Array(25).fill("hidden"));
      setMultiplier(1);
      setPotentialPayout(betAmount);
      setFinalPayout(0);
      setPhase("playing");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) { setError(e.message); }
  }

  const revealCell = useCallback(async (index: number) => {
    if (phase !== "playing" || cells[index] !== "hidden" || !sessionId || loadingCell !== null) return;
    setLoadingCell(index);
    try {
      const res = await fetch(`/api/games/mines/${sessionId}/reveal`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.isMine) {
        const newCells = [...cells];
        newCells[index] = "mine";
        data.mines?.forEach((m: number) => { if (m !== index && newCells[m] !== "safe") newCells[m] = "revealed-mine"; });
        setCells(newCells);
        setPhase("lost");
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      } else {
        const newCells = [...cells];
        newCells[index] = "safe";
        setCells(newCells);
        setMultiplier(data.multiplier);
        setPotentialPayout(data.potentialPayout);
        if (data.status === "won") { setFinalPayout(data.potentialPayout); setPhase("won"); qc.invalidateQueries({ queryKey: getGetMeQueryKey() }); }
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoadingCell(null); }
  }, [phase, cells, sessionId, loadingCell, qc]);

  async function cashOut() {
    if (!sessionId || phase !== "playing") return;
    if (revealedCount === 0) { setError("Révèle au moins une case"); return; }
    try {
      const res = await fetch(`/api/games/mines/${sessionId}/cashout`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setFinalPayout(data.payout);
      setMultiplier(data.multiplier);
      setPhase("won");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) { setError(e.message); }
  }

  function reset() {
    setPhase("setup"); setSessionId(null); setCells(Array(25).fill("hidden"));
    setMultiplier(1); setPotentialPayout(0); setFinalPayout(0); setError(null);
  }

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
          <h1 className="text-lg font-bold text-white tracking-wide">MINES</h1>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Solde</p>
            <p className="text-sm font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-lg">{phase === "playing" || phase === "won" ? `${multiplier}×` : "—"}</p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Multiplicateur</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-emerald-400 font-black text-lg">
              {phase === "playing" ? `$${potentialPayout.toFixed(2)}` : phase === "won" ? `$${finalPayout.toFixed(2)}` : "—"}
            </p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">
              {phase === "won" ? "Gagné" : "Gain potentiel"}
            </p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-white font-black text-lg flex items-center justify-center gap-1">
              <Bomb className="w-4 h-4 text-rose-400" />{phase === "setup" ? diff.mines : mineCount}
            </p>
            <p className="text-zinc-500 text-[10px] font-medium mt-0.5">Mines</p>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {(phase === "won" || phase === "lost") && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`mb-4 rounded-xl py-3 px-4 text-center font-bold text-lg ${
                phase === "won" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              }`}>
              {phase === "won" ? `+$${finalPayout.toFixed(2)} — ${multiplier}× sur ${revealedCount} case${revealedCount > 1 ? "s" : ""} !`
                               : "💥 Mine touchée !"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-5 gap-2">
            {cells.map((cell, i) => (
              <motion.button key={i}
                onClick={() => revealCell(i)}
                disabled={phase !== "playing" || cell !== "hidden" || loadingCell !== null}
                whileTap={phase === "playing" && cell === "hidden" ? { scale: 0.9 } : {}}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all relative ${
                  cell === "hidden"
                    ? phase === "playing"
                      ? "bg-white/8 border border-white/12 hover:bg-white/14 hover:border-white/22 cursor-pointer"
                      : "bg-white/4 border border-white/7 cursor-default"
                    : cell === "safe"    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : cell === "mine"    ? "bg-rose-600/40 border border-rose-500/60"
                    : "bg-rose-500/10 border border-rose-500/20"
                }`}>
                {loadingCell === i ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : cell === "safe" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <Gem className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : cell === "mine" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
                    <Bomb className="w-5 h-5 text-rose-400" />
                  </motion.div>
                ) : cell === "revealed-mine" ? (
                  <Bomb className="w-4 h-4 text-rose-600/60" />
                ) : null}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Difficulty — setup only */}
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
                <p className="text-[11px] font-black mt-0.5 flex items-center justify-center gap-0.5">
                  <Bomb className="w-3 h-3" />{d.mines}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Cashout during play */}
        {phase === "playing" && (
          <button onClick={cashOut} disabled={revealedCount === 0}
            className={`w-full py-3.5 rounded-xl font-black text-base mb-4 transition-all ${
              revealedCount > 0
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white/5 border border-white/10 text-zinc-600 cursor-not-allowed"
            }`}>
            {revealedCount > 0 ? `ENCAISSER — $${potentialPayout.toFixed(2)} (${multiplier}×)` : "Révèle une case d'abord"}
          </button>
        )}

        {error && <p className="text-rose-400 text-sm text-center font-medium mb-3">{error}</p>}

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
              {phase === "setup" ? <>Pari 💣</> : "Rejouer"}
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
