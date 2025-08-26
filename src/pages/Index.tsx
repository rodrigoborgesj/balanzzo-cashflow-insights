import { CreatePlansButton } from "@/components/CreatePlansButton";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">BALANZZO - Configuração</h1>
          <p className="text-xl text-muted-foreground">Configure os planos do Pagar.me</p>
        </div>
        
        <CreatePlansButton />
      </div>
    </div>
  );
};

export default Index;
