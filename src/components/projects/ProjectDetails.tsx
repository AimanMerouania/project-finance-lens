import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSignIcon, UserIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectDetailsProps {
  projectId: string;
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          expenses(amount, expense_date, description)
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Projet non trouvé</p>
        </CardContent>
      </Card>
    );
  }

  const totalExpenses = project.expenses?.reduce(
    (sum, expense) => sum + parseFloat(expense.amount.toString()),
    0
  ) || 0;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      completed: "secondary",
      on_hold: "outline",
    } as const;

    const labels = {
      active: "Actif",
      completed: "Terminé",
      on_hold: "En pause",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description || "Aucune description"}</p>
        </div>
        {getStatusBadge(project.status)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budget ? `${project.budget.toLocaleString("fr-FR")} MAD` : "Non défini"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total dépenses</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalExpenses.toLocaleString("fr-FR")} MAD
            </div>
            {project.budget && (
              <p className="text-xs text-muted-foreground">
                {((totalExpenses / project.budget) * 100).toFixed(1)}% du budget
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.client || "Non défini"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nb. dépenses</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.expenses?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.start_date && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date de début</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.start_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            )}
            
            {project.end_date && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date de fin</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.end_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Créé le</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(project.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dépenses récentes</CardTitle>
            <CardDescription>Les 5 dernières dépenses du projet</CardDescription>
          </CardHeader>
          <CardContent>
            {project.expenses && project.expenses.length > 0 ? (
              <div className="space-y-2">
                {project.expenses
                  .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                  .slice(0, 5)
                  .map((expense, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{expense.description || "Dépense"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {parseFloat(expense.amount.toString()).toLocaleString("fr-FR")} MAD
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune dépense enregistrée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}