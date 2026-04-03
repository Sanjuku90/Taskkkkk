import { AppLayout } from "@/components/layout";
import { useRequireAuth, useAuth } from "@/hooks/use-auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDot, ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const DIFFICULTIES = [
  { value: "easy", label: "Facile", multiplier: "1.4×", desc: "Marge élevée", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { value: "medium", label: "Moyen", multiplier: "1.6×", desc: "Marge forte", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  { value: "hard", label: "Difficile", multiplier: "1.85×", desc: "Risque max", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
];

type GameState = "idle" | "flipping" | "result";

interface Result {
  result: "pile" | "face";
  won: boolean;
  payout: number;
  multiplier: number;
}

export default function CoinFlip() {
  useRequireAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [difficulty, setDifficulty] = useState("medium");
  const [betAmount, setBetAmount] = useState("9");
  const [choice, setChoice] = useState<"pile" | "face">("pile");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.balance ?? 0;

  async function play() {
    setError(null);
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 9) {
      setError("Mise minimum : $9");
      return;
    }
    if (amount > Number(balance)) {
      setError("Solde insuffisant");
      return;
    }

    setGameState("flipping");
    setResult(null);

    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ betAmount: amount, choice, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      await new Promise(r => setTimeout(r, 1400));
      setResult(data);
      setGameState("result");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      setError(e.message);
      setGameState("idle");
    }
  }

  function reset() {
    setGameState("idle");
    setResult(null);
    setError(null);
  }

  const chosenDiff = DIFFICULTIES.find(d => d.value === difficulty)!;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <CircleDot className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Pile ou Face</h1>
            <p className="text-xs text-zinc-500">Solde : ${Number(balance).toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Coin Visual */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="py-10 flex flex-col items-center gap-6">
              <AnimatePresence mode="wait">
                {gameState === "flipping" ? (
                  <motion.div
                    key="flipping"
                    animate={{ rotateY: [0, 360, 720, 1080] }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/30 flex items-center justify-center"
                  >
                    <CircleDot className="w-12 h-12 text-zinc-950" />
                  </motion.div>
                ) : gameState === "result" && result ? (
                  <motion.div
                    key="result"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl ${
                      result.won
                        ? "bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-emerald-500/30"
                        : "bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-500/30"
                    }`}
                  >
                    <span className="text-3xl font-black text-white">
                      {result.result === "pile" ? "P" : "F"}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-white/10 shadow-lg flex items-center justify-center"
                  >
                    <span className="text-2xl font-black text-zinc-400">
                      {choice === "pile" ? "P" : "F"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {gameState === "result" && result ? (
                  <motion.div
                    key="result-text"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-1"
                  >
                    <p className={`text-2xl font-black ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.won ? `+$${result.payout.toFixed(2)}` : `-$${betAmount}`}
                    </p>
                    <p className="text-sm text-zinc-500">
                      Résultat : <span className="text-white font-semibold capitalize">{result.result}</span>
                      {result.won ? (
                        <span className="text-emerald-400 ml-2 inline-flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> {result.multiplier}×
                        </span>
                      ) : (
                        <span className="text-rose-400 ml-2 inline-flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> Perdu
                        </span>
                      )}
                    </p>
                  </motion.div>
                ) : gameState === "flipping" ? (
                  <motion.p key="flipping-text" className="text-zinc-400 font-semibold animate-pulse">
                    Lancement en cours...
                  </motion.p>
                ) : (
                  <motion.p key="idle-text" className="text-zinc-500 text-sm">
                    Choisis ton côté et mise
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {gameState !== "result" ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            {/* Choice */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Ton choix</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {["pile", "face"].map(c => (
                  <button
                    key={c}
                    onClick={() => setChoice(c as "pile" | "face")}
                    disabled={gameState === "flipping"}
                    className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                      choice === c
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                        : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    {c === "pile" ? "🟡 Pile" : "⚪ Face"}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Difficulty */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Difficulté</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    disabled={gameState === "flipping"}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      difficulty === d.value ? d.color : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"
                    }`}
                  >
                    <p className="font-bold text-xs">{d.label}</p>
                    <p className="text-base font-black mt-0.5">{d.multiplier}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Bet */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Mise</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    min="9"
                    step="1"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    disabled={gameState === "flipping"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white font-bold text-lg focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
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
                <p className="text-xs text-zinc-600">
                  Gain potentiel : <span className="text-amber-400 font-semibold">
                    ${(Number(betAmount || 0) * (chosenDiff ? Number(chosenDiff.multiplier) : 0)).toFixed(2)}
                  </span>
                </p>
              </CardContent>
            </Card>

            {error && (
              <p className="text-rose-400 text-sm text-center font-medium">{error}</p>
            )}

            <Button
              className="w-full h-12 text-base font-bold"
              onClick={play}
              disabled={gameState === "flipping"}
              isLoading={gameState === "flipping"}
            >
              🎯 Lancer la pièce
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
