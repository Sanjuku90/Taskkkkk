import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth-wrapper";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui-core";
import {
  LayoutDashboard, CheckSquare, Crown, Wallet, LogOut, Settings,
  Users, Activity, Menu, X, Star, BookOpen, UserPlus, ChevronRight,
  Shield
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, type Lang } from "@/lib/i18n";

interface NavLink {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, href, isActive, onClick }: SidebarItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
        isActive
          ? "text-primary"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      )}>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <div className={cn(
          "relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
          isActive ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/10"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="relative z-10 font-medium text-sm">{label}</span>
        {isActive && (
          <ChevronRight className="relative z-10 w-3.5 h-3.5 ml-auto opacity-60" />
        )}
      </div>
    </Link>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; flag: string; label: string }[] = [
    { code: "fr", flag: "🇫🇷", label: "FR" },
    { code: "en", flag: "🇬🇧", label: "EN" },
  ];
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
      {langs.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            lang === code
              ? "bg-primary text-zinc-950 shadow-sm shadow-primary/30"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
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
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-amber-600/40 border border-primary/30 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary">{initials}</span>
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
    },
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userLinks: NavLink[] = [
    { icon: LayoutDashboard, label: t("nav", "dashboard"), href: "/dashboard" },
    { icon: Crown, label: t("nav", "plans"), href: "/plans" },
    { icon: CheckSquare, label: t("nav", "tasks"), href: "/tasks" },
    { icon: Wallet, label: t("nav", "transactions"), href: "/transactions" },
    { icon: UserPlus, label: t("nav", "referral"), href: "/referral" },
  ];

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <Crown className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors block leading-none">
                TaskCoin
              </span>
              {adminMode && (
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  Admin Panel
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="px-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          {adminMode ? "Administration" : "Menu"}
        </p>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <SidebarItem
            key={link.href}
            {...link}
            isActive={location === link.href}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/8 space-y-3">
        <div className="px-1">
          <LangSwitcher />
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
          <UserAvatar username={user?.username} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm truncate leading-tight">{user?.username}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>

        {isAdmin && !adminMode && (
          <Link href="/admin">
            <Button variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2">
              <Shield className="w-4 h-4" />
              Admin Panel
            </Button>
          </Link>
        )}
        {adminMode && (
          <Link href="/dashboard">
            <Button variant="outline" className="w-full gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Exit Admin
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-3"
          onClick={handleLogout}
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
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center flex-shrink-0">
            <Crown className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-white text-sm truncate block leading-tight">
              {currentPageLabel || "TaskCoin"}
            </span>
            {adminMode && (
              <span className="text-[9px] text-destructive font-bold uppercase tracking-wider leading-none">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <LangSwitcher />
          <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/10 z-50 md:hidden"
            >
              <button
                className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
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
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar — User */}
      {!adminMode && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-white/8 safe-area-bottom">
          <div className="flex items-stretch h-16">
            {userLinks.map(({ icon: Icon, label, href }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={cn(
                    "relative flex flex-col items-center justify-center h-full gap-1 transition-colors",
                    active ? "text-primary" : "text-zinc-500"
                  )}>
                    {active && (
                      <motion.div
                        layoutId="bottom-tab-bg"
                        className="absolute inset-x-1 inset-y-1.5 rounded-xl bg-primary/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className={cn("w-5 h-5 transition-transform duration-200", active && "scale-110")} />
                      <span className={cn("text-[10px] font-medium leading-none", active ? "text-primary" : "text-zinc-500")}>
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

      {/* Mobile Bottom Tab Bar — Admin */}
      {adminMode && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-destructive/20">
          <div className="flex items-stretch h-16 overflow-x-auto no-scrollbar">
            {adminLinks.map(({ icon: Icon, label, href }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} className="flex-1 min-w-[58px]">
                  <div className={cn(
                    "relative flex flex-col items-center justify-center h-full gap-1 px-1",
                    active ? "text-primary" : "text-zinc-500"
                  )}>
                    {active && (
                      <motion.div
                        layoutId="admin-tab-bg"
                        className="absolute inset-x-0.5 inset-y-1.5 rounded-xl bg-primary/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className={cn("w-4 h-4 transition-transform duration-200", active && "scale-110")} />
                      <span className={cn("text-[9px] font-medium leading-none text-center line-clamp-1", active ? "text-primary" : "text-zinc-500")}>
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="TaskCoin Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white group-hover:text-primary transition-colors">
                TaskCoin
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <LangSwitcher />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="default" size="sm">{t("nav", "dashboard")}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex" size="sm">{t("auth", "signIn")}</Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm">{t("auth", "signUp")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 pt-16 sm:pt-20 flex flex-col relative">
        <div className="absolute top-0 inset-x-0 h-[500px] overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>
        {children}
      </main>
    </div>
  );
}
