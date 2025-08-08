import { lazy, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingStats } from "@/components/dashboard/TrendingStats";
import { PeriodFilter, PeriodType } from "@/components/dashboard/PeriodFilter";
import { TopProjects } from "@/components/dashboard/TopProjects";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import { BarChart3, PieChart, LineChart, Trophy, TrendingUp } from "lucide-react";

// Lazy load heavy chart components
const ExpenseChart = lazy(() => import("@/components/dashboard/ExpenseChart").then(m => ({ default: m.ExpenseChart })));
const ExpensesByType = lazy(() => import("@/components/dashboard/ExpensesByType").then(m => ({ default: m.ExpensesByType })));
const RecentExpenses = lazy(() => import("@/components/dashboard/RecentExpenses").then(m => ({ default: m.RecentExpenses })));
const ProjectComparison = lazy(() => import("@/components/dashboard/ProjectComparison").then(m => ({ default: m.ProjectComparison })));
const PeriodComparison = lazy(() => import("@/components/dashboard/PeriodComparison").then(m => ({ default: m.PeriodComparison })));

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos projets et dépenses avec analyses détaillées
          </p>
        </div>
        <PeriodFilter value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Stats with trends */}
      <div className="animate-scale-in">
        <TrendingStats period={selectedPeriod} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top Projets
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Répartition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Évolution des dépenses
                </CardTitle>
                <CardDescription>
                  Tendances mensuelles et évolution temporelle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyWrapper>
                  <ExpenseChart period={selectedPeriod} />
                </LazyWrapper>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par type
                </CardTitle>
                <CardDescription>
                  Distribution des dépenses par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyWrapper>
                  <ExpensesByType period={selectedPeriod} />
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparaison des projets
              </CardTitle>
              <CardDescription>
                Analyse comparative des dépenses par projet pour la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyWrapper>
                <ProjectComparison period={selectedPeriod} />
              </LazyWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <LazyWrapper>
            <PeriodComparison />
          </LazyWrapper>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top 5 des projets
              </CardTitle>
              <CardDescription>
                Projets avec les plus gros budgets pour la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyWrapper>
                <TopProjects period={selectedPeriod} />
              </LazyWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par type
                </CardTitle>
                <CardDescription>
                  Analyse détaillée par catégorie de dépenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyWrapper>
                  <ExpensesByType period={selectedPeriod} />
                </LazyWrapper>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analyse comparative
                </CardTitle>
                <CardDescription>
                  Comparaison des montants par projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyWrapper>
                  <ProjectComparison period={selectedPeriod} />
                </LazyWrapper>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;