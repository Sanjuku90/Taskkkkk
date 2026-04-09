export type VipRank = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface VipTier {
  rank: VipRank;
  minDeposit: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
  transferFee: number;
  perks: string[];
  claimBonus: number;
}

export const VIP_TIERS: VipTier[] = [
  {
    rank: "Bronze",
    minDeposit: 0,
    color: "text-amber-700",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-800/40",
    textColor: "text-amber-700",
    icon: "🥉",
    transferFee: 5,
    claimBonus: 0,
    perks: [
      "Accès à toutes les fonctionnalités de base",
      "Frais de transfert : 5%",
      "Bonus de connexion quotidien : 1$",
    ],
  },
  {
    rank: "Silver",
    minDeposit: 1000,
    color: "text-zinc-300",
    bgColor: "bg-zinc-700/20",
    borderColor: "border-zinc-500/40",
    textColor: "text-zinc-300",
    icon: "🥈",
    transferFee: 5,
    claimBonus: 10,
    perks: [
      "Tout Bronze inclus",
      "Frais de transfert : 5%",
      "Badge Silver affiché sur votre profil",
      "Bonus de palier réclamable : +10$",
    ],
  },
  {
    rank: "Gold",
    minDeposit: 5000,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    icon: "🥇",
    transferFee: 3,
    claimBonus: 50,
    perks: [
      "Tout Silver inclus",
      "Frais de transfert réduits : 3%",
      "Badge Gold affiché sur votre profil",
      "Bonus de palier réclamable : +50$",
    ],
  },
  {
    rank: "Platinum",
    minDeposit: 15000,
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-400/30",
    textColor: "text-cyan-300",
    icon: "💎",
    transferFee: 0,
    claimBonus: 150,
    perks: [
      "Tout Gold inclus",
      "Frais de transfert : 0%",
      "Retraits traités en priorité",
      "Support dédié",
      "Bonus de palier réclamable : +150$",
    ],
  },
];

export function getVipTier(totalDeposited: number): VipTier {
  const tiers = [...VIP_TIERS].reverse();
  return tiers.find((t) => totalDeposited >= t.minDeposit) ?? VIP_TIERS[0];
}

export function getNextVipTier(currentTier: VipTier): VipTier | null {
  const idx = VIP_TIERS.findIndex((t) => t.rank === currentTier.rank);
  return idx < VIP_TIERS.length - 1 ? VIP_TIERS[idx + 1] : null;
}
