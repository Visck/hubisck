import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import SmartLinkWizard from "@/pages/SmartLinkWizard";
import StandardPageEditor from "@/pages/StandardPageEditor";
import PublicLinkPage from "@/pages/PublicLinkPage";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  if (!user || !user.email_confirmed_at) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, loading } = useAuth();
  const isAuthenticated = user && user.email_confirmed_at;

  return (
    <Switch>
      {/* Login page */}
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {/* Signup page */}
      <Route path="/signup">
        {isAuthenticated ? <Dashboard /> : <Signup />}
      </Route>
      
      {/* Smart Link Wizard for musician mode */}
      <Route path="/create-smart-link">
        <ProtectedRoute>
          <SmartLinkWizard />
        </ProtectedRoute>
      </Route>
      
      {/* Edit Smart Link page */}
      <Route path="/smart-link/edit/:id">
        {(params) => (
          <ProtectedRoute>
            <SmartLinkWizard editPageId={params.id} />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Edit Standard page */}
      <Route path="/page/edit/:id">
        {(params) => (
          <ProtectedRoute>
            <StandardPageEditor editPageId={params.id} />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Dashboard route */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Public link pages */}
      <Route path="/:slug">
        {(params) => {
          const systemRoutes = ['api', 'login', 'logout', 'callback', 'dashboard', 'create-smart-link', 'smart-link', 'page', 'signup'];
          if (systemRoutes.some(r => params.slug?.startsWith(r))) {
            return <NotFound />;
          }
          return <PublicLinkPage />;
        }}
      </Route>
      
      {/* Main route - show dashboard if authenticated, landing if not */}
      <Route path="/">
        {loading ? null : (isAuthenticated ? <Dashboard /> : <LandingPage />)}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
