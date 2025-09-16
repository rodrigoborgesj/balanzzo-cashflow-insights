const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Balanzzo</h1>
          <p className="text-xl text-muted-foreground">
            Sistema de Gestão Financeira
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-lg border">
          <h2 className="text-2xl font-semibold mb-4">
            Bem-vindo à plataforma Balanzzo
          </h2>
          <p className="text-muted-foreground mb-6">
            Gerencie suas finanças de forma inteligente com nossa plataforma completa 
            de controle financeiro empresarial.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-muted/30 rounded">
                <h3 className="font-semibold">DRE Automatizado</h3>
                <p className="text-muted-foreground">Relatórios automáticos</p>
              </div>
              <div className="p-4 bg-muted/30 rounded">
                <h3 className="font-semibold">Fluxo de Caixa</h3>
                <p className="text-muted-foreground">Controle em tempo real</p>
              </div>
              <div className="p-4 bg-muted/30 rounded">
                <h3 className="font-semibold">Conciliação</h3>
                <p className="text-muted-foreground">Bancária automatizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
