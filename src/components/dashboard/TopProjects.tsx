import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, TrendingUp } from "lucide-react";
import { PeriodType } from "./PeriodFilter";

interface TopProjectsProps {
  period: PeriodType;
}

export function TopProjects({ period }: TopProjectsProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["top-projects", period],
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
        .select("amount, projects(name, budget, status)");

      if (dateFilter) {
        const [field, operator, value] = dateFilter.split('.');
        query.gte(field, value);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by project and calculate stats
      const projectStats = data.reduce((acc: Record<string, any>, expense) => {
        const projectName = expense.projects?.name || "Projet non défini";
        const projectBudget = expense.projects?.budget || 0;
        const projectStatus = expense.projects?.status || "active";
        
        if (!acc[projectName]) {
          acc[projectName] = {
            name: projectName,
            totalSpent: 0,
            budget: projectBudget,
            status: projectStatus,
            expenseCount: 0,
          };
        }
        
        acc[projectName].totalSpent += Number(expense.amount);
        acc[projectName].expenseCount += 1;
        
        return acc;
      }, {});

      // Calculate total for percentage
      const totalAmount = Object.values(projectStats).reduce(
        (sum: number, project: any) => sum + project.totalSpent, 0
      );

      // Add percentage and budget utilization
      const projectsWithStats = Object.values(projectStats).map((project: any) => ({
        ...project,
        percentage: totalAmount > 0 ? (project.totalSpent / totalAmount) * 100 : 0,
        budgetUtilization: project.budget > 0 ? (project.totalSpent / project.budget) * 100 : 0,
      }));

      // Sort by total spent and get top 5
      return projectsWithStats
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "on_hold": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Actif";
      case "on_hold": return "En pause";
      case "completed": return "Terminé";
      default: return "Inconnu";
    }
  };

  const getBudgetAlert = (utilization: number) => {
    if (utilization > 90) return { color: "text-red-600", text: "Budget dépassé" };
    if (utilization > 75) return { color: "text-yellow-600", text: "Attention budget" };
    return { color: "text-green-600", text: "Budget OK" };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun projet trouvé pour cette période</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project, index) => {
        const budgetAlert = getBudgetAlert(project.budgetUtilization);
        
        return (
          <div key={project.name} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">#{index + 1}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                <Badge variant="outline" className="text-xs">
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-sm text-muted-foreground">
                  {project.expenseCount} dépense{project.expenseCount > 1 ? 's' : ''}
                </span>
                <span className="text-sm font-medium">
                  {project.totalSpent.toLocaleString("fr-FR")} MAD
                </span>
                {project.budget > 0 && (
                  <span className={`text-xs ${budgetAlert.color}`}>
                    {budgetAlert.text}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Progress value={project.percentage} className="h-2" />
                {project.budget > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Budget: {project.budget.toLocaleString("fr-FR")} MAD</span>
                    <span>{project.budgetUtilization.toFixed(1)}% utilisé</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                {project.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}