import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PeriodType } from "./PeriodFilter";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const chartConfig = {
  amount: {
    label: "Montant (MAD)",
  },
};

interface ExpensesByTypeProps {
  period: PeriodType;
}

export function ExpensesByType({ period }: ExpensesByTypeProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["expenses-by-type", period],
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
        .select("amount, expense_types(name)");

      if (dateFilter) {
        const [field, operator, value] = dateFilter.split('.');
        query.gte(field, value);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by expense type with optimized processing
      const typeData = data.reduce((acc: Record<string, { name: string; amount: number }>, expense) => {
        const typeName = expense.expense_types?.name || "Non défini";
        
        if (!acc[typeName]) {
          acc[typeName] = {
            name: typeName,
            amount: 0,
          };
        }
        
        acc[typeName].amount += Number(expense.amount);
        
        return acc;
      }, {});

      return Object.values(typeData);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for pie chart data
  });

  if (isLoading) {
    return (
      <div className="h-[300px] w-full animate-pulse bg-muted rounded" />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Montant"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}