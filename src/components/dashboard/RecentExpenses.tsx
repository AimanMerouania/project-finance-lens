import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function RecentExpenses() {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["recent-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, expense_date, projects(name), expense_types(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - recent data should be fresher
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-2 h-2 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Aucune dépense récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center space-x-4">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {expense.projects?.name || "Projet non défini"}
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{expense.expense_types?.name}</span>
              <span>•</span>
              <span>{format(new Date(expense.expense_date), "dd MMM", { locale: fr })}</span>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground">
            {parseFloat(expense.amount.toString()).toLocaleString("fr-FR")} €
          </div>
        </div>
      ))}
    </div>
  );
}