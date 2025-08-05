import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp } from "lucide-react";

export type PeriodType = "month" | "quarter" | "year" | "all";

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const periods = [
    { value: "month" as const, label: "Ce mois", icon: CalendarIcon },
    { value: "quarter" as const, label: "Ce trimestre", icon: TrendingUp },
    { value: "year" as const, label: "Cette année", icon: CalendarIcon },
    { value: "all" as const, label: "Toute la période", icon: TrendingUp },
  ];

  return (
    <div className="flex items-center space-x-2">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sélectionner une période" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              <div className="flex items-center space-x-2">
                <period.icon className="h-4 w-4" />
                <span>{period.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}