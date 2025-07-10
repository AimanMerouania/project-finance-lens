import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, Receipt, TrendingUp, Euro } from "lucide-react";

export function ProjectStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [projectsResult, expensesResult, totalAmountResult] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact" }),
        supabase.from("expenses").select("id", { count: "exact" }),
        supabase.from("expenses").select("amount"),
      ]);

      const totalAmount = totalAmountResult.data?.reduce(
        (sum, expense) => sum + parseFloat(expense.amount.toString()),
        0
      ) || 0;

      const avgExpensePerProject = projectsResult.count && projectsResult.count > 0 
        ? totalAmount / projectsResult.count 
        : 0;

      return {
        projectsCount: projectsResult.count || 0,
        expensesCount: expensesResult.count || 0,
        totalAmount,
        avgExpensePerProject,
      };
    },
  });

  const statCards = [
    {
      title: "Projets actifs",
      value: stats?.projectsCount || 0,
      icon: FolderOpen,
      description: "projets en cours",
    },
    {
      title: "Total dépenses",
      value: `${(stats?.totalAmount || 0).toLocaleString("fr-FR")} €`,
      icon: Euro,
      description: "montant total",
    },
    {
      title: "Nombre de dépenses",
      value: stats?.expensesCount || 0,
      icon: Receipt,
      description: "transactions",
    },
    {
      title: "Moyenne par projet",
      value: `${(stats?.avgExpensePerProject || 0).toLocaleString("fr-FR")} €`,
      icon: TrendingUp,
      description: "coût moyen",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-4 w-4 animate-pulse bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse bg-muted rounded mb-1" />
              <div className="h-3 w-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}