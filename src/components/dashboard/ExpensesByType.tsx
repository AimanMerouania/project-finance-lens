import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const chartConfig = {
  amount: {
    label: "Montant (€)",
  },
};

export function ExpensesByType() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["expenses-by-type"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          amount,
          expense_types(name)
        `);

      if (error) throw error;

      // Group by expense type
      const typeData = data.reduce((acc: any, expense) => {
        const typeName = expense.expense_types?.name || "Non défini";
        
        if (!acc[typeName]) {
          acc[typeName] = {
            name: typeName,
            amount: 0,
          };
        }
        
        acc[typeName].amount += parseFloat(expense.amount.toString());
        
        return acc;
      }, {});

      return Object.values(typeData);
    },
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
            formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} €`, "Montant"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}