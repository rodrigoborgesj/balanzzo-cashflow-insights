import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDashboard } from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  // Use the dedicated dashboard hook for comprehensive month-based data
  const { 
    selectedMonth,
    setSelectedMonth,
    isLoading, 
    hasData,
    currentMonthData,
    expenseChartData,
    incomeChartData,
    monthlyChartData,
    kpiData,
    formatCurrency
  } = useDashboard();

  // Generate months for dropdown
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(currentYear, i, 1);
    const monthValue = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    return {
      value: monthValue,
      label: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  });

  // Month Selector Component
  const MonthSelector = () => (
    <div className="flex justify-end mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-transparent border border-gray-300 text-black hover:bg-gray-50"
            style={{
              borderRadius: '20px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '500'
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white border border-gray-300 shadow-lg rounded-lg z-50"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {months.map((month) => (
            <DropdownMenuItem
              key={month.value}
              onClick={() => setSelectedMonth(month.value)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                selectedMonth === month.value ? 'bg-gray-100 font-semibold' : ''
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {month.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 min-h-full" style={{ backgroundColor: '#E4F8CA' }}>
        <MonthSelector />
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3423]"></div>
        </div>
      </div>
    );
  }

  // Check if current selected month has data
  const currentMonthHasData = kpiData.totalEntradas > 0 || kpiData.totalSaidas > 0;
  
  // Year overview data for when no month data exists
  const yearOverviewData = monthlyChartData.map(item => ({
    month: item.mes,
    revenue: item.entradas,
    expenses: item.saidas
  }));

  if (!hasData) {
    return (
      <div className="p-6 space-y-6 min-h-full" style={{ backgroundColor: '#E4F8CA' }}>
        <MonthSelector />
        
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

  // Prepare chart data for the monthly bar chart from useDashboard hook
  const monthlyBarData = monthlyChartData.slice(-6).map(item => ({
    month: item.mes,
    revenue: item.entradas
  }));

  // Company name from profile or default  
  const companyName = profile?.full_name || "Empresa";

  // If selected month has no data, show year overview
  if (!currentMonthHasData && hasData) {
    return (
      <div className="p-6 space-y-8 min-h-full" style={{ backgroundColor: '#E4F8CA', fontFamily: 'Montserrat, sans-serif' }}>
        <MonthSelector />

        {/* No Data Message */}
        <div className="text-center mb-8">
          <p 
            className="text-gray-600"
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '500',
              fontSize: '16px'
            }}
          >
            Nenhum dado financeiro disponível para {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}. Exibindo visão geral do ano para contexto.
          </p>
        </div>

        {/* Year Overview Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600',
                color: 'black'
              }}
            >
              Visão Geral do Ano - Receitas e Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={yearOverviewData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '10px' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '10px' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'revenue' ? 'Receitas' : 'Despesas'
                  ]}
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
                  name="revenue"
                />
                <Bar 
                  dataKey="expenses" 
                  fill={chartColors.secondary}
                  radius={[4, 4, 0, 0]}
                  name="expenses"
                />
                <Legend 
                  wrapperStyle={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '10px',
                    paddingTop: '10px'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Cards for Year Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Total Receitas (Ano)
                </h3>
                <TrendingUp className="h-5 w-5" style={{ color: chartColors.primary }} />
              </div>
              <p 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '700',
                  fontSize: '24px',
                  color: 'black'
                }}
              >
                {formatCurrency(yearOverviewData.reduce((sum, item) => sum + item.revenue, 0))}
              </p>
            </CardContent>
          </Card>

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
                  Total Despesas (Ano)
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
                {formatCurrency(yearOverviewData.reduce((sum, item) => sum + item.expenses, 0))}
              </p>
            </CardContent>
          </Card>

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
                  Saldo Líquido (Ano)
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
                {formatCurrency(
                  yearOverviewData.reduce((sum, item) => sum + item.revenue, 0) - 
                  yearOverviewData.reduce((sum, item) => sum + item.expenses, 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-full" style={{ backgroundColor: '#E4F8CA', fontFamily: 'Montserrat, sans-serif' }}>
      <MonthSelector />

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
              {kpiData.variacaoEntradas.toFixed(1)}%
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
              {formatCurrency(kpiData.totalEntradas)}
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
              {formatCurrency(kpiData.totalSaidas)}
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
                color: kpiData.saldoLiquido >= 0 ? 'black' : '#dc2626'
              }}
            >
              {formatCurrency(kpiData.saldoLiquido)}
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
              {('dados_brutos' in currentMonthData && currentMonthData.dados_brutos ? currentMonthData.dados_brutos.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown - Top 5 Categories */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600',
                color: 'black'
              }}
            >
              Top 5 Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={expenseChartData
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((cat, index) => ({
                    categoria: cat.name,
                    valor: cat.value,
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
                  {expenseChartData.slice(0, 5).map((entry, index) => (
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
                  data={incomeChartData.length > 0 ? incomeChartData : [
                    { name: "Vendas de Serviços", value: kpiData.totalEntradas * 0.7, fill: chartColors.primary },
                    { name: "Consultoria", value: kpiData.totalEntradas * 0.2, fill: chartColors.secondary },
                    { name: "Outros", value: kpiData.totalEntradas * 0.1, fill: chartColors.neutral }
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