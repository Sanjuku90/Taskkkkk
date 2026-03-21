import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth-wrapper";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui-core";
import { LayoutDashboard, CheckSquare, Crown, Wallet, LogOut, Settings, Users, Activity, Menu, X, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
        isActive 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
      )}>
        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export function AppLayout({ children, adminMode = false }: { children: React.ReactNode, adminMode?: boolean }) {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Crown, label: "Investment Plans", href: "/plans" },
    { icon: CheckSquare, label: "Daily Tasks", href: "/tasks" },
    { icon: Wallet, label: "Transactions", href: "/transactions" },
  ];

  const adminLinks = [
    { icon: Activity, label: "Overview", href: "/admin" },
    { icon: Users, label: "Manage Users", href: "/admin/users" },
    { icon: Wallet, label: "Transactions", href: "/admin/transactions" },
    { icon: Star, label: "Bonus Tasks", href: "/admin/bonus-tasks" },
    { icon: Settings, label: "Site Settings", href: "/admin/settings" },
  ];

  const links = adminMode ? adminLinks : userLinks;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <Crown className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-primary transition-colors">
              TaskCoin
              {adminMode && <span className="text-xs ml-2 text-destructive align-top">ADMIN</span>}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => (
          <SidebarItem 
            key={link.href} 
            {...link} 
            isActive={location === link.href} 
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="mb-4 px-4">
          <p className="text-sm text-zinc-400">Logged in as</p>
          <p className="font-medium text-white truncate">{user?.username}</p>
        </div>
        
        {isAdmin && !adminMode && (
          <Link href="/admin">
            <Button variant="outline" className="w-full mb-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              Admin Panel
            </Button>
          </Link>
        )}
        {adminMode && (
          <Link href="/dashboard">
            <Button variant="outline" className="w-full mb-3">
              Exit Admin
            </Button>
          </Link>
        )}

        <Button 
          variant="ghost" 
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5" 
          onClick={handleLogout}
          isLoading={logoutMutation.isPending}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 border-r border-white/5 bg-card/30 backdrop-blur-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="font-display font-bold text-xl text-white">TaskCoin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-white/10 z-50 md:hidden"
            >
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen pt-16 md:pt-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="TaskCoin Logo" className="w-10 h-10 object-contain" />
              <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-primary transition-colors">
                TaskCoin
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="default">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="default">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 pt-20 flex flex-col relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 inset-x-0 h-[500px] overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>
        {children}
      </main>
    </div>
  );
}
