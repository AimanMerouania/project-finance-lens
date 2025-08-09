import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { RevenueForm } from "./RevenueForm";
import { DollarSign, Search, MoreHorizontal, Edit, Trash, Calendar, FileText, Receipt } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Revenue {
  id: string;
  project_id: string;
  amount: number;
  revenue_date: string;
  description?: string;
  invoice_reference?: string;
  payment_status: string;
  created_at: string;
  projects?: { name: string } | null;
}

export function RevenuesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: revenues, isLoading } = useQuery({
    queryKey: ["revenues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select(`
          *,
          projects(name)
        `)
        .order("revenue_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteRevenueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({
        title: "Succès",
        description: "Le revenu a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRevenues = revenues?.filter(revenue =>
    revenue.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenue.invoice_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "received":
        return "Reçu";
      case "pending":
        return "En attente";
      case "overdue":
        return "En retard";
      default:
        return status;
    }
  };

  const totalRevenues = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.amount), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Revenus</h2>
          <p className="text-muted-foreground">
            {filteredRevenues.length} revenus • Total: {totalRevenues.toLocaleString("fr-FR")} MAD
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Ajouter un revenu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau revenu</DialogTitle>
            </DialogHeader>
            <RevenueForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par projet, description ou référence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredRevenues.map((revenue) => (
          <Card key={revenue.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    {revenue.projects?.name || "Projet non défini"}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(revenue.revenue_date), "PPP", { locale: fr })}
                    </div>
                    {revenue.invoice_reference && (
                      <div className="flex items-center gap-1">
                        <Receipt className="h-4 w-4" />
                        {revenue.invoice_reference}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(revenue.payment_status)}>
                    {getStatusLabel(revenue.payment_status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRevenue(revenue);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer ce revenu ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRevenueMutation.mutate(revenue.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {Number(revenue.amount).toLocaleString("fr-FR")} MAD
                  </div>
                  {revenue.description && (
                    <div className="flex items-start gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{revenue.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRevenues.length === 0 && (
        <Card className="p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun revenu trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Aucun revenu ne correspond à votre recherche." : "Commencez par ajouter votre premier revenu."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Ajouter un revenu
            </Button>
          )}
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le revenu</DialogTitle>
          </DialogHeader>
          {selectedRevenue && (
            <RevenueForm
              revenueId={selectedRevenue.id}
              initialData={{
                project_id: selectedRevenue.project_id,
                amount: Number(selectedRevenue.amount),
                revenue_date: new Date(selectedRevenue.revenue_date),
                description: selectedRevenue.description || "",
                invoice_reference: selectedRevenue.invoice_reference || "",
                payment_status: selectedRevenue.payment_status as "pending" | "received" | "overdue",
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedRevenue(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}