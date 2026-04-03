import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3x3, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",    payouts: [0,0,"0.8×","3.5×","25×","150×"], color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { value: "medium", label: "Moyen",     payouts: [0,0,"0.5×","2.5×","20×","120×"], color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  { value: "hard",   label: "Difficile", payouts: [0,0,"0.3×","1.5×","12×","80×"],  color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
];

type Phase = "setup" | "drawing" | "result";

interface Result { drawn: number[]; matches: number; multiplier: number; payout: number; won: boolean; }

export default function Keno() {
  useRequireAuth();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [picks, setPicks] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<Result | null>(null);
  const [animDrawn, setAnimDrawn] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.balance ?? 0;
  const diff = DIFFICULTIES.find(d => d.value === difficulty)!;

  function togglePick(n: number) {
    if (phase !== "setup") return;
    setPicks(prev => prev.includes(n) ? prev.filter(p => p !== n) : prev.length < 5 ? [...prev, n] : prev);
  }

  async function play() {
    setError(null);
    if (picks.length !== 5) { setError("Choisis exactement 5 numéros"); return; }
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) { setError("Mise minimum : $9"); return; }
    if (amount > Number(balance)) { setError("Solde insuffisant"); return; }

    setPhase("drawing");
    setAnimDrawn([]);

    try {
      const res = await fetch("/api/games/keno", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, difficulty, picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      // Animate drawing numbers one by one
      for (let i = 0; i < data.drawn.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        setAnimDrawn(prev => [...prev, data.drawn[i]]);
      }
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      setPhase("result");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      setError(e.message);
      setPhase("setup");
    }
  }

  function reset() {
    setPhase("setup"); setResult(null); setPicks([]); setAnimDrawn([]); setError(null);
  }

  const isDrawn = (n: number) => animDrawn.includes(n);
  const isPick = (n: number) => picks.includes(n);
  const isMatch = (n: number) => isPick(n) && isDrawn(n);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Grid3x3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Keno</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl border p-4 text-center space-y-1 ${result.won ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
              <p className="text-sm text-zinc-400">{result.matches} numéro{result.matches !== 1 ? "s" : ""} correct{result.matches !== 1 ? "s" : ""}</p>
              <p className={`text-3xl font-black ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                {result.won ? `+$${result.payout.toFixed(2)}` : "Perdu"}
              </p>
              {result.multiplier > 0 && <p className="text-sm text-zinc-500">{result.multiplier}× la mise</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid 1–40 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {phase === "setup" ? `Choisis 5 numéros (${picks.length}/5)` : `${animDrawn.length} numéros tirés`}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-zinc-500"><span className="w-3 h-3 rounded-sm bg-amber-500/40 inline-block" /> Ton choix</span>
                <span className="flex items-center gap-1 text-zinc-500"><span className="w-3 h-3 rounded-sm bg-emerald-500/40 inline-block" /> Match</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 40 }, (_, i) => i + 1).map(n => (
                <motion.button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={phase !== "setup" && !isPick(n)}
                  whileTap={phase === "setup" ? { scale: 0.88 } : {}}
                  className={`aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isMatch(n)
                      ? "bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 scale-110 shadow-md shadow-emerald-500/20"
                      : isPick(n)
                      ? "bg-amber-500/25 border border-amber-500/50 text-amber-300"
                      : isDrawn(n)
                      ? "bg-white/10 border border-white/20 text-white/70"
                      : "bg-white/4 border border-white/8 text-zinc-500 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        {phase === "setup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté & gains</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d.value} onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${difficulty === d.value ? d.color : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"}`}>
                    <p className="font-bold text-xs mb-1">{d.label}</p>
                    {d.payouts.slice(2).map((p, i) => (
                      <p key={i} className="text-[10px] text-zinc-500">{i + 2} match : <span className="text-white/70 font-semibold">{p}</span></p>
                    ))}
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all" />
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

            <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={play} disabled={picks.length !== 5}>
              <Grid3x3 className="w-4 h-4 mr-2" /> Tirer les numéros
            </Button>
          </motion.div>
        )}

        {phase === "drawing" && (
          <div className="text-center py-4">
            <p className="text-zinc-400 font-semibold animate-pulse">Tirage en cours...</p>
          </div>
        )}

        {phase === "result" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Button className="w-full h-12 text-base font-bold" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Nouvelle partie
            </Button>
            <Link href="/games"><Button variant="ghost" className="w-full">Retour aux jeux</Button></Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
