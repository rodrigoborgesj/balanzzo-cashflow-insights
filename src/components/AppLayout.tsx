import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Footer } from "@/components/Footer";
import { TrialBanner } from "@/components/TrialBanner";
import { PaymentSelection } from "@/components/PaymentSelection";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleUpgrade = () => {
    setShowPayment(true);
  };

  if (showPayment) {
    return <PaymentSelection onBack={() => setShowPayment(false)} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-12 md:h-14 flex items-center border-b border-border bg-background px-3 md:px-4">
            <SidebarTrigger className="text-foreground hover:bg-muted mr-2 md:mr-0" />
          </header>
          
          {/* Trial Banner */}
          <div className="px-3 md:px-6 pt-4">
            <TrialBanner onUpgrade={handleUpgrade} />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto px-3 md:px-0">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}