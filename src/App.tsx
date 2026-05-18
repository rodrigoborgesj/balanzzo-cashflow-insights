import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import LandingPage from "./pages/LandingPage";
import PersonalLandingPage from "./pages/PersonalLandingPage";
import Dashboard from "./pages/Dashboard";
import Conciliacao from "./pages/Conciliacao";
import FluxoCaixa from "./pages/FluxoCaixa";
import FluxoCaixaProjetado from "./pages/FluxoCaixaProjetado";
import ContasAPagar from "./pages/ContasAPagar";
import DRE from "./pages/DRE";
import Configuracoes from "./pages/Configuracoes";
import ComoUsar from "./pages/ComoUsar";
import Suporte from "./pages/Suporte";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import PoliticaCancelamento from "./pages/PoliticaCancelamento";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ModuleSelector from "./pages/ModuleSelector";
import PersonalDashboard from "./pages/personal/PersonalDashboard";
import PersonalConciliacao from "./pages/personal/PersonalConciliacao";
import PersonalProfileSetup from "./pages/personal/PersonalProfileSetup";
import PersonalSavingsPage from "./pages/personal/PersonalSavingsPage";
import PersonalFixedExpensesPage from "./pages/personal/PersonalFixedExpensesPage";
import PersonalMovimentacoesPage from "./pages/personal/PersonalMovimentacoesPage";
import PersonalComoUsar from "./pages/personal/PersonalComoUsar";
import PersonalDebtPlanningPage from "./pages/personal/PersonalDebtPlanningPage";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import BlogArticleDebt from "./pages/BlogArticleDebt";
import BlogArticleCarnival from "./pages/BlogArticleCarnival";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60_000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => {
  // Handle visibility changes for React Query
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible - invalidating queries for fresh data');
        // Soft refetch all active queries when tab becomes visible
        queryClient.invalidateQueries();
      } else {
        console.log('Tab hidden - pausing background refetches');
        // Cancel ongoing queries when tab is hidden
        queryClient.cancelQueries();
      }
    };

    const handleFocus = () => {
      console.log('Window focused - ensuring fresh data');
      queryClient.invalidateQueries();
    };

    const handleOnline = () => {
      console.log('Connection restored - refetching data');
      queryClient.invalidateQueries();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="balanzzo-ui-theme">
        <QueryClientProvider client={queryClient}>
          <ModuleProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
          <Routes>
          {/* Public landing pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pessoal" element={<PersonalLandingPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/organizacao-financeira-2026" element={<BlogArticle />} />
          <Route path="/blog/planejamento-sair-dividas-2026" element={<BlogArticleDebt />} />
          <Route path="/blog/organizacao-financeira-pos-carnaval" element={<BlogArticleCarnival />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          
          {/* Policy pages */}
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/politica-de-cancelamento" element={<PoliticaCancelamento />} />
          
          {/* Checkout page - requires authentication */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          {/* Protected app routes - Require active subscription */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/conciliacao" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <Conciliacao />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/fluxo-caixa" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <FluxoCaixa />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/contas-a-pagar" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <ContasAPagar />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          {/* Fluxo de Caixa Projetado - Em construção */}
          {/* <Route path="/fluxo-caixa-projetado" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <FluxoCaixaProjetado />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } /> */}
          <Route path="/dre" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <DRE />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <Configuracoes />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/como-usar" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <ComoUsar />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />
          <Route path="/suporte" element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout>
                  <Suporte />
                </AppLayout>
              </SubscriptionGuard>
            </ProtectedRoute>
          } />

          {/* Module Selector - Post-login module selection */}
          <Route path="/select-module" element={
            <ProtectedRoute>
              <ModuleSelector />
            </ProtectedRoute>
          } />

          {/* Personal Finance Module Routes */}
          <Route path="/personal" element={
            <ProtectedRoute>
              <PersonalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/personal/transactions" element={
            <ProtectedRoute>
              <PersonalConciliacao />
            </ProtectedRoute>
          } />
          <Route path="/personal/setup" element={
            <ProtectedRoute>
              <PersonalProfileSetup />
            </ProtectedRoute>
          } />
          <Route path="/personal/savings" element={
            <ProtectedRoute>
              <PersonalSavingsPage />
            </ProtectedRoute>
          } />
          <Route path="/personal/fixed-expenses" element={
            <ProtectedRoute>
              <PersonalFixedExpensesPage />
            </ProtectedRoute>
          } />
          <Route path="/personal/movimentacoes" element={
            <ProtectedRoute>
              <PersonalMovimentacoesPage />
            </ProtectedRoute>
          } />
          <Route path="/personal/como-usar" element={
            <ProtectedRoute>
              <PersonalComoUsar />
            </ProtectedRoute>
          } />
          <Route path="/personal/debt-planning" element={
            <ProtectedRoute>
              <PersonalDebtPlanningPage />
            </ProtectedRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
            </TooltipProvider>
          </ModuleProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
