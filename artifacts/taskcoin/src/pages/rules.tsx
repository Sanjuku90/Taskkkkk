import { AppLayout } from "@/components/layout";
import { Card } from "@/components/ui-core";
import { useRequireAuth } from "@/hooks/use-auth-wrapper";
import { VIP_TIERS } from "@/lib/vip";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Gift, Users, Shield, Gamepad2, Crown, Info, AlertTriangle
} from "lucide-react";

interface RuleSectionProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function RuleSection({ icon: Icon, iconColor, title, children, delay = 0 }: RuleSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          {children}
        </div>
      </Card>
    </motion.div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-primary mt-0.5 shrink-0">•</span>
      <p>{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-amber-200/80">{children}</p>
    </div>
  );
}

export default function Rules() {
  useRequireAuth();

  return (
    <AppLayout>
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-display font-extrabold text-white">Règles & Conditions</h1>
          </div>
          <p className="text-zinc-500 text-sm">Tout ce que vous devez savoir pour utiliser TaskCoin en toute sécurité.</p>
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Dépôts */}
        <RuleSection icon={ArrowDownToLine} iconColor="bg-emerald-500/10 border-emerald-500/25 text-emerald-400" title="Dépôts" delay={0.05}>
          <Rule>Seul le réseau <strong className="text-white">Tron (TRC20)</strong> est accepté — USDT ou TRX uniquement.</Rule>
          <Rule>Après votre envoi, fournissez le <strong className="text-white">hash de transaction</strong> pour validation manuelle.</Rule>
          <Rule>Délai de traitement habituel : <strong className="text-white">10 à 20 minutes</strong>.</Rule>
          <Rule>Montant minimum recommandé : <strong className="text-white">1 USDT</strong>.</Rule>
          <Warning>N'envoyez jamais depuis un exchange directement — utilisez un wallet personnel.</Warning>
        </RuleSection>

        {/* Retraits */}
        <RuleSection icon={ArrowUpFromLine} iconColor="bg-rose-500/10 border-rose-500/25 text-rose-400" title="Retraits" delay={0.1}>
          <Rule>Montant minimum de retrait : <strong className="text-white">60 USDT / TRX</strong>.</Rule>
          <Rule>Délai de traitement : jusqu'à <strong className="text-white">72 heures</strong> ouvrées.</Rule>
          <Rule>Vérifiez toujours l'adresse de destination avant de soumettre.</Rule>
          <Rule>Les retraits sont traités manuellement et irréversibles une fois validés.</Rule>
          <Warning>Toute adresse incorrecte entraîne une perte définitive des fonds.</Warning>
        </RuleSection>

        {/* Transferts */}
        <RuleSection icon={ArrowLeftRight} iconColor="bg-violet-500/10 border-violet-500/25 text-violet-400" title="Transferts internes" delay={0.15}>
          <Rule>Montant minimum : <strong className="text-white">1 USDT</strong>.</Rule>
          <Rule>
            Frais de transfert selon votre rang VIP :
            <span className="block mt-1 ml-3 space-y-0.5">
              <span className="flex gap-2">🥉 Bronze / 🥈 Silver<span className="text-white font-semibold ml-auto">5%</span></span>
              <span className="flex gap-2">🥇 Gold<span className="text-white font-semibold ml-auto">3%</span></span>
              <span className="flex gap-2">💎 Platinum<span className="text-white font-semibold ml-auto">0%</span></span>
            </span>
          </Rule>
          <Rule>
            <strong className="text-white">Règle filleuls :</strong> si le destinataire a des filleuls (référés actifs), l'expéditeur doit lui aussi avoir <strong className="text-white">au moins 1 filleul</strong> pour pouvoir lui envoyer.
          </Rule>
          <Rule>Si le destinataire n'a pas de filleuls, le transfert est toujours autorisé.</Rule>
        </RuleSection>

        {/* Parrainage */}
        <RuleSection icon={Users} iconColor="bg-sky-500/10 border-sky-500/25 text-sky-400" title="Parrainage (Filleuls)" delay={0.2}>
          <Rule>Partagez votre <strong className="text-white">lien de parrainage</strong> pour inviter des amis.</Rule>
          <Rule>Vous recevez des commissions sur les gains de vos filleuls directs.</Rule>
          <Rule>Les filleuls doivent être des comptes actifs pour compter dans votre total.</Rule>
          <Rule>Le parrainage ne peut pas être modifié après inscription.</Rule>
        </RuleSection>

        {/* Bonus quotidien */}
        <RuleSection icon={Gift} iconColor="bg-emerald-500/10 border-emerald-500/25 text-emerald-400" title="Bonus de connexion quotidien" delay={0.25}>
          <Rule>Un bonus de <strong className="text-white">+1 USDT</strong> est automatiquement crédité à votre première connexion de chaque jour.</Rule>
          <Rule>Ce bonus est limité à <strong className="text-white">une seule fois par jour calendaire</strong>.</Rule>
          <Rule>Il est visible dans votre historique de transactions sous l'onglet <strong className="text-white">Bonus</strong>.</Rule>
          <Rule>Aucune action requise — il est crédité lors de votre connexion.</Rule>
        </RuleSection>

        {/* Tâches */}
        <RuleSection icon={Crown} iconColor="bg-primary/10 border-primary/25 text-primary" title="Tâches journalières" delay={0.3}>
          <Rule>Des tâches sont proposées chaque jour pour gagner des récompenses supplémentaires.</Rule>
          <Rule>Les gains dépendent de votre <strong className="text-white">plan d'investissement actif</strong>.</Rule>
          <Rule>Les tâches sont réinitialisées chaque jour à minuit.</Rule>
          <Rule>Une tâche complétée ne peut pas être refaite le même jour.</Rule>
        </RuleSection>

        {/* VIP */}
        <div className="lg:col-span-2">
          <RuleSection icon={Shield} iconColor="bg-primary/10 border-primary/25 text-primary" title="Paliers VIP & Bonus réclamables" delay={0.35}>
            <p className="text-zinc-500 text-xs mb-4">Votre rang VIP est calculé automatiquement selon le total de vos dépôts approuvés. Un bonus unique est disponible à chaque palier.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {VIP_TIERS.map((tier) => (
                <div key={tier.rank} className={cn("rounded-xl border p-4 space-y-2", tier.bgColor, tier.borderColor)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tier.icon}</span>
                    <span className={cn("font-bold text-sm", tier.textColor)}>{tier.rank}</span>
                  </div>
                  <p className="text-xs text-zinc-500">Dépôts requis :</p>
                  <p className={cn("font-bold text-sm", tier.textColor)}>
                    {tier.minDeposit === 0 ? "Gratuit (défaut)" : `≥ ${formatCurrency(tier.minDeposit)}`}
                  </p>
                  {tier.claimBonus > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-zinc-500">Bonus réclamable :</p>
                      <p className={cn("font-bold text-sm", tier.textColor)}>+{formatCurrency(tier.claimBonus)}</p>
                    </div>
                  )}
                  <ul className="space-y-1 mt-2 pt-2 border-t border-white/10">
                    {tier.perks.map((p, i) => (
                      <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                        <span className={cn("shrink-0 mt-0.5", tier.textColor)}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </RuleSection>
        </div>

        {/* Casino */}
        <div className="lg:col-span-2">
          <RuleSection icon={Gamepad2} iconColor="bg-purple-500/10 border-purple-500/25 text-purple-400" title="Jeux (Casino)" delay={0.4}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "CoinFlip", desc: "Choisissez face ou pile. 50% de chance de doubler votre mise. Maison : 5%." },
                { name: "Mines", desc: "Évitez les mines pour multiplier votre gain. Plus vous allez loin, plus vous risquez." },
                { name: "Crash", desc: "Encaissez avant le crash. Plus vous attendez, plus votre multiplicateur monte." },
                { name: "Dice", desc: "Pariez sur un résultat de dé. Réglage du seuil gagnant et probabilité ajustable." },
                { name: "Keno", desc: "Choisissez des numéros et découvrez combien vous en avez deviné." },
                { name: "Roulette", desc: "Pariez sur une couleur ou un numéro. Roulette européenne (37 cases)." },
              ].map((game) => (
                <div key={game.name} className="p-3 rounded-xl bg-white/4 border border-white/8">
                  <p className="font-semibold text-white text-sm mb-1">{game.name}</p>
                  <p className="text-xs text-zinc-500">{game.desc}</p>
                </div>
              ))}
            </div>
            <Warning>Les jeux impliquent un risque de perte. Ne misez que ce que vous êtes prêt à perdre. Les résultats sont aléatoires.</Warning>
          </RuleSection>
        </div>

        {/* Général */}
        <div className="lg:col-span-2">
          <RuleSection icon={Info} iconColor="bg-zinc-700/30 border-zinc-600/30 text-zinc-400" title="Conditions générales" delay={0.45}>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
              <Rule>Un seul compte par personne est autorisé.</Rule>
              <Rule>Tout comportement frauduleux entraîne une suspension immédiate.</Rule>
              <Rule>TaskCoin se réserve le droit de modifier les règles à tout moment.</Rule>
              <Rule>En cas de litige, contactez le support via votre profil.</Rule>
              <Rule>Les soldes en USDT/TRX sont des actifs numériques non-garantis.</Rule>
              <Rule>TaskCoin n'est pas responsable des pertes liées aux jeux.</Rule>
            </div>
          </RuleSection>
        </div>

      </div>
    </AppLayout>
  );
}
