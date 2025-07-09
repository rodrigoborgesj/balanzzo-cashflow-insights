import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Settings, 
  Mail,
  Shield,
  User
} from "lucide-react";

const usuarios = [
  { 
    id: 1, 
    nome: "João Silva", 
    email: "joao@empresa.com", 
    role: "Administrador", 
    status: "ativo",
    ultimo_acesso: "2024-06-29 14:30"
  },
  { 
    id: 2, 
    nome: "Maria Santos", 
    email: "maria@empresa.com", 
    role: "Analista Financeiro", 
    status: "ativo",
    ultimo_acesso: "2024-06-29 12:15"
  },
  { 
    id: 3, 
    nome: "Pedro Costa", 
    email: "pedro@empresa.com", 
    role: "Contador", 
    status: "inativo",
    ultimo_acesso: "2024-06-25 16:45"
  }
];

export default function Usuarios() {
  const usuariosAtivos = usuarios.filter(u => u.status === "ativo").length;
  const totalUsuarios = usuarios.length;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrador": return "text-primary bg-primary/10";
      case "Analista Financeiro": return "text-success bg-success/10";
      case "Contador": return "text-accent bg-accent/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "ativo" ? "text-success" : "text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Total de Usuários</h3>
                <p className="text-2xl font-bold text-primary">{totalUsuarios}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Usuários Ativos</h3>
                <p className="text-2xl font-bold text-success">{usuariosAtivos}</p>
              </div>
              <User className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Permissões</h3>
                <p className="text-2xl font-bold text-accent">3</p>
              </div>
              <Shield className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuários List */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usuarios.map((usuario) => (
              <div 
                key={usuario.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {usuario.nome.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{usuario.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{usuario.email}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(usuario.role)}`}>
                        {usuario.role}
                      </span>
                      <span className={`text-xs font-medium ${getStatusColor(usuario.status)}`}>
                        {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Último acesso: {new Date(usuario.ultimo_acesso).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}