import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PeriodType } from "./PeriodFilter";

const chartConfig = {
  amount: {
    label: "Montant (MAD)",
    color: "hsl(var(--chart-2))",
  },
};

interface ProjectComparisonProps {
  period: PeriodType;
}

export function ProjectComparison({ period }: ProjectComparisonProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["project-comparison", period],
    queryFn: async () => {
      let dateFilter = "";
      const now = new Date();

      switch (period) {
        case "month":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = `expense_date.gte.${startOfMonth.toISOString().split('T')[0]}`;
          break;
        case "quarter":
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          dateFilter = `expense_date.gte.${quarterStart.toISOString().split('T')[0]}`;
          break;
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = `expense_date.gte.${yearStart.toISOString().split('T')[0]}`;
          break;
        default:
          dateFilter = "";
      }

      const query = supabase
        .from("expenses")
        .select("amount, projects(name)")
        .order("amount", { ascending: false });

      if (dateFilter) {
        const [field, operator, value] = dateFilter.split('.');
        query.gte(field, value);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by project and sum amounts
      const projectData = data.reduce((acc: Record<string, { name: string; amount: number }>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        
        if (!acc[projectName]) {
          acc[projectName] = {
            name: projectName,
            amount: 0,
          };
        }
        
        acc[projectName].amount += Number(expense.amount);
        
        return acc;
      }, {});

      // Get top 8 projects and sort by amount
      return Object.values(projectData)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8)
        .map(project => ({
          ...project,
          name: project.name.length > 15 ? project.name.substring(0, 15) + "..." : project.name
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="h-[350px] w-full animate-pulse bg-muted rounded" />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px]">
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
            formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Montant"]}
          />
          <Bar 
            dataKey="amount" 
            fill="var(--color-amount)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}