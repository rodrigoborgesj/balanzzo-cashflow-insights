import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Holdings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Holdings</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus holdings e investimentos
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card className="bg-white border border-gray-200 rounded-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="text-lg text-gray-700">
                Página de Holdings em desenvolvimento
              </div>
              <p className="text-sm text-gray-500">
                Em breve você poderá gerenciar seus holdings e investimentos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}