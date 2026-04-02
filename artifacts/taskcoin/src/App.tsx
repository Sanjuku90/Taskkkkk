import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import { Login, Register } from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Plans from "@/pages/plans";
import Tasks from "@/pages/tasks";
import Transactions from "@/pages/transactions";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminTransactions from "@/pages/admin/transactions";
import AdminSettings from "@/pages/admin/settings";
import AdminBonusTasks from "@/pages/admin/bonus-tasks";
import AdminBonusCatalog from "@/pages/admin/bonus-catalog";
import Referral from "@/pages/referral";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/plans" component={Plans} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/referral" component={Referral} />
      
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/bonus-tasks" component={AdminBonusTasks} />
      <Route path="/admin/bonus-catalog" component={AdminBonusCatalog} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
