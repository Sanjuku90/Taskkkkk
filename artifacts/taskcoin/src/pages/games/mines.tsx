import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui-core";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, ArrowLeft, RefreshCw, Banknote } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const DIFFICULTIES = [
  { value: "easy", label: "Facile", mines: 3, color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { value: "medium", label: "Moyen", mines: 7, color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  { value: "hard", label: "Difficile", mines: 15, color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
];

type CellState = "hidden" | "safe" | "mine" | "revealed-mine";
type GamePhase = "setup" | "playing" | "won" | "lost";

export default function Mines() {
  useRequireAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [cells, setCells] = useState<CellState[]>(Array(25).fill("hidden"));
  const [revealedMines, setRevealedMines] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [potentialPayout, setPotentialPayout] = useState(0);
  const [finalPayout, setFinalPayout] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingCell, setLoadingCell] = useState<number | null>(null);
  const [mineCount, setMineCount] = useState(7);

  const balance = user?.balance ?? 0;

  async function startGame() {
    setError(null);
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) { setError("Mise minimum : $9"); return; }
    if (amount > Number(balance)) { setError("Solde insuffisant"); return; }

    try {
      const res = await fetch("/api/games/mines/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ betAmount: amount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      setSessionId(data.sessionId);
      setMineCount(data.mineCount);
      setCells(Array(25).fill("hidden"));
      setRevealedMines([]);
      setMultiplier(1);
      setPotentialPayout(amount);
      setPhase("playing");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      setError(e.message);
    }
  }

  const revealCell = useCallback(async (index: number) => {
    if (phase !== "playing" || cells[index] !== "hidden" || !sessionId) return;
    setLoadingCell(index);

    try {
      const res = await fetch(`/api/games/mines/${sessionId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cellIndex: index }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erreur");

      if (data.isMine) {
        const newCells = [...cells];
        newCells[index] = "mine";
        data.mines?.forEach((m: number) => {
          if (m !== index && newCells[m] !== "safe") newCells[m] = "revealed-mine";
        });
        setCells(newCells);
        setRevealedMines(data.mines ?? []);
        setPhase("lost");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      } else {
        const newCells = [...cells];
        newCells[index] = "safe";
        setCells(newCells);
        setMultiplier(data.multiplier);
        setPotentialPayout(data.potentialPayout);
        if (data.status === "won") {
          setFinalPayout(data.potentialPayout);
          setPhase("won");
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCell(null);
    }
  }, [phase, cells, sessionId, queryClient]);

  async function cashOut() {
    if (!sessionId || phase !== "playing") return;
    const revealed = cells.filter(c => c === "safe").length;
    if (revealed === 0) { setError("Révèle au moins une case avant d'encaisser"); return; }

    try {
      const res = await fetch(`/api/games/mines/${sessionId}/cashout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      setFinalPayout(data.payout);
      setMultiplier(data.multiplier);
      setPhase("won");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      setError(e.message);
    }
  }

  function reset() {
    setPhase("setup");
    setSessionId(null);
    setCells(Array(25).fill("hidden"));
    setRevealedMines([]);
    setMultiplier(1);
    setPotentialPayout(0);
    setFinalPayout(0);
    setError(null);
  }

  const revealedCount = cells.filter(c => c === "safe").length;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <Bomb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mines</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Stats bar during game */}
        <AnimatePresence>
          {phase === "playing" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "Multiplicateur", value: `${multiplier}×`, color: "text-amber-400" },
                { label: "Gain potentiel", value: `$${potentialPayout.toFixed(2)}`, color: "text-emerald-400" },
                { label: "Cases sûres", value: `${revealedCount}/${25 - mineCount}`, color: "text-cyan-400" },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {(phase === "won" || phase === "lost") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl border p-6 text-center space-y-2 ${
                phase === "won"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-rose-500/30 bg-rose-500/10"
              }`}
            >
              <p className="text-4xl">{phase === "won" ? "💎" : "💥"}</p>
              <p className={`text-2xl font-black ${phase === "won" ? "text-emerald-400" : "text-rose-400"}`}>
                {phase === "won" ? `+$${finalPayout.toFixed(2)}` : "Boom ! Mine touchée"}
              </p>
              {phase === "won" && (
                <p className="text-sm text-zinc-400">{multiplier}× sur {revealedCount} case{revealedCount > 1 ? "s" : ""} révélée{revealedCount > 1 ? "s" : ""}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {cells.map((cell, i) => (
                  <motion.button
                    key={i}
                    onClick={() => revealCell(i)}
                    disabled={phase !== "playing" || cell !== "hidden" || loadingCell !== null}
                    whileTap={phase === "playing" && cell === "hidden" ? { scale: 0.92 } : {}}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all text-lg relative overflow-hidden ${
                      cell === "hidden"
                        ? phase === "playing"
                          ? "bg-white/6 border border-white/10 hover:bg-white/12 hover:border-white/20 cursor-pointer active:scale-95"
                          : "bg-white/4 border border-white/6 cursor-default"
                        : cell === "safe"
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : cell === "mine"
                        ? "bg-rose-600/40 border border-rose-500/60"
                        : "bg-rose-500/10 border border-rose-500/20"
                    }`}
                  >
                    {loadingCell === i ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : cell === "safe" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <Gem className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                    ) : cell === "mine" ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                        <Bomb className="w-5 h-5 text-rose-400" />
                      </motion.div>
                    ) : cell === "revealed-mine" ? (
                      <Bomb className="w-4 h-4 text-rose-600/60" />
                    ) : null}
                  </motion.button>
                ))}
              </div>
              {phase === "playing" && (
                <p className="text-center text-xs text-zinc-600 mt-3">
                  <Bomb className="w-3 h-3 inline mr-1 text-rose-500/50" />
                  {mineCount} mine{mineCount > 1 ? "s" : ""} cachée{mineCount > 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Setup controls */}
        {phase === "setup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté (nombre de mines)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      difficulty === d.value ? d.color : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"
                    }`}
                  >
                    <p className="font-bold text-xs">{d.label}</p>
                    <p className="text-lg font-black mt-0.5 flex items-center justify-center gap-1">
                      <Bomb className="w-3.5 h-3.5" />{d.mines}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Mise</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input
                    type="number" min="9" step="1" value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-rose-500/50 focus:bg-white/8 transition-all"
                    placeholder="9"
                  />
                </div>
                <div className="flex gap-2">
                  {[9, 25, 50, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => setBetAmount(String(Math.min(v, Number(balance))))}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-semibold"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-rose-400 text-sm text-center font-medium">{error}</p>}

            <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600" onClick={startGame}>
              <Bomb className="w-4 h-4 mr-2" /> Commencer la partie
            </Button>
          </motion.div>
        )}

        {/* In-game controls */}
        {phase === "playing" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {error && <p className="text-rose-400 text-sm text-center font-medium">{error}</p>}
            <Button
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              onClick={cashOut}
              disabled={revealedCount === 0}
            >
              <Banknote className="w-4 h-4 mr-2" />
              Encaisser — ${potentialPayout.toFixed(2)} ({multiplier}×)
            </Button>
          </motion.div>
        )}

        {/* Post-game controls */}
        {(phase === "won" || phase === "lost") && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Button className="w-full h-12 text-base font-bold" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Nouvelle partie
            </Button>
            <Link href="/games">
              <Button variant="ghost" className="w-full">Retour aux jeux</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
