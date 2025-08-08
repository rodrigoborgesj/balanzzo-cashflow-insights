import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Conciliacao from "./pages/Conciliacao";
import FluxoCaixa from "./pages/FluxoCaixa";
import DRE from "./pages/DRE";
import Configuracoes from "./pages/Configuracoes";
import ComoUsar from "./pages/ComoUsar";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/" element={
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
