import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportData {
  projectName: string;
  date: string;
  supplier: string;
  expenseType: string;
  amount: number;
  description?: string;
}

export function ExcelImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    total: number;
    details: { success: ImportData[]; errors: string[] };
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setProgress(25);

      // Mapper les données du fichier Excel
      const mappedData: ImportData[] = jsonData.map((row: any) => ({
        projectName: row["Nom du projet"] || row["Project Name"] || row["Projet"] || "",
        date: row["Date"] || "",
        supplier: row["Fournisseur"] || row["Supplier"] || "",
        expenseType: row["Type de dépense"] || row["Type"] || "",
        amount: parseFloat(row["Montant"] || row["Amount"] || "0"),
        description: row["Description"] || "",
      }));

      setProgress(50);

      // Traiter l'import
      const results = await processImport(mappedData);
      setImportResults(results);
      setProgress(100);

      if (results.success > 0) {
        toast({
          title: "Import terminé",
          description: `${results.success} dépenses importées avec succès.`,
        });

        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }

    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible de lire le fichier Excel.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, queryClient]);

  const processImport = async (data: ImportData[]) => {
    const results = {
      success: 0,
      errors: 0,
      total: data.length,
      details: { success: [] as ImportData[], errors: [] as string[] },
    };

    // Récupérer les projets et types de dépenses existants
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("id, name");
    
    const { data: expenseTypes } = await supabase
      .from("expense_types")
      .select("id, name");

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        // Validation des données
        if (!item.projectName || !item.date || !item.expenseType || !item.amount) {
          results.errors++;
          results.details.errors.push(`Ligne ${i + 2}: Données manquantes`);
          continue;
        }

        // Trouver ou créer le projet
        let project = existingProjects?.find(p => 
          p.name.toLowerCase() === item.projectName.toLowerCase()
        );

        if (!project) {
          const { data: newProject, error: projectError } = await supabase
            .from("projects")
            .insert([{ name: item.projectName }])
            .select("id, name")
            .single();

          if (projectError) throw projectError;
          project = newProject;
          existingProjects?.push(project);
        }

        // Trouver le type de dépense
        const expenseType = expenseTypes?.find(t => 
          t.name.toLowerCase() === item.expenseType.toLowerCase()
        );

        if (!expenseType) {
          results.errors++;
          results.details.errors.push(`Ligne ${i + 2}: Type de dépense "${item.expenseType}" non trouvé`);
          continue;
        }

        // Trouver ou créer le fournisseur si fourni
        let supplierId = null;
        if (item.supplier && item.supplier.trim()) {
          const { data: existingSupplier } = await supabase
            .from("suppliers")
            .select("id")
            .ilike("name", item.supplier)
            .single();

          if (existingSupplier) {
            supplierId = existingSupplier.id;
          } else {
            const { data: newSupplier, error: supplierError } = await supabase
              .from("suppliers")
              .insert([{ name: item.supplier }])
              .select("id")
              .single();

            if (!supplierError && newSupplier) {
              supplierId = newSupplier.id;
            }
          }
        }

        // Créer la dépense
        const expenseData = {
          project_id: project.id,
          expense_type_id: expenseType.id,
          supplier_id: supplierId,
          amount: item.amount,
          expense_date: new Date(item.date).toISOString().split('T')[0],
          description: item.description || null,
        };

        const { error: expenseError } = await supabase
          .from("expenses")
          .insert([expenseData]);

        if (expenseError) throw expenseError;

        results.success++;
        results.details.success.push(item);

      } catch (error) {
        results.errors++;
        results.details.errors.push(`Ligne ${i + 2}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }

      // Mettre à jour le progrès
      setProgress(50 + ((i + 1) / data.length) * 50);
    }

    return results;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const resetImport = () => {
    setImportResults(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Format du fichier Excel
          </CardTitle>
          <CardDescription>
            Votre fichier Excel doit contenir les colonnes suivantes :
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Badge variant="outline">Nom du projet</Badge>
            <Badge variant="outline">Date</Badge>
            <Badge variant="outline">Fournisseur</Badge>
            <Badge variant="outline">Type de dépense</Badge>
            <Badge variant="outline">Montant</Badge>
            <Badge variant="outline">Description (optionnel)</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import du fichier</CardTitle>
          <CardDescription>
            Glissez-déposez votre fichier Excel ou cliquez pour le sélectionner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isProcessing && !importResults && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Déposez le fichier ici...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">
                    Glissez-déposez un fichier Excel ici
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour sélectionner un fichier (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium">Import en cours...</div>
                <div className="text-sm text-muted-foreground">
                  Traitement des données Excel
                </div>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm text-muted-foreground">
                {progress}% terminé
              </div>
            </div>
          )}

          {importResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">Résultats de l'import</div>
                <Button variant="outline" size="sm" onClick={resetImport}>
                  <X className="h-4 w-4 mr-2" />
                  Nouvel import
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {importResults.success}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Succès
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {importResults.errors}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Erreurs
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {importResults.total}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importResults.details.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Erreurs détaillées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {importResults.details.errors.map((error, index) => (
                        <li key={index} className="text-red-600">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}