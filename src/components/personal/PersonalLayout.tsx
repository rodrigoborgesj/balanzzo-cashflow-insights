import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PersonalSidebar } from "@/components/personal/PersonalSidebar";
import { Footer } from "@/components/Footer";

interface PersonalLayoutProps {
  children: React.ReactNode;
}

export function PersonalLayout({ children }: PersonalLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PersonalSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-12 md:h-14 flex items-center border-b border-border bg-background px-3 md:px-4">
            <SidebarTrigger className="text-foreground hover:bg-muted mr-2 md:mr-0" />
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
