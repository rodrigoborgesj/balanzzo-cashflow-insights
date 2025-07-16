import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Visualize relatórios financeiros detalhados
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card className="bg-white border border-gray-200 rounded-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="text-lg text-gray-700">
                Página de Relatórios em desenvolvimento
              </div>
              <p className="text-sm text-gray-500">
                Em breve você poderá visualizar relatórios completos das suas transações
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}