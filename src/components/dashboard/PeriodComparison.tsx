import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, TrendingUp } from "lucide-react";

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

type ComparisonType = "month-prev" | "month-next" | "quarter-prev" | "quarter-next";

interface ComparisonOption {
  value: ComparisonType;
  label: string;
  description: string;
}

const comparisonOptions: ComparisonOption[] = [
  {
    value: "month-prev",
    label: "Mois actuel vs précédent",
    description: "Comparaison avec le mois précédent"
  },
  {
    value: "month-next",
    label: "Mois actuel vs suivant",
    description: "Comparaison avec le mois suivant"
  },
  {
    value: "quarter-prev",
    label: "Trimestre actuel vs précédent",
    description: "Comparaison avec le trimestre précédent"
  },
  {
    value: "quarter-next",
    label: "Trimestre actuel vs suivant",
    description: "Comparaison avec le trimestre suivant"
  },
];

export function PeriodComparison() {
  const [comparisonType, setComparisonType] = useState<ComparisonType>("month-prev");

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["period-comparison", comparisonType],
    queryFn: async () => {
      const now = new Date();
      let currentStart: Date, currentEnd: Date, compareStart: Date, compareEnd: Date;

      switch (comparisonType) {
        case "month-prev":
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          compareStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          compareEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "month-next":
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          compareStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          compareEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          break;
        case "quarter-prev":
          const currentQuarter = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
          currentEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
          compareStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          compareEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
          break;
        case "quarter-next":
          const currentQ = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), currentQ * 3, 1);
          currentEnd = new Date(now.getFullYear(), (currentQ + 1) * 3, 0);
          compareStart = new Date(now.getFullYear(), (currentQ + 1) * 3, 1);
          compareEnd = new Date(now.getFullYear(), (currentQ + 2) * 3, 0);
          break;
      }

      // Fetch current period data
      const { data: currentData, error: currentError } = await supabase
        .from("expenses")
        .select("amount, projects(name)")
        .gte("expense_date", currentStart.toISOString().split('T')[0])
        .lte("expense_date", currentEnd.toISOString().split('T')[0]);

      if (currentError) throw currentError;

      // Fetch comparison period data
      const { data: compareData, error: compareError } = await supabase
        .from("expenses")
        .select("amount, projects(name)")
        .gte("expense_date", compareStart.toISOString().split('T')[0])
        .lte("expense_date", compareEnd.toISOString().split('T')[0]);

      if (compareError) throw compareError;

      // Process current period data
      const currentProjectData = currentData.reduce((acc: Record<string, number>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        acc[projectName] = (acc[projectName] || 0) + Number(expense.amount);
        return acc;
      }, {});

      // Process comparison period data
      const compareProjectData = compareData.reduce((acc: Record<string, number>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        acc[projectName] = (acc[projectName] || 0) + Number(expense.amount);
        return acc;
      }, {});

      // Combine all project names
      const allProjects = new Set([...Object.keys(currentProjectData), ...Object.keys(compareProjectData)]);

      // Create chart data
      return Array.from(allProjects)
        .map(projectName => ({
          name: projectName.length > 15 ? projectName.substring(0, 15) + "..." : projectName,
          currentPeriod: currentProjectData[projectName] || 0,
          comparePeriod: compareProjectData[projectName] || 0,
        }))
        .filter(item => item.currentPeriod > 0 || item.comparePeriod > 0)
        .sort((a, b) => (b.currentPeriod + b.comparePeriod) - (a.currentPeriod + a.comparePeriod))
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  const selectedOption = comparisonOptions.find(opt => opt.value === comparisonType);

  if (isLoading) {
    return (
      <div className="h-[400px] w-full animate-pulse bg-muted rounded" />
    );
  }

  const totalCurrent = chartData?.reduce((sum, item) => sum + item.currentPeriod, 0) || 0;
  const totalCompare = chartData?.reduce((sum, item) => sum + item.comparePeriod, 0) || 0;
  const percentageChange = totalCompare > 0 ? ((totalCurrent - totalCompare) / totalCompare) * 100 : 0;

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
              {selectedOption?.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={comparisonType} onValueChange={(value: ComparisonType) => setComparisonType(value)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {comparisonOptions.map((option) => (
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