import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, CalendarRange, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodMode = 'month' | 'custom';

interface PeriodSelectorProps {
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  customStartDate: Date | undefined;
  customEndDate: Date | undefined;
  onApplyCustomPeriod: (start: Date, end: Date) => void;
}

const monthNames = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

// Generate last 24 months for selection
const generateMonths = () => {
  const result = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`;
    result.push({
      value: monthValue,
      label: `${monthNames[month]} de ${year}`
    });
  }
  return result;
};

export function PeriodSelector({
  periodMode,
  setPeriodMode,
  selectedMonth,
  setSelectedMonth,
  customStartDate,
  customEndDate,
  onApplyCustomPeriod
}: PeriodSelectorProps) {
  const [pendingStartDate, setPendingStartDate] = useState<Date | undefined>(undefined);
  const [pendingEndDate, setPendingEndDate] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  const months = generateMonths();

  const getMonthDisplayName = (monthValue: string) => {
    if (!monthValue) return "Selecione o mês";
    const [year, month] = monthValue.split("-");
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} de ${year}`;
  };

  const handleApplyCustomPeriod = () => {
    if (pendingStartDate && pendingEndDate) {
      onApplyCustomPeriod(pendingStartDate, pendingEndDate);
      setIsOpen(false);
    }
  };

  const handleModeChange = (mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === 'month') {
      setPendingStartDate(undefined);
      setPendingEndDate(undefined);
    }
  };

  const getPeriodDisplayText = () => {
    if (periodMode === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`;
    }
    return getMonthDisplayName(selectedMonth);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="px-4 py-2 font-medium text-foreground hover:bg-muted min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            {periodMode === 'custom' ? (
              <CalendarRange className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span className="text-sm truncate">{getPeriodDisplayText()}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 bg-popover border border-border shadow-xl rounded-xl z-[9999]" 
        align="end"
        translate="no"
      >
        {/* Mode Toggle */}
        <div className="flex border-b border-border">
          <button
            onClick={() => handleModeChange('month')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-tl-xl",
              periodMode === 'month' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            Por Mês
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-tr-xl",
              periodMode === 'custom' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            Personalizado
          </button>
        </div>

        {periodMode === 'month' ? (
          /* Month Selection - Compact Grid */
          <div className="p-3 max-h-[280px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {months.map((month) => (
                <button
                  key={month.value}
                  onClick={() => {
                    setSelectedMonth(month.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "px-3 py-2 text-xs rounded-lg transition-colors text-left capitalize",
                    selectedMonth === month.value 
                      ? "bg-primary text-primary-foreground font-semibold" 
                      : "hover:bg-muted bg-muted/30"
                  )}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Custom Date Range */
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !pendingStartDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {pendingStartDate ? format(pendingStartDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={pendingStartDate}
                      onSelect={setPendingStartDate}
                      initialFocus
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !pendingEndDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {pendingEndDate ? format(pendingEndDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={pendingEndDate}
                      onSelect={setPendingEndDate}
                      initialFocus
                      locale={ptBR}
                      disabled={(date) => pendingStartDate ? date < pendingStartDate : false}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Apply Button */}
            <Button
              onClick={handleApplyCustomPeriod}
              disabled={!pendingStartDate || !pendingEndDate}
              className="w-full"
            >
              Aplicar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
