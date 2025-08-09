import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { fr } from "date-fns/locale";

const chartConfig = {
  currentPeriod: {
    label: "Période actuelle",
    color: "hsl(var(--chart-1))",
  },
  comparePeriod: {
    label: "Période de comparaison",
    color: "hsl(var(--chart-2))",
  },
};

type PeriodType = "month" | "quarter";

interface PeriodOption {
  value: string;
  label: string;
}

// Generate month options for the current and previous/next years
const generateMonthOptions = (): PeriodOption[] => {
  const options: PeriodOption[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: format(date, "MMMM yyyy", { locale: fr })
      });
    }
  }
  return options;
};

// Generate quarter options for the current and previous/next years
const generateQuarterOptions = (): PeriodOption[] => {
  const options: PeriodOption[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      options.push({
        value: `${year}-Q${quarter + 1}`,
        label: `T${quarter + 1} ${year}`
      });
    }
  }
  return options;
};

export function PeriodComparison() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [firstPeriod, setFirstPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth().toString().padStart(2, '0')}`;
  });
  const [secondPeriod, setSecondPeriod] = useState(() => {
    const now = new Date();
    const prevMonth = now.getMonth() - 1;
    const year = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = prevMonth < 0 ? 11 : prevMonth;
    return `${year}-${month.toString().padStart(2, '0')}`;
  });

  // Update period formats when switching between month and quarter
  const handlePeriodTypeChange = (newType: PeriodType) => {
    setPeriodType(newType);
    const now = new Date();
    
    if (newType === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const yearForPrev = currentQuarter === 1 ? now.getFullYear() - 1 : now.getFullYear();
      
      setFirstPeriod(`${now.getFullYear()}-Q${currentQuarter}`);
      setSecondPeriod(`${yearForPrev}-Q${prevQuarter}`);
    } else {
      setFirstPeriod(`${now.getFullYear()}-${now.getMonth().toString().padStart(2, '0')}`);
      const prevMonth = now.getMonth() - 1;
      const year = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = prevMonth < 0 ? 11 : prevMonth;
      setSecondPeriod(`${year}-${month.toString().padStart(2, '0')}`);
    }
  };

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["period-comparison", periodType, firstPeriod, secondPeriod],
    queryFn: async () => {
      let firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date;

      if (periodType === "month") {
        // Parse month periods (format: YYYY-MM)
        const [firstYear, firstMonth] = firstPeriod.split('-').map(Number);
        const [secondYear, secondMonth] = secondPeriod.split('-').map(Number);
        
        firstStart = startOfMonth(new Date(firstYear, firstMonth, 1));
        firstEnd = endOfMonth(new Date(firstYear, firstMonth, 1));
        secondStart = startOfMonth(new Date(secondYear, secondMonth, 1));
        secondEnd = endOfMonth(new Date(secondYear, secondMonth, 1));
      } else {
        // Parse quarter periods (format: YYYY-QX)
        const [firstYear, firstQuarter] = firstPeriod.split('-Q').map(Number);
        const [secondYear, secondQuarter] = secondPeriod.split('-Q').map(Number);
        
        firstStart = startOfQuarter(new Date(firstYear, (firstQuarter - 1) * 3, 1));
        firstEnd = endOfQuarter(new Date(firstYear, (firstQuarter - 1) * 3, 1));
        secondStart = startOfQuarter(new Date(secondYear, (secondQuarter - 1) * 3, 1));
        secondEnd = endOfQuarter(new Date(secondYear, (secondQuarter - 1) * 3, 1));
      }

      // Fetch first period data
      const { data: firstData, error: firstError } = await supabase
        .from("expenses")
        .select("amount, projects(name)")
        .gte("expense_date", firstStart.toISOString().split('T')[0])
        .lte("expense_date", firstEnd.toISOString().split('T')[0]);

      if (firstError) throw firstError;

      // Fetch second period data
      const { data: secondData, error: secondError } = await supabase
        .from("expenses")
        .select("amount, projects(name)")
        .gte("expense_date", secondStart.toISOString().split('T')[0])
        .lte("expense_date", secondEnd.toISOString().split('T')[0]);

      if (secondError) throw secondError;

      // Process first period data
      const firstProjectData = firstData.reduce((acc: Record<string, number>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        acc[projectName] = (acc[projectName] || 0) + Number(expense.amount);
        return acc;
      }, {});

      // Process second period data
      const secondProjectData = secondData.reduce((acc: Record<string, number>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        acc[projectName] = (acc[projectName] || 0) + Number(expense.amount);
        return acc;
      }, {});

      // Combine all project names
      const allProjects = new Set([...Object.keys(firstProjectData), ...Object.keys(secondProjectData)]);

      // Create chart data
      return Array.from(allProjects)
        .map(projectName => ({
          name: projectName.length > 15 ? projectName.substring(0, 15) + "..." : projectName,
          currentPeriod: firstProjectData[projectName] || 0,
          comparePeriod: secondProjectData[projectName] || 0,
        }))
        .filter(item => item.currentPeriod > 0 || item.comparePeriod > 0)
        .sort((a, b) => (b.currentPeriod + b.comparePeriod) - (a.currentPeriod + a.comparePeriod))
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentOptions = periodType === "month" ? generateMonthOptions() : generateQuarterOptions();

  if (isLoading) {
    return (
      <div className="h-[400px] w-full animate-pulse bg-muted rounded" />
    );
  }

  const totalCurrent = chartData?.reduce((sum, item) => sum + item.currentPeriod, 0) || 0;
  const totalCompare = chartData?.reduce((sum, item) => sum + item.comparePeriod, 0) || 0;
  const percentageChange = totalCompare > 0 ? ((totalCurrent - totalCompare) / totalCompare) * 100 : 0;

  const firstPeriodLabel = currentOptions.find(opt => opt.value === firstPeriod)?.label || firstPeriod;
  const secondPeriodLabel = currentOptions.find(opt => opt.value === secondPeriod)?.label || secondPeriod;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparaison temporelle par projet
            </CardTitle>
            <CardDescription>
              Comparaison entre {firstPeriodLabel} et {secondPeriodLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={periodType} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Première période</label>
            <Select value={firstPeriod} onValueChange={setFirstPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Seconde période</label>
            <Select value={secondPeriod} onValueChange={setSecondPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalCurrent.toLocaleString("fr-FR")} MAD
            </div>
            <div className="text-sm text-muted-foreground">Période actuelle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {totalCompare.toLocaleString("fr-FR")} MAD
            </div>
            <div className="text-sm text-muted-foreground">Période de comparaison</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Évolution</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString("fr-FR")} MAD`, 
                  name === "currentPeriod" ? "Période actuelle" : "Période de comparaison"
                ]}
              />
              <Legend />
              <Bar 
                dataKey="currentPeriod" 
                fill="var(--color-currentPeriod)" 
                radius={[4, 4, 0, 0]}
                name="Période actuelle"
              />
              <Bar 
                dataKey="comparePeriod" 
                fill="var(--color-comparePeriod)" 
                radius={[4, 4, 0, 0]}
                name="Période de comparaison"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}