import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth-wrapper";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "./ui-core";
import {
  LayoutDashboard, CheckSquare, Crown, Wallet, LogOut, Settings,
  Users, Activity, Menu, X, Star, BookOpen, UserPlus, ChevronRight,
  Shield, Globe, Gamepad2, User, Megaphone, XCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, type Lang } from "@/lib/i18n";

function useAnnouncement() {
  return useQuery<{ announcementEnabled: boolean; announcement: string }>({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return { announcementEnabled: false, announcement: "" };
      return res.json();
    },
    staleTime: 60_000,
  });
}

interface NavLink { icon: React.ElementType; label: string; href: string; }

function SidebarItem({ icon: Icon, label, href, isActive, onClick }: {
  icon: React.ElementType; label: string; href: string; isActive: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
        isActive ? "text-amber-400" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
      )}>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/20 rounded-xl"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <div className={cn(
          "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
          isActive
            ? "bg-amber-500/20 shadow-inner shadow-amber-500/10"
            : "bg-white/5 group-hover:bg-white/8"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="relative z-10 font-medium text-sm">{label}</span>
        {isActive && (
          <ChevronRight className="relative z-10 w-3 h-3 ml-auto opacity-50" />
        )}
      </div>
    </Link>
  );
}

function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; flag: string; label: string }[] = [
    { code: "fr", flag: "🇫🇷", label: "FR" },
    { code: "en", flag: "🇬🇧", label: "EN" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-1 border border-white/8">
        {langs.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
              lang === code
                ? "bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40"
                : "text-slate-500 hover:text-white hover:bg-white/6"
            )}
          >
            <span>{flag}</span>
            {!compact && <span>{label}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
      {langs.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            lang === code
              ? "bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40"
              : "text-slate-500 hover:text-white hover:bg-white/6"
          )}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function UserAvatar({ username }: { username?: string }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "?";
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 to-cyan-500/20 border border-amber-500/25 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-amber-400">{initials}</span>
    </div>
  );
}

export function AppLayout({ children, adminMode = false }: { children: React.ReactNode; adminMode?: boolean }) {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); },
    },
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const { lang } = useI18n();
  const { data: announcementData } = useAnnouncement();

  const showAnnouncement = !adminMode && !announcementDismissed
    && announcementData?.announcementEnabled
    && !!announcementData?.announcement;

  const userLinks: NavLink[] = [
    { icon: LayoutDashboard, label: t("nav", "dashboard"), href: "/dashboard" },
    { icon: Crown, label: t("nav", "plans"), href: "/plans" },
    { icon: CheckSquare, label: t("nav", "tasks"), href: "/tasks" },
    { icon: Wallet, label: t("nav", "transactions"), href: "/transactions" },
    { icon: UserPlus, label: t("nav", "referral"), href: "/referral" },
    { icon: Gamepad2, label: lang === "fr" ? "Jeux" : "Games", href: "/games" },
  ];

  const bottomNavLabels: Record<string, string> = {
    "/dashboard": lang === "fr" ? "Accueil" : "Home",
    "/plans": "Plans",
    "/tasks": lang === "fr" ? "Tâches" : "Tasks",
    "/transactions": lang === "fr" ? "Wallet" : "Wallet",
    "/referral": lang === "fr" ? "Parrainage" : "Referral",
    "/games": lang === "fr" ? "Jeux" : "Games",
  };

  const adminLinks: NavLink[] = [
    { icon: Activity, label: t("nav", "overview"), href: "/admin" },
    { icon: Users, label: t("nav", "manageUsers"), href: "/admin/users" },
    { icon: Wallet, label: t("nav", "transactions"), href: "/admin/transactions" },
    { icon: BookOpen, label: t("nav", "bonusCatalog"), href: "/admin/bonus-catalog" },
    { icon: Star, label: t("nav", "specialBonuses"), href: "/admin/bonus-tasks" },
    { icon: Settings, label: t("nav", "siteSettings"), href: "/admin/settings" },
  ];

  const links = adminMode ? adminLinks : userLinks;
  const currentPage = links.find((l) => l.href === location);
  const currentPageLabel = currentPage?.label ?? "TaskCoin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all shrink-0">
              <Crown className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors block leading-none">
                TaskCoin
              </span>
              {adminMode && (
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Admin Panel</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          {adminMode ? "Administration" : "Navigation"}
        </p>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <SidebarItem
            key={link.href}
            {...link}
            isActive={location === link.href}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-white/6 space-y-3">
        <div className="px-1">
          <LangSwitcher />
        </div>

        {/* User card → links to profile (user mode only) */}
        {!adminMode ? (
          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-amber-500/20 transition-all cursor-pointer group">
              <UserAvatar username={user?.username} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm truncate leading-tight group-hover:text-amber-400 transition-colors">{user?.username}</p>
                <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
              </div>
              <User className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
            <UserAvatar username={user?.username} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate leading-tight">{user?.username}</p>
              <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        {isAdmin && !adminMode && (
          <Link href="/admin">
            <Button variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-xs h-9">
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </Button>
          </Link>
        )}
        {adminMode && (
          <Link href="/dashboard">
            <Button variant="glass" className="w-full gap-2 text-xs h-9">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Exit Admin
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-rose-400 hover:bg-rose-500/8 gap-3 text-sm"
          onClick={() => logoutMutation.mutate()}
          isLoading={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4" />
          {t("nav", "logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-20"
        style={{
          background: "linear-gradient(180deg, hsl(220, 45%, 6%) 0%, hsl(222, 47%, 5%) 100%)",
          borderRight: "1px solid hsl(220, 40%, 14%)"
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4"
        style={{
          background: "hsl(220, 45%, 6% / 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid hsl(220, 40%, 14%)"
        }}
      >
        {/* Left: Logo + Page title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
            <Crown className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-white text-sm truncate block leading-tight">
              {currentPageLabel || "TaskCoin"}
            </span>
            {adminMode && (
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider leading-none">Admin</span>
            )}
          </div>
        </div>

        {/* Right: Avatar + Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <UserAvatar username={user?.username} />
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-72 z-50 md:hidden"
              style={{
                background: "linear-gradient(180deg, hsl(220, 45%, 7%) 0%, hsl(222, 47%, 5%) 100%)",
                borderLeft: "1px solid hsl(220, 40%, 14%)"
              }}
            >
              <button
                className="absolute top-4 left-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pt-14 md:pt-0">
        {/* Announcement Banner */}
        <AnimatePresence>
          {showAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative mx-4 mt-4 md:mx-8 md:mt-6 rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(38, 92%, 50%, 0.15) 0%, hsl(45, 100%, 60%, 0.08) 100%)",
                border: "1px solid hsl(38, 92%, 50%, 0.3)",
              }}
            >
              <div className="flex items-start gap-3 p-4 pr-12">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-amber-100 leading-relaxed flex-1">{announcementData?.announcement}</p>
              </div>
              <button
                onClick={() => setAnnouncementDismissed(true)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 p-4 md:p-8 pb-28 md:pb-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav — User */}
      {!adminMode && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{
            background: "hsl(220, 45%, 5% / 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid hsl(220, 40%, 13%)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}
        >
          <div className="flex items-stretch h-16 overflow-x-auto no-scrollbar">
            {userLinks.map(({ icon: Icon, href }) => {
              const active = location === href;
              const shortLabel = bottomNavLabels[href] ?? href;
              return (
                <Link key={href} href={href} className="flex-1 min-w-[52px]">
                  <div className={cn(
                    "relative flex flex-col items-center justify-center h-full gap-1 transition-colors active:scale-95",
                    active ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                  )}>
                    {active && (
                      <motion.div
                        layoutId="bottom-tab-bg"
                        className="absolute inset-x-1 inset-y-1 rounded-xl bg-amber-500/10 border border-amber-500/15"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className={cn(
                        "transition-all duration-200",
                        active ? "w-5 h-5 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "w-5 h-5"
                      )} />
                      <span className={cn(
                        "text-[10px] font-semibold leading-none tracking-tight",
                        active ? "text-amber-400" : "text-slate-600"
                      )}>
                        {shortLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile Bottom Nav — Admin */}
      {adminMode && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{
            background: "hsl(220, 45%, 5% / 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid hsl(350, 60%, 20%)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}
        >
          <div className="flex items-stretch h-16 overflow-x-auto no-scrollbar">
            {adminLinks.map(({ icon: Icon, label, href }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} className="flex-1 min-w-[56px]">
                  <div className={cn(
                    "relative flex flex-col items-center justify-center h-full gap-1 px-1 transition-colors active:scale-95",
                    active ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                  )}>
                    {active && (
                      <motion.div
                        layoutId="admin-tab-bg"
                        className="absolute inset-x-0.5 inset-y-1 rounded-xl bg-amber-500/10 border border-amber-500/15"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className={cn(
                        "transition-all duration-200",
                        active ? "w-4 h-4 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "w-4 h-4"
                      )} />
                      <span className={cn(
                        "text-[9px] font-semibold leading-none text-center line-clamp-1",
                        active ? "text-amber-400" : "text-slate-600"
                      )}>
                        {label}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "hsl(222, 47%, 5%, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid hsl(220, 40%, 12%)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
                <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-950" />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
                TaskCoin
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <LangSwitcher />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm">{t("nav", "dashboard")}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-400 hover:text-white" size="sm">
                    {t("auth", "signIn")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t("auth", "signUp")}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-1.5">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="text-xs px-3 h-8">{t("nav", "dashboard")}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs px-2.5 h-8 text-slate-400 hover:text-white">
                    {t("auth", "signIn")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs px-3 h-8">{t("auth", "signUp")}</Button>
                </Link>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Langue"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile language dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-white/6 overflow-hidden"
              style={{ background: "hsl(222, 47%, 5%, 0.98)" }}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Langue :</span>
                <LangSwitcher />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-16 flex flex-col">
        {children}
      </main>
    </div>
  );
}
