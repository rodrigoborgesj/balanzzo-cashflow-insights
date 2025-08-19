import { Link } from "react-router-dom";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`bg-card border-t border-border py-6 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2025 Balanzzo. Todos os direitos reservados.
          </div>
          
          <div className="flex space-x-4 text-sm">
            <Link 
              to="/politica-de-privacidade" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link 
              to="/politica-de-cancelamento" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Política de Cancelamento
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}