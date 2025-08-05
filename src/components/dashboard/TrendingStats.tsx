import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, FolderOpen, Receipt, Euro, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TrendingStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["trending-stats"],
    queryFn: async () => {
      const now = new Date();
      
      // Current month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Previous month
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [currentMonthResult, previousMonthResult, projectsResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("amount")
          .gte("expense_date", currentMonthStart.toISOString().split('T')[0])
          .lte("expense_date", currentMonthEnd.toISOString().split('T')[0]),
        supabase
          .from("expenses")
          .select("amount")
          .gte("expense_date", previousMonthStart.toISOString().split('T')[0])
          .lte("expense_date", previousMonthEnd.toISOString().split('T')[0]),
        supabase.from("projects").select("*", { count: "exact", head: true }),
      ]);

      const currentMonthTotal = currentMonthResult.data?.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
      ) || 0;
      
      const previousMonthTotal = previousMonthResult.data?.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
      ) || 0;

      const currentMonthCount = currentMonthResult.data?.length || 0;
      const previousMonthCount = previousMonthResult.data?.length || 0;

      // Calculate trends
      const amountTrend = previousMonthTotal > 0 
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
        : 0;
      
      const countTrend = previousMonthCount > 0 
        ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100 
        : 0;

      return {
        projectsCount: projectsResult.count || 0,
        currentMonthTotal,
        currentMonthCount,
        amountTrend,
        countTrend,
        avgPerTransaction: currentMonthCount > 0 ? currentMonthTotal / currentMonthCount : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getTrendBadgeVariant = (trend: number) => {
    if (trend > 0) return "default" as const;
    if (trend < 0) return "destructive" as const;
    return "secondary" as const;
  };

  const statCards = [
    {
      title: "Projets totaux",
      value: stats?.projectsCount || 0,
      icon: FolderOpen,
      description: "projets en base",
      trend: null,
    },
    {
      title: "Dépenses ce mois",
      value: `${(stats?.currentMonthTotal || 0).toLocaleString("fr-FR")} MAD`,
      icon: Euro,
      description: "total mensuel",
      trend: stats?.amountTrend || 0,
    },
    {
      title: "Transactions ce mois",
      value: stats?.currentMonthCount || 0,
      icon: Receipt,
      description: "nombre de dépenses",
      trend: stats?.countTrend || 0,
    },
    {
      title: "Moyenne par transaction",
      value: `${(stats?.avgPerTransaction || 0).toLocaleString("fr-FR")} MAD`,
      icon: BarChart3,
      description: "coût moyen",
      trend: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
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
      {statCards.map((stat, index) => {
        const TrendIcon = stat.trend !== null ? getTrendIcon(stat.trend) : null;
        const trendColor = stat.trend !== null ? getTrendColor(stat.trend) : "";
        
        return (
          <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.trend !== null && TrendIcon && (
                  <Badge variant={getTrendBadgeVariant(stat.trend)} className="ml-2">
                    <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
                    {Math.abs(stat.trend).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary/20 to-transparent" />
          </Card>
        );
      })}
    </div>
  );
}