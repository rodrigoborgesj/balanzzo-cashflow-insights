import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Conciliacao from "./pages/Conciliacao";
import FluxoCaixa from "./pages/FluxoCaixa";
import FluxoCaixaProjetado from "./pages/FluxoCaixaProjetado";
import DRE from "./pages/DRE";
import Configuracoes from "./pages/Configuracoes";
import ComoUsar from "./pages/ComoUsar";
import Suporte from "./pages/Suporte";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import PoliticaCancelamento from "./pages/PoliticaCancelamento";
import NotFound from "./pages/NotFound";


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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          
          {/* Policy pages */}
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/politica-de-cancelamento" element={<PoliticaCancelamento />} />
          
          {/* Protected app routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/conciliacao" element={
            <ProtectedRoute>
              <AppLayout>
                <Conciliacao />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fluxo-caixa" element={
            <ProtectedRoute>
              <AppLayout>
                <FluxoCaixa />
              </AppLayout>
            </ProtectedRoute>
          } />
          {/* Fluxo de Caixa Projetado - Em construção */}
          {/* <Route path="/fluxo-caixa-projetado" element={
            <ProtectedRoute>
              <AppLayout>
                <FluxoCaixaProjetado />
              </AppLayout>
            </ProtectedRoute>
          } /> */}
          <Route path="/dre" element={
            <ProtectedRoute>
              <AppLayout>
                <DRE />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <AppLayout>
                <Configuracoes />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/como-usar" element={
            <ProtectedRoute>
              <AppLayout>
                <ComoUsar />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/suporte" element={
            <ProtectedRoute>
              <AppLayout>
                <Suporte />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
