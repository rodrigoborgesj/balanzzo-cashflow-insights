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
import { Loader2, CalendarIcon, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export default function PersonalMovimentacoesPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasPersonalSubscription, hasFreeAccess, hasCompanySubscription } = useModule();
  const { categories } = usePersonalCategories();

  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Get all transactions without month filter
  const { transactions, isLoading } = usePersonalTransactions();

  // Check access
  const hasAccess = hasPersonalSubscription || hasFreeAccess || hasCompanySubscription;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(t => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'uncategorized') {
          if (t.category_id) return false;
        } else {
          if (t.category_id !== categoryFilter) return false;
        }
      }

      // Date range filter (only if applied)
      if (appliedStartDate || appliedEndDate) {
        const transactionDate = parseISO(t.transaction_date);
        
        if (appliedStartDate && transactionDate < appliedStartDate) return false;
        if (appliedEndDate && transactionDate > appliedEndDate) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, appliedStartDate, appliedEndDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, appliedStartDate, appliedEndDate]);

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
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || appliedStartDate || appliedEndDate;

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Suas Movimentações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e analise todas as suas entradas e saídas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E4F8CA]">
                  <ArrowUpCircle className="h-5 w-5 text-[#1A3423]" />
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
                <div className="p-2 rounded-lg bg-[#E9E9E9]">
                  <ArrowDownCircle className="h-5 w-5 text-gray-600" />
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
                  totals.income - totals.expense >= 0 ? "bg-[#E4F8CA]" : "bg-red-50"
                )}>
                  {totals.income - totals.expense >= 0 ? (
                    <ArrowUpCircle className="h-5 w-5 text-[#1A3423]" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={cn(
                    "text-xl font-semibold",
                    totals.income - totals.expense >= 0 ? "text-foreground" : "text-red-500"
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
            {/* Filters Row */}
            <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-border/50">
              {/* Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'income' | 'expense')}>
                  <SelectTrigger className="w-[140px] h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="income">Entradas</SelectItem>
                    <SelectItem value="expense">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="uncategorized">Sem categoria</SelectItem>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] h-9 justify-start text-left font-normal bg-background",
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

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] h-9 justify-start text-left font-normal bg-background",
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

              {/* Apply Button */}
              <Button
                onClick={handleApplyPeriod}
                disabled={!startDate && !endDate}
                className="h-9 bg-[#1A3423] hover:bg-[#1A3423]/90 text-white"
              >
                Aplicar
              </Button>
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
                                ? "bg-[#E4F8CA] text-[#1A3423]" 
                                : "bg-[#E9E9E9] text-gray-600"
                            )}>
                              {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                            </span>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            transaction.type === 'income' ? "text-[#1A3423]" : "text-foreground"
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
                                "w-8 h-8 p-0",
                                currentPage === pageNum && "bg-[#1A3423] hover:bg-[#1A3423]/90"
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
