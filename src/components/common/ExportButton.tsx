import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExportData {
  type: "expenses" | "projects";
  filename?: string;
}

export function ExportButton({ type, filename }: ExportData) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: [`${type}-export`],
    queryFn: async () => {
      if (type === "expenses") {
        const { data, error } = await supabase
          .from("expenses")
          .select(`
            *,
            projects(name, client),
            expense_types(name),
            suppliers(name)
          `)
          .order("expense_date", { ascending: false });

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }
    },
    enabled: false, // Only fetch when export is triggered
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let exportData;
      
      if (type === "expenses") {
        const { data, error } = await supabase
          .from("expenses")
          .select(`
            expense_date,
            amount,
            description,
            invoice_reference,
            category,
            projects(name, client),
            expense_types(name),
            suppliers(name)
          `)
          .order("expense_date", { ascending: false });

        if (error) throw error;

        exportData = data.map(expense => ({
          "Date": new Date(expense.expense_date).toLocaleDateString("fr-FR"),
          "Montant (€)": Number(expense.amount),
          "Description": expense.description || "",
          "Projet": expense.projects?.name || "",
          "Client": expense.projects?.client || "",
          "Type de dépense": expense.expense_types?.name || "",
          "Fournisseur": expense.suppliers?.name || "",
          "Référence facture": expense.invoice_reference || "",
          "Catégorie": expense.category || ""
        }));
      } else {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        exportData = data.map(project => ({
          "Nom": project.name,
          "Description": project.description || "",
          "Client": project.client || "",
          "Budget (€)": project.budget ? Number(project.budget) : "",
          "Date de début": project.start_date ? new Date(project.start_date).toLocaleDateString("fr-FR") : "",
          "Date de fin": project.end_date ? new Date(project.end_date).toLocaleDateString("fr-FR") : "",
          "Statut": project.status || "",
          "Date de création": new Date(project.created_at).toLocaleDateString("fr-FR")
        }));
      }

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === "expenses" ? "Dépenses" : "Projets");

      // Télécharger le fichier
      const defaultFilename = `netmar-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename || defaultFilename);

      toast({
        title: "Export réussi",
        description: `Les ${type === "expenses" ? "dépenses" : "projets"} ont été exportées avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isExporting ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {isExporting ? "Export..." : `Exporter ${type === "expenses" ? "dépenses" : "projets"}`}
    </Button>
  );
}