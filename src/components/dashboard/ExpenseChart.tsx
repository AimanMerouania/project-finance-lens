import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  amount: {
    label: "Montant (€)",
    color: "hsl(var(--chart-1))",
  },
};

export function ExpenseChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["expense-chart"],
    queryFn: async () => {
      // Only fetch necessary data - removed projects join as it's not used
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date")
        .order("expense_date");

      if (error) throw error;

      // Group by month with optimized processing
      const monthlyData = data.reduce((acc: Record<string, { month: string; amount: number }>, expense) => {
        const date = new Date(expense.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            amount: 0,
          };
        }
        
        acc[monthKey].amount += Number(expense.amount);
        
        return acc;
      }, {});

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - charts don't need frequent updates
  });

  if (isLoading) {
    return (
      <div className="h-[350px] w-full animate-pulse bg-muted rounded" />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${month}/${year}`;
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            labelFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${month}/${year}`;
            }}
            formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} €`, "Montant"]}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="var(--color-amount)" 
            strokeWidth={2}
            dot={{ fill: "var(--color-amount)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}