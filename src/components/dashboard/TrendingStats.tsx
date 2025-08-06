import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, FolderOpen, Receipt, Euro, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PeriodType } from "./PeriodFilter";

interface TrendingStatsProps {
  period: PeriodType;
}

export function TrendingStats({ period }: TrendingStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["trending-stats", period],
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
      // Current period query
      const currentQuery = supabase
        .from("expenses")
        .select("amount");

      if (dateFilter) {
        const [field, operator, value] = dateFilter.split('.');
        currentQuery.gte(field, value);
      }

      // Previous period for comparison
      let previousDateFilter = "";
      switch (period) {
        case "month":
          const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          previousDateFilter = `expense_date.gte.${prevMonthStart.toISOString().split('T')[0]}&expense_date.lte.${prevMonthEnd.toISOString().split('T')[0]}`;
          break;
        case "quarter":
          const prevQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
          const prevQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
          previousDateFilter = `expense_date.gte.${prevQuarterStart.toISOString().split('T')[0]}&expense_date.lte.${prevQuarterEnd.toISOString().split('T')[0]}`;
          break;
        case "year":
          const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
          const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
          previousDateFilter = `expense_date.gte.${prevYearStart.toISOString().split('T')[0]}&expense_date.lte.${prevYearEnd.toISOString().split('T')[0]}`;
          break;
        default:
          previousDateFilter = "";
      }

      const previousQuery = supabase
        .from("expenses")
        .select("amount");

      if (previousDateFilter && period !== "all") {
        const filters = previousDateFilter.split('&');
        filters.forEach(filter => {
          const [field, operator, value] = filter.split('.');
          if (operator === 'gte') previousQuery.gte(field, value);
          if (operator === 'lte') previousQuery.lte(field, value);
        });
      }

      const [currentResult, previousResult, projectsResult] = await Promise.all([
        currentQuery,
        period !== "all" ? previousQuery : Promise.resolve({ data: [] }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
      ]);

      const currentTotal = currentResult.data?.map(e => Number(e.amount)).reduce((a, b) => a + b, 0) || 0;
      const previousTotal = previousResult.data?.map(e => Number(e.amount)).reduce((a, b) => a + b, 0) || 0;

      const currentCount = currentResult.data?.length || 0;
      const previousCount = previousResult.data?.length || 0;

      // Calculate trends
      const amountTrend = previousTotal > 0 && period !== "all"
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0;
      
      const countTrend = previousCount > 0 && period !== "all"
        ? ((currentCount - previousCount) / previousCount) * 100 
        : 0;

      return {
        projectsCount: projectsResult.count || 0,
        currentTotal,
        currentCount,
        amountTrend,
        countTrend,
        avgPerTransaction: currentCount > 0 ? currentTotal / currentCount : 0,
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
      title: `Dépenses ${period === "month" ? "ce mois" : period === "quarter" ? "ce trimestre" : period === "year" ? "cette année" : "totales"}`,
      value: `${(stats?.currentTotal || 0).toLocaleString("fr-FR")} MAD`,
      icon: Euro,
      description: "total période",
      trend: period !== "all" ? (stats?.amountTrend || 0) : null,
    },
    {
      title: `Transactions ${period === "month" ? "ce mois" : period === "quarter" ? "ce trimestre" : period === "year" ? "cette année" : "totales"}`,
      value: stats?.currentCount || 0,
      icon: Receipt,
      description: "nombre de dépenses",
      trend: period !== "all" ? (stats?.countTrend || 0) : null,
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