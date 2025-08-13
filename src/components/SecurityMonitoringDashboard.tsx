import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { useAuth } from "@/hooks/useAuth";
import { Shield, AlertTriangle, Eye, Clock, User, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access';
  timestamp: Date;
  details: Record<string, any>;
}

export function SecurityMonitoringDashboard() {
  const { user } = useAuth();
  const { securityEvents, loginAttempts, isRateLimited } = useSecurityMonitoring();
  const [showDetails, setShowDetails] = useState(false);

  if (!user) {
    return null;
  }

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt':
        return <User className="h-4 w-4 text-green-500" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'suspicious_activity':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'data_access':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadgeVariant = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt':
        return 'default';
      case 'failed_login':
        return 'destructive';
      case 'suspicious_activity':
        return 'secondary';
      case 'data_access':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEventTitle = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt':
        return 'Login Realizado';
      case 'failed_login':
        return 'Falha no Login';
      case 'suspicious_activity':
        return 'Atividade Suspeita';
      case 'data_access':
        return 'Acesso aos Dados';
      default:
        return 'Evento de Segurança';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas de Login</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 15 minutos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status de Segurança</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {isRateLimited() ? (
                <>
                  <Badge variant="destructive">Bloqueado</Badge>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </>
              ) : (
                <>
                  <Badge variant="default">Normal</Badge>
                  <Shield className="h-4 w-4 text-green-500" />
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRateLimited() ? 'Taxa de limite atingida' : 'Operação normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Recentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Última sessão
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Log de Segurança</CardTitle>
              <CardDescription>
                Monitoramento em tempo real de eventos de segurança
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum evento de segurança registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityEvents.slice().reverse().map((event, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-foreground">
                          {getEventTitle(event.type)}
                        </p>
                        <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(event.timestamp, 'HH:mm:ss', { locale: ptBR })}
                      </div>
                    </div>
                    {showDetails && Object.keys(event.details).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <pre className="whitespace-pre-wrap font-mono">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}