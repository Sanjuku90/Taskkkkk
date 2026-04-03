import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-core";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ArrowLeft, RefreshCw, Banknote, Zap } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const DIFFICULTIES = [
  { value: "easy", label: "Facile", desc: "Crash lent (~5×)", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { value: "medium", label: "Moyen", desc: "Standard (~2.5×)", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  { value: "hard", label: "Difficile", desc: "Rapide (~1.5×)", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
];

type GamePhase = "setup" | "playing" | "won" | "lost";

function getMultiplierAtTime(startedAt: Date): number {
  const elapsed = (Date.now() - startedAt.getTime()) / 1000;
  return Math.round(Math.exp(0.07 * elapsed) * 100) / 100;
}

function multiplierColor(m: number) {
  if (m < 1.5) return "text-white";
  if (m < 2) return "text-amber-300";
  if (m < 3) return "text-amber-400";
  if (m < 5) return "text-orange-400";
  return "text-rose-400";
}

export default function Crash() {
  useRequireAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [finalMultiplier, setFinalMultiplier] = useState<number | null>(null);
  const [payout, setPayout] = useState(0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cashedOut, setCashedOut] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = user?.balance ?? 0;

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  function startAnimation(start: Date) {
    const tick = () => {
      const m = getMultiplierAtTime(start);
      setCurrentMultiplier(m);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }

  function startPolling(sid: number) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/crash/${sid}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "lost") {
          stopAnimation();
          setCrashPoint(data.crashPoint ?? data.currentMultiplier);
          setFinalMultiplier(data.crashPoint ?? data.currentMultiplier);
          setPhase("lost");
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      } catch {}
    }, 800);
  }

  async function startGame() {
    setError(null);
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) { setError("Mise minimum : $9"); return; }
    if (amount > Number(balance)) { setError("Solde insuffisant"); return; }

    try {
      const res = await fetch("/api/games/crash/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ betAmount: amount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      const start = new Date(data.startedAt);
      setSessionId(data.sessionId);
      setStartedAt(start);
      setCurrentMultiplier(1.0);
      setFinalMultiplier(null);
      setCrashPoint(null);
      setCashedOut(false);
      setPayout(0);
      setPhase("playing");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });

      startAnimation(start);
      startPolling(data.sessionId);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function cashOut() {
    if (!sessionId || phase !== "playing" || cashedOut) return;
    setCashedOut(true);

    try {
      const res = await fetch(`/api/games/crash/${sessionId}/cashout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("Crashé")) {
          stopAnimation();
          setCrashPoint(data.crashPoint);
          setFinalMultiplier(data.crashPoint);
          setPhase("lost");
        } else {
          setError(data.error ?? "Erreur");
          setCashedOut(false);
        }
        return;
      }

      stopAnimation();
      setPayout(data.payout);
      setFinalMultiplier(data.multiplier);
      setPhase("won");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      setError(e.message);
      setCashedOut(false);
    }
  }

  function reset() {
    stopAnimation();
    setPhase("setup");
    setSessionId(null);
    setStartedAt(null);
    setCurrentMultiplier(1.0);
    setFinalMultiplier(null);
    setCrashPoint(null);
    setPayout(0);
    setError(null);
    setCashedOut(false);
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button
              onClick={() => { if (phase === "playing") stopAnimation(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Crash</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Multiplier Display */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <Card className={`border transition-colors duration-500 ${
            phase === "won" ? "border-emerald-500/40" :
            phase === "lost" ? "border-rose-500/40" :
            "border-white/8"
          }`}>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <AnimatePresence mode="wait">
                {phase === "playing" && !cashedOut ? (
                  <motion.div key="playing" className="text-center">
                    <motion.p
                      className={`text-7xl font-black tabular-nums transition-colors duration-200 ${multiplierColor(currentMultiplier)}`}
                    >
                      {currentMultiplier.toFixed(2)}×
                    </motion.p>
                    <p className="text-zinc-500 text-sm mt-2">Encaisse avant le crash !</p>
                  </motion.div>
                ) : phase === "won" ? (
                  <motion.div key="won" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="text-center">
                    <p className="text-6xl font-black text-emerald-400">{finalMultiplier?.toFixed(2)}×</p>
                    <p className="text-2xl font-bold text-emerald-300 mt-2">+${payout.toFixed(2)}</p>
                    <p className="text-zinc-500 text-sm mt-1">Encaissé !</p>
                  </motion.div>
                ) : phase === "lost" ? (
                  <motion.div key="lost" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="text-center">
                    <p className="text-5xl font-black text-rose-400">💥 {finalMultiplier?.toFixed(2)}×</p>
                    <p className="text-zinc-400 text-sm mt-2">Crash ! Tu as perdu ta mise.</p>
                  </motion.div>
                ) : phase === "playing" && cashedOut ? (
                  <motion.div key="cashingout" className="text-center">
                    <p className={`text-7xl font-black tabular-nums ${multiplierColor(currentMultiplier)}`}>
                      {currentMultiplier.toFixed(2)}×
                    </p>
                    <p className="text-emerald-400 text-sm mt-2 animate-pulse font-semibold">Encaissement en cours...</p>
                  </motion.div>
                ) : (
                  <motion.div key="idle" className="text-center">
                    <p className="text-7xl font-black text-zinc-700">1.00×</p>
                    <p className="text-zinc-600 text-sm mt-2">En attente de démarrage</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === "playing" && !cashedOut && (
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${currentMultiplier > 3 ? "bg-rose-500" : currentMultiplier > 2 ? "bg-orange-500" : "bg-violet-500"}`}
                    style={{ width: `${Math.min(100, (currentMultiplier - 1) * 20)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Setup controls */}
        {phase === "setup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté</CardTitle></CardHeader>
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
                    <p className="text-[10px] text-zinc-500 mt-1">{d.desc}</p>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
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

            <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600" onClick={startGame}>
              <Zap className="w-4 h-4 mr-2" /> Lancer le jeu
            </Button>
          </motion.div>
        )}

        {/* In-game cashout */}
        {phase === "playing" && !cashedOut && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {error && <p className="text-rose-400 text-sm text-center font-medium">{error}</p>}
            <Button
              className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25"
              onClick={cashOut}
            >
              <Banknote className="w-5 h-5 mr-2" />
              ENCAISSER — ${(Number(betAmount) * currentMultiplier).toFixed(2)}
            </Button>
          </motion.div>
        )}

        {/* Post-game controls */}
        {(phase === "won" || phase === "lost") && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Button className="w-full h-12 text-base font-bold" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Rejouer
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
