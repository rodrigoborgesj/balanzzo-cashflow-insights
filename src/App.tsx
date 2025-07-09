import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FluxoCaixa from "./pages/FluxoCaixa";
import Receitas from "./pages/Receitas";
import DRE from "./pages/DRE";
import ContasPagar from "./pages/ContasPagar";
import Relatorios from "./pages/Relatorios";
import IntegracaoBancaria from "./pages/IntegracaoBancaria";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/dre" element={<DRE />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/integracao" element={<IntegracaoBancaria />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
