import { lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStats } from "@/components/dashboard/ProjectStats";
import { LazyWrapper } from "@/components/common/LazyWrapper";

// Lazy load heavy chart components
const ExpenseChart = lazy(() => import("@/components/dashboard/ExpenseChart").then(m => ({ default: m.ExpenseChart })));
const ExpensesByType = lazy(() => import("@/components/dashboard/ExpensesByType").then(m => ({ default: m.ExpensesByType })));
const RecentExpenses = lazy(() => import("@/components/dashboard/RecentExpenses").then(m => ({ default: m.RecentExpenses })));

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos projets et dépenses
          </p>
        </div>
      </div>

      <div className="animate-scale-in">
        <ProjectStats />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des dépenses</CardTitle>
            <CardDescription>
              Dépenses mensuelles par projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LazyWrapper>
              <ExpenseChart />
            </LazyWrapper>
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
            <LazyWrapper>
              <ExpensesByType />
            </LazyWrapper>
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
            <LazyWrapper>
              <RecentExpenses />
            </LazyWrapper>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;