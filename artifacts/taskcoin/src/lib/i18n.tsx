import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "taskcoin_lang";

export type Lang = "fr" | "en";

const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      plans: "Investment Plans",
      tasks: "Daily Tasks",
      transactions: "Transactions",
      referral: "Referrals",
      overview: "Overview",
      manageUsers: "Manage Users",
      bonusCatalog: "Bonus Catalog",
      specialBonuses: "Special Bonuses",
      siteSettings: "Site Settings",
      loggedInAs: "Logged in as",
      logout: "Sign Out",
    },
    common: {
      copy: "Copy",
      copied: "Copied!",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading…",
      noData: "No data available",
      active: "Active",
      inactive: "Inactive",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      yes: "Yes",
      no: "No",
      balance: "Balance",
      total: "Total",
      date: "Date",
      status: "Status",
      actions: "Actions",
      search: "Search",
      of: "of",
      earn: "Earn",
      claim: "Claim",
      claimed: "Claimed",
      eligible: "Eligible",
      progress: "Progress",
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      totalBalance: "Total Balance",
      activePlan: "Active Plan",
      noPlan: "No active plan",
      totalDeposited: "Total Deposited",
      totalWithdrawn: "Total Withdrawn",
      dailyReturn: "Daily Return",
      viewPlans: "View Plans",
    },
    plans: {
      title: "Investment Plans",
      dailyReturn: "Daily Return",
      minDeposit: "Min. Deposit",
      duration: "Duration",
      days: "days",
      activate: "Activate Plan",
      active: "Active Plan",
      chooseAmount: "Choose Deposit Amount",
      confirmActivation: "Confirm Activation",
    },
    tasks: {
      title: "Daily Tasks",
      complete: "Complete",
      completed: "Completed",
      completedAt: "Completed at",
      reward: "Reward",
      taskResets: "Tasks reset in",
      bonuses: "Catalog Bonuses",
      yourReferralLink: "Your Referral Link",
      shareLink: "Share this link to invite friends and earn bonuses.",
    },
    transactions: {
      title: "Transactions",
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      newDeposit: "New Deposit",
      newWithdrawal: "Request Withdrawal",
      amount: "Amount",
      currency: "Currency",
      walletAddress: "Your Wallet Address",
      network: "Network",
      txHash: "TX Hash",
      adminWallet: "Admin Wallet Address",
      minimumWithdrawal: "Minimum withdrawal: $60",
      history: "Transaction History",
      type: "Type",
      noTransactions: "No transactions yet",
    },
    referral: {
      title: "Referral Program",
      subtitle: "Invite friends and earn bonuses for every person who joins.",
      yourLink: "Your Referral Link",
      yourCode: "Your Code",
      linkDescription: "Share this link to invite friends. You earn a bonus each time someone registers using your link.",
      statsTitle: "Your Referral Stats",
      totalInvited: "Friends Invited",
      totalEarned: "Total Earned",
      activePlans: "With Active Plan",
      bonusTiers: "Bonus Tiers",
      tierProgress: "Progress toward each referral bonus",
      friendsTable: "Friends You Invited",
      noFriends: "You haven't invited anyone yet. Share your link to get started!",
      username: "Username",
      joinedOn: "Joined On",
      planStatus: "Plan Status",
      deposited: "Deposited",
      hasPlan: "Has Plan",
      noPlan: "No Plan",
      howItWorks: "How It Works",
      step1: "Share your unique referral link with friends",
      step2: "They register on TaskCoin using your link",
      step3: "You earn bonuses when milestones are reached",
    },
    bonuses: {
      title: "Bonuses",
      catalogTitle: "Catalog Bonuses",
      claimBonus: "Claim Bonus",
      alreadyClaimed: "Already Claimed",
      notEligible: "Not Eligible",
      rewardAmount: "Reward",
    },
    auth: {
      signIn: "Sign In",
      signUp: "Get Started",
      email: "Email",
      password: "Password",
      username: "Username",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      createOne: "Create one",
      loginTitle: "Welcome Back",
      loginSubtitle: "Sign in to manage your investments",
      registerTitle: "Create Account",
      registerSubtitle: "Join thousands of investors on TaskCoin",
    },
  },

  fr: {
    nav: {
      dashboard: "Tableau de bord",
      plans: "Plans d'investissement",
      tasks: "Tâches quotidiennes",
      transactions: "Transactions",
      referral: "Parrainages",
      overview: "Vue d'ensemble",
      manageUsers: "Gestion utilisateurs",
      bonusCatalog: "Catalogue de bonus",
      specialBonuses: "Bonus spéciaux",
      siteSettings: "Paramètres",
      loggedInAs: "Connecté en tant que",
      logout: "Se déconnecter",
    },
    common: {
      copy: "Copier",
      copied: "Copié !",
      close: "Fermer",
      save: "Enregistrer",
      cancel: "Annuler",
      confirm: "Confirmer",
      loading: "Chargement…",
      noData: "Aucune donnée disponible",
      active: "Actif",
      inactive: "Inactif",
      pending: "En attente",
      approved: "Approuvé",
      rejected: "Rejeté",
      yes: "Oui",
      no: "Non",
      balance: "Solde",
      total: "Total",
      date: "Date",
      status: "Statut",
      actions: "Actions",
      search: "Rechercher",
      of: "sur",
      earn: "Gagner",
      claim: "Réclamer",
      claimed: "Réclamé",
      eligible: "Éligible",
      progress: "Progression",
    },
    dashboard: {
      title: "Tableau de bord",
      welcome: "Bon retour",
      totalBalance: "Solde total",
      activePlan: "Plan actif",
      noPlan: "Aucun plan actif",
      totalDeposited: "Total déposé",
      totalWithdrawn: "Total retiré",
      dailyReturn: "Revenu journalier",
      viewPlans: "Voir les plans",
    },
    plans: {
      title: "Plans d'investissement",
      dailyReturn: "Revenu journalier",
      minDeposit: "Dépôt min.",
      duration: "Durée",
      days: "jours",
      activate: "Activer le plan",
      active: "Plan actif",
      chooseAmount: "Choisissez le montant",
      confirmActivation: "Confirmer l'activation",
    },
    tasks: {
      title: "Tâches quotidiennes",
      complete: "Terminer",
      completed: "Terminé",
      completedAt: "Terminé le",
      reward: "Récompense",
      taskResets: "Tâches réinitialisées dans",
      bonuses: "Bonus du catalogue",
      yourReferralLink: "Votre lien de parrainage",
      shareLink: "Partagez ce lien pour inviter des amis et gagner des bonus.",
    },
    transactions: {
      title: "Transactions",
      deposit: "Dépôt",
      withdrawal: "Retrait",
      newDeposit: "Nouveau dépôt",
      newWithdrawal: "Demander un retrait",
      amount: "Montant",
      currency: "Devise",
      walletAddress: "Votre adresse de portefeuille",
      network: "Réseau",
      txHash: "Hash TX",
      adminWallet: "Adresse portefeuille admin",
      minimumWithdrawal: "Retrait minimum : 60 $",
      history: "Historique des transactions",
      type: "Type",
      noTransactions: "Aucune transaction pour l'instant",
    },
    referral: {
      title: "Programme de parrainage",
      subtitle: "Invitez des amis et gagnez des bonus pour chaque inscription via votre lien.",
      yourLink: "Votre lien de parrainage",
      yourCode: "Votre code",
      linkDescription: "Partagez ce lien pour inviter des amis. Vous gagnez un bonus à chaque fois qu'une personne s'inscrit via votre lien.",
      statsTitle: "Vos statistiques de parrainage",
      totalInvited: "Amis invités",
      totalEarned: "Total gagné",
      activePlans: "Avec un plan actif",
      bonusTiers: "Paliers de bonus",
      tierProgress: "Progression vers chaque bonus de parrainage",
      friendsTable: "Amis que vous avez invités",
      noFriends: "Vous n'avez pas encore invité quelqu'un. Partagez votre lien pour commencer !",
      username: "Nom d'utilisateur",
      joinedOn: "Inscrit le",
      planStatus: "Plan",
      deposited: "Déposé",
      hasPlan: "A un plan",
      noPlan: "Sans plan",
      howItWorks: "Comment ça marche",
      step1: "Partagez votre lien de parrainage unique avec vos amis",
      step2: "Ils s'inscrivent sur TaskCoin via votre lien",
      step3: "Vous gagnez des bonus lorsque des paliers sont atteints",
    },
    bonuses: {
      title: "Bonus",
      catalogTitle: "Bonus du catalogue",
      claimBonus: "Réclamer le bonus",
      alreadyClaimed: "Déjà réclamé",
      notEligible: "Non éligible",
      rewardAmount: "Récompense",
    },
    auth: {
      signIn: "Se connecter",
      signUp: "Commencer",
      email: "E-mail",
      password: "Mot de passe",
      username: "Nom d'utilisateur",
      forgotPassword: "Mot de passe oublié ?",
      noAccount: "Pas encore de compte ?",
      hasAccount: "Déjà un compte ?",
      createOne: "En créer un",
      loginTitle: "Bon retour",
      loginSubtitle: "Connectez-vous pour gérer vos investissements",
      registerTitle: "Créer un compte",
      registerSubtitle: "Rejoignez des milliers d'investisseurs sur TaskCoin",
    },
  },
};

type Translations = typeof translations.en;
type DeepKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${DeepKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (section: keyof Translations, key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === "fr" || saved === "en") ? saved : "fr";
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  const t = (section: keyof Translations, key: string): string => {
    const sectionData = translations[lang][section] as Record<string, string>;
    return sectionData?.[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
