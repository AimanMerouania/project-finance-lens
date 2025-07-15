import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, ArrowLeft, Calendar, Building, Receipt, User, FileText, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExpenseEditForm } from "./ExpenseEditForm";

interface ExpenseDetailsProps {
  expenseId: string;
  onBack: () => void;
}

export function ExpenseDetails({ expenseId, onBack }: ExpenseDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense-details", expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, projects(id, name, client), expense_types(id, name), suppliers(id, name)")
        .eq("id", expenseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dépense introuvable</CardTitle>
          <CardDescription>
            Cette dépense n'existe pas ou a été supprimée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <ExpenseEditForm
        expense={expense}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Détails de la dépense</CardTitle>
              <CardDescription>
                {expense.description || "Aucune description"}
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Montant principal */}
        <div className="text-center p-6 bg-primary/5 rounded-lg">
          <div className="text-3xl font-bold text-primary">
            {Number(expense.amount).toLocaleString("fr-FR")} MAD
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Montant de la dépense
          </div>
        </div>

        <Separator />

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">
                  {format(new Date(expense.expense_date), "dd MMMM yyyy", { locale: fr })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Projet</div>
                <div className="font-medium">{expense.projects?.name || "Non défini"}</div>
                {expense.projects?.client && (
                  <div className="text-sm text-muted-foreground">
                    Client: {expense.projects.client}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Type de dépense</div>
                <Badge variant="outline">
                  {expense.expense_types?.name || "Non défini"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {expense.suppliers && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Fournisseur</div>
                  <div className="font-medium">{expense.suppliers.name}</div>
                </div>
              </div>
            )}

            {expense.invoice_reference && (
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Référence facture</div>
                  <div className="font-medium">{expense.invoice_reference}</div>
                </div>
              </div>
            )}

            {expense.category && (
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Catégorie</div>
                  <div className="font-medium">{expense.category}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {expense.description && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{expense.description}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Métadonnées */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Créé le: {format(new Date(expense.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</div>
          <div>Modifié le: {format(new Date(expense.updated_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</div>
        </div>
      </CardContent>
    </Card>
  );
}