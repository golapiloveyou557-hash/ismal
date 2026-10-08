import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminPosts from "./pages/AdminPosts";
import AdminDeposits from "./pages/AdminDeposits";
import Deposit from "./pages/Deposit";
import AuthPage from "./pages/AuthPage";
import MemberPortal from "./pages/MemberPortal";
import AdminControlCenter from "./pages/AdminControlCenter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/deposits" component={AdminDeposits} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/member" component={MemberPortal} />
      <Route path="/admin" component={AdminControlCenter} />
      <Route path="/login">
        <AuthPage mode="login" />
      </Route>
      <Route path="/signup">
        <AuthPage mode="signup" />
      </Route>
      <Route path="/forgot-password">
        <AuthPage mode="forgot" />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
