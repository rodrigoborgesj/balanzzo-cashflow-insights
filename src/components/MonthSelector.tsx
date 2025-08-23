import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const monthNames = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

export function MonthSelector({ value, onChange, className = "" }: MonthSelectorProps) {
  const getMonthDisplayName = (monthValue: string) => {
    if (!monthValue) return "Selecione o mês";
    
    const [year, month] = monthValue.split("-");
    const monthIndex = parseInt(month) - 1;
    const monthName = monthNames[monthIndex];
    
    return `${monthName} de ${year}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-12 px-4 justify-start text-left font-normal min-w-[200px] ${className}`}
        >
          <Calendar className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
          <span className="text-sm">{getMonthDisplayName(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
        <div className="p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Mês de Referência
          </label>
          <Input
            type="month"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-primary/20 focus:border-primary"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}