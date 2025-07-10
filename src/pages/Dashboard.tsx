import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { ProjectStats } from "@/components/dashboard/ProjectStats";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { ExpensesByType } from "@/components/dashboard/ExpensesByType";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos projets et dépenses
          </p>
        </div>
      </div>

      <ProjectStats />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des dépenses</CardTitle>
            <CardDescription>
              Dépenses mensuelles par projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
            <CardDescription>
              Distribution des dépenses par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesByType />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dépenses récentes</CardTitle>
            <CardDescription>
              Dernières transactions enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentExpenses />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;