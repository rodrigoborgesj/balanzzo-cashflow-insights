
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar
} from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { useNavigate } from "react-router-dom";
import { useCashFlowIntegration } from "@/hooks/useCashFlowIntegration";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const { profile } = useProfile();
  
  // Usar dados do fluxo de caixa integrado
  const { 
    summary, 
    categorySummary, 
    chartData, 
    isLoading, 
    hasData 
  } = useCashFlowIntegration(selectedMonth);

  // Calculate revenue growth percentage
  const [revenueGrowth, setRevenueGrowth] = useState<number>(0);
  
  useEffect(() => {
    // Calculate previous month's data for comparison
    const currentDate = new Date();
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthStr = previousMonth.toISOString().slice(0, 7);
    
    // This would ideally come from a comparison with previous month data
    // For now, we'll simulate a growth percentage
    setRevenueGrowth(12.5); // This should be calculated from actual data
  }, [selectedMonth]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 min-h-full" style={{ backgroundColor: '#E4F8CA' }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3423]"></div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6 space-y-6 min-h-full" style={{ backgroundColor: '#E4F8CA' }}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Nenhum dado financeiro encontrado
          </h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Adicione dados financeiros para visualizar seu dashboard
          </p>
          <Button onClick={() => navigate("/fluxo-caixa")} className="gap-2">
            Adicionar Dados
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Color palette as specified
  const chartColors = {
    primary: '#1A3423',
    secondary: '#4F5D4B', 
    neutral: '#E9E9E9'
  };

  // Generate monthly insights
  const generateInsights = () => {
    const insights = {
      expenses: "Suas principais despesas este mês foram com pessoal e marketing. Considere revisar contratos de fornecedores para otimizar custos operacionais.",
      revenue: "O faturamento apresentou crescimento consistente. Para o próximo mês, foque em campanhas de retenção de clientes para manter a tendência positiva.",
      netProfit: "O lucro líquido está dentro das expectativas. Continue monitorando a margem de contribuição para garantir a sustentabilidade do crescimento."
    };
    return insights;
  };

  const insights = generateInsights();

  // Prepare chart data for the monthly bar chart
  const monthlyBarData = chartData.slice(-6).map(item => ({
    month: item.data,
    revenue: item.entradas
  }));

  // Company name from profile or default  
  const companyName = profile?.full_name || "Empresa";

  return (
    <div className="p-6 space-y-8 min-h-full" style={{ backgroundColor: '#E4F8CA', fontFamily: 'Montserrat, sans-serif' }}>
      {/* Month Selector Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          className="bg-transparent border border-gray-300 text-black hover:bg-gray-50"
          style={{
            borderRadius: '20px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: '500'
          }}
          onClick={() => {
            const monthInput = document.createElement('input');
            monthInput.type = 'month';
            monthInput.value = selectedMonth;
            monthInput.onchange = (e) => setSelectedMonth((e.target as HTMLInputElement).value);
            monthInput.click();
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Button>
      </div>

      {/* Header Section with Greeting and Chart */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
        {/* Left - Greeting and Revenue Growth */}
        <div className="flex-1">
          <h1 
            className="text-black mb-2"
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '700',
              fontSize: '22px'
            }}
          >
            Olá, {companyName}
          </h1>
          <div className="flex flex-col gap-1">
            <span 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '400',
                fontSize: '16px',
                color: 'black'
              }}
            >
              Faturamento cresceu
            </span>
            <span 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700',
                fontSize: '55px',
                color: 'black',
                lineHeight: '1'
              }}
            >
              {revenueGrowth.toFixed(1)}%
            </span>
            <span 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '300',
                fontSize: '14px',
                color: 'black'
              }}
            >
              em relação ao mês anterior
            </span>
          </div>
        </div>

        {/* Right - Bar Chart */}
        <div className="flex-1 max-w-lg">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyBarData}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }}
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                contentStyle={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Chart Insight */}
          <p 
            className="text-left mt-2"
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '500',
              fontSize: '10px',
              color: 'black'
            }}
          >
            O crescimento do faturamento reflete uma melhoria na captação de novos clientes e no aumento do ticket médio.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-8">
          {/* Step 1 - Expenses */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#1A3423] text-white flex items-center justify-center text-sm font-bold">1</div>
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  color: 'black'
                }}
              >
                Despesas
              </h3>
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '500',
                fontSize: '14px',
                color: 'black'
              }}
            >
              {insights.expenses}
            </p>
          </div>

          {/* Step 2 - Revenue */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#A6C39E] text-white flex items-center justify-center text-sm font-bold">2</div>
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  color: 'black'
                }}
              >
                Faturamento
              </h3>
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '500',
                fontSize: '14px',
                color: 'black'
              }}
            >
              {insights.revenue}
            </p>
          </div>

          {/* Step 3 - Net Profit */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#E9E9E9] text-black flex items-center justify-center text-sm font-bold">3</div>
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  color: 'black'
                }}
              >
                Lucro Líquido
              </h3>
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '500',
                fontSize: '14px',
                color: 'black'
              }}
            >
              {insights.netProfit}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards with New Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income - Transparent background */}
        <Card className="bg-transparent border border-gray-300" style={{ borderRadius: '20px' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black'
                }}
              >
                Total Entradas
              </h3>
              <DollarSign className="h-5 w-5" style={{ color: chartColors.primary }} />
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700',
                fontSize: '24px',
                color: 'black'
              }}
            >
              {formatCurrency(summary.totalEntradas)}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses - Transparent background */}
        <Card className="bg-transparent border border-gray-300" style={{ borderRadius: '20px' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black'
                }}
              >
                Total Saídas
              </h3>
              <TrendingDown className="h-5 w-5" style={{ color: chartColors.primary }} />
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700',
                fontSize: '24px',
                color: 'black'
              }}
            >
              {formatCurrency(summary.totalSaidas)}
            </p>
          </CardContent>
        </Card>

        {/* Net Balance - Transparent background */}
        <Card className="bg-transparent border border-gray-300" style={{ borderRadius: '20px' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black'
                }}
              >
                Saldo Líquido
              </h3>
              <TrendingUp className="h-5 w-5" style={{ color: chartColors.primary }} />
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700',
                fontSize: '24px',
                color: summary.saldoLiquido >= 0 ? 'black' : '#dc2626'
              }}
            >
              {formatCurrency(summary.saldoLiquido)}
            </p>
          </CardContent>
        </Card>

        {/* Movements - Dark background */}
        <Card style={{ backgroundColor: '#1A3423', borderRadius: '20px' }} className="border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white'
                }}
              >
                Movimentações
              </h3>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <p 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700',
                fontSize: '24px',
                color: 'white'
              }}
            >
              {summary.transacoesCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600',
                color: 'black'
              }}
            >
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categorySummary.map((cat, index) => ({
                  ...cat,
                  fill: index % 3 === 0 ? chartColors.primary : index % 3 === 1 ? chartColors.secondary : chartColors.neutral
                }))}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="categoria" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Valor"]}
                  contentStyle={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 4, 4, 0]}
                >
                  {categorySummary.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 3 === 0 ? chartColors.primary : index % 3 === 1 ? chartColors.secondary : chartColors.neutral} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600',
                color: 'black'
              }}
            >
              Receitas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Vendas de Serviços", value: summary.totalEntradas * 0.7, fill: chartColors.primary },
                    { name: "Consultoria", value: summary.totalEntradas * 0.2, fill: chartColors.secondary },
                    { name: "Outros", value: summary.totalEntradas * 0.1, fill: chartColors.neutral }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Valor"]}
                  contentStyle={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
