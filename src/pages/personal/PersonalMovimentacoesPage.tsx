import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useModule } from "@/contexts/ModuleContext";
import { usePersonalTransactions } from "@/hooks/usePersonalTransactions";
import { usePersonalCategories } from "@/hooks/usePersonalCategories";
import { PersonalLayout } from "@/components/personal/PersonalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CalendarIcon, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

// Generate last 24 months for month selector
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
};

const monthOptions = generateMonthOptions();

export default function PersonalMovimentacoesPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasPersonalSubscription, hasFreeAccess, hasCompanySubscription } = useModule();
  const { categories } = usePersonalCategories();

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Period filter states
  const [periodType, setPeriodType] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined);
  const [appliedMonth, setAppliedMonth] = useState<string | undefined>(undefined);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Get all transactions without month filter
  const { transactions, isLoading } = usePersonalTransactions();

  // Check access
  const hasAccess = hasPersonalSubscription || hasFreeAccess || hasCompanySubscription;

  // Toggle type selection
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(t => {
      // Type filter (multi-select)
      if (selectedTypes.length > 0 && !selectedTypes.includes(t.type)) return false;

      // Category filter (multi-select)
      if (selectedCategories.length > 0) {
        const hasUncategorized = selectedCategories.includes('uncategorized');
        const hasCategoryMatch = t.category_id && selectedCategories.includes(t.category_id);
        
        if (hasUncategorized && !t.category_id) {
          // Match uncategorized
        } else if (hasCategoryMatch) {
          // Match specific category
        } else if (!hasUncategorized && !hasCategoryMatch) {
          return false;
        } else if (hasUncategorized && t.category_id && !hasCategoryMatch) {
          return false;
        }
      }

      // Date filter
      if (periodType === 'month' && appliedMonth) {
        const [year, month] = appliedMonth.split('-').map(Number);
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        const transactionDate = parseISO(t.transaction_date);
        
        if (transactionDate < monthStart || transactionDate > monthEnd) return false;
      } else if (periodType === 'custom' && (appliedStartDate || appliedEndDate)) {
        const transactionDate = parseISO(t.transaction_date);
        
        if (appliedStartDate && transactionDate < appliedStartDate) return false;
        if (appliedEndDate && transactionDate > appliedEndDate) return false;
      }

      return true;
    });
  }, [transactions, selectedTypes, selectedCategories, periodType, appliedMonth, appliedStartDate, appliedEndDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypes, selectedCategories, periodType, appliedMonth, appliedStartDate, appliedEndDate]);

  // Calculate totals based on filtered transactions
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleApplyPeriod = () => {
    if (periodType === 'month') {
      setAppliedMonth(selectedMonth);
      setAppliedStartDate(undefined);
      setAppliedEndDate(undefined);
    } else {
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      setAppliedMonth(undefined);
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setPeriodType('month');
    setSelectedMonth(monthOptions[0].value);
    setStartDate(undefined);
    setEndDate(undefined);
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
    setAppliedMonth(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedCategories.length > 0 || appliedMonth || appliedStartDate || appliedEndDate;

  if (authLoading || isLoading) {
    return (
      <PersonalLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PersonalLayout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!hasAccess) {
    navigate('/checkout');
    return null;
  }

  return (
    <PersonalLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suas Movimentações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e analise todas as suas entradas e saídas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--primary-light))]">
                  <ArrowUpCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entradas</p>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(totals.income)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Saídas</p>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(totals.expense)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  totals.income - totals.expense >= 0 ? "bg-[hsl(var(--primary-light))]" : "bg-destructive/10"
                )}>
                  {totals.income - totals.expense >= 0 ? (
                    <ArrowUpCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={cn(
                    "text-xl font-semibold",
                    totals.income - totals.expense >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    {formatCurrency(totals.income - totals.expense)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Card with Filters */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">
                Movimentações ({filteredTransactions.length})
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters Section */}
            <div className="space-y-4 pb-4 border-b border-border/50">
              {/* Type and Category Filters Row */}
              <div className="flex flex-wrap gap-6">
                {/* Type Filter - Multi-select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTypes.includes('income')}
                        onCheckedChange={() => toggleType('income')}
                      />
                      <span className="text-sm text-foreground">Entradas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTypes.includes('expense')}
                        onCheckedChange={() => toggleType('expense')}
                      />
                      <span className="text-sm text-foreground">Saídas</span>
                    </label>
                  </div>
                </div>

                {/* Category Filter - Multi-select Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Categorias</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[200px] h-9 justify-between text-left font-normal bg-background"
                      >
                        <span className="truncate">
                          {selectedCategories.length === 0 
                            ? "Todas" 
                            : selectedCategories.length === 1
                              ? selectedCategories.includes('uncategorized')
                                ? "Sem categoria"
                                : categories?.find(c => c.id === selectedCategories[0])?.name || "1 selecionada"
                              : `${selectedCategories.length} selecionadas`
                          }
                        </span>
                        <ChevronLeft className="h-4 w-4 shrink-0 opacity-50 rotate-[-90deg]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-background border border-border" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
                          <Checkbox
                            checked={selectedCategories.includes('uncategorized')}
                            onCheckedChange={() => toggleCategory('uncategorized')}
                          />
                          <span className="text-sm text-foreground">Sem categoria</span>
                        </label>
                        {categories?.map(cat => (
                          <label key={cat.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
                            <Checkbox
                              checked={selectedCategories.includes(cat.id)}
                              onCheckedChange={() => toggleCategory(cat.id)}
                            />
                            <span className="text-sm text-foreground">{cat.name}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Period Filter Row */}
              <div className="flex flex-wrap items-end gap-4">
                {/* Period Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Período</label>
                  <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'month' | 'custom')}>
                    <SelectTrigger className="w-[140px] h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      <SelectItem value="month">Por Mês</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {periodType === 'month' ? (
                  /* Month Selector */
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mês</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[180px] h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border max-h-[300px]">
                        {monthOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  /* Custom Date Range */
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Data Inicial</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[150px] h-9 justify-start text-left font-normal bg-background",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={ptBR}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Data Final</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[150px] h-9 justify-start text-left font-normal bg-background",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={ptBR}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {/* Apply Button */}
                <Button
                  onClick={handleApplyPeriod}
                  className="h-9 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground"
                >
                  Aplicar
                </Button>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedTypes.map(type => (
                    <span 
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))]"
                    >
                      {type === 'income' ? 'Entradas' : 'Saídas'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:opacity-70" 
                        onClick={() => toggleType(type)}
                      />
                    </span>
                  ))}
                  {selectedCategories.map(catId => {
                    const catName = catId === 'uncategorized' 
                      ? 'Sem categoria' 
                      : categories?.find(c => c.id === catId)?.name || catId;
                    return (
                      <span 
                        key={catId}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                      >
                        {catName}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:opacity-70" 
                          onClick={() => toggleCategory(catId)}
                        />
                      </span>
                    );
                  })}
                  {appliedMonth && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {monthOptions.find(m => m.value === appliedMonth)?.label}
                    </span>
                  )}
                  {(appliedStartDate || appliedEndDate) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {appliedStartDate ? format(appliedStartDate, "dd/MM/yyyy") : '...'} 
                      {' - '} 
                      {appliedEndDate ? format(appliedEndDate, "dd/MM/yyyy") : '...'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Data</TableHead>
                        <TableHead className="text-muted-foreground">Descrição</TableHead>
                        <TableHead className="text-muted-foreground">Categoria</TableHead>
                        <TableHead className="text-muted-foreground">Tipo</TableHead>
                        <TableHead className="text-right text-muted-foreground">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-foreground">
                            {format(parseISO(transaction.transaction_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-foreground max-w-[300px] truncate">
                            {transaction.description || '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.category ? (
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${transaction.category.color}20`,
                                  color: transaction.category.color 
                                }}
                              >
                                {transaction.category.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              transaction.type === 'income' 
                                ? "bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))]" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                            </span>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            transaction.type === 'income' ? "text-[hsl(var(--primary))]" : "text-foreground"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(Number(transaction.amount)))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} de {filteredTransactions.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-8 h-8",
                                currentPage === pageNum && "bg-[hsl(var(--primary))] text-primary-foreground"
                              )}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PersonalLayout>
  );
}
