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
  designation: string;
  month: string;
  amount: number;
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

    console.log("Début de l'import du fichier:", file.name);
    setIsProcessing(true);
    setProgress(0);
    setImportResults(null);

    try {
      // Lire le fichier Excel
      console.log("Lecture du fichier Excel...");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Données brutes du fichier Excel:", jsonData);
      setProgress(25);

      // Transformer les données du format pivot vers un format linéaire
      const mappedData: ImportData[] = [];
      const monthColumns = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      
      jsonData.forEach((row: any, index) => {
        console.log(`Traitement ligne ${index + 1}:`, row);
        const projectName = row["Projet"] || "";
        const designation = row["Desgnation"] || row["Designation"] || "";
        
        // Pour chaque mois, créer une entrée si il y a un montant
        monthColumns.forEach((month) => {
          const amount = parseFloat(row[month] || "0");
          if (amount > 0) {
            mappedData.push({
              projectName,
              designation,
              month,
              amount
            });
            console.log(`Ajouté: ${projectName} - ${designation} - ${month}: ${amount}`);
          }
        });
      });

      console.log("Données transformées:", mappedData);
      setProgress(50);

      if (mappedData.length === 0) {
        toast({
          title: "Aucune donnée trouvée",
          description: "Aucun montant valide trouvé dans le fichier Excel. Vérifiez le format.",
          variant: "destructive",
        });
        return;
      }

      // Traiter l'import
      console.log("Début du processus d'import vers Supabase...");
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
      } else if (results.errors > 0) {
        toast({
          title: "Erreurs lors de l'import",
          description: `${results.errors} erreurs détectées. Consultez les détails.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Impossible de lire le fichier Excel.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, queryClient]);

  const processImport = async (data: ImportData[]) => {
    console.log("Début processImport avec", data.length, "éléments");
    const results = {
      success: 0,
      errors: 0,
      total: data.length,
      details: { success: [] as ImportData[], errors: [] as string[] },
    };

    try {
      // Récupérer les projets et types de dépenses existants
      console.log("Récupération des projets existants...");
      const { data: existingProjects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name");
      
      if (projectsError) {
        console.error("Erreur lors de la récupération des projets:", projectsError);
        throw projectsError;
      }
      console.log("Projets existants:", existingProjects);
      
      console.log("Récupération des types de dépenses...");
      const { data: expenseTypes, error: expenseTypesError } = await supabase
        .from("expense_types")
        .select("id, name");

      if (expenseTypesError) {
        console.error("Erreur lors de la récupération des types de dépenses:", expenseTypesError);
        throw expenseTypesError;
      }
      console.log("Types de dépenses existants:", expenseTypes);

      // Créer les mappings pour les mois
      const monthToNumber: { [key: string]: string } = {
        "Janvier": "01",
        "Février": "02", 
        "Mars": "03",
        "Avril": "04",
        "Mai": "05",
        "Juin": "06",
        "Juillet": "07",
        "Août": "08",
        "Septembre": "09",
        "Octobre": "10",
        "Novembre": "11",
        "Décembre": "12"
      };

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        console.log(`Traitement item ${i + 1}/${data.length}:`, item);
        
        try {
          // Validation des données
          if (!item.projectName || !item.designation || !item.month || !item.amount) {
            results.errors++;
            results.details.errors.push(`Ligne ${i + 1}: Données manquantes`);
            console.log(`Erreur - données manquantes pour item ${i + 1}`);
            continue;
          }

          // Trouver ou créer le projet
          let project = existingProjects?.find(p => 
            p.name.toLowerCase() === item.projectName.toLowerCase()
          );

          if (!project) {
            console.log(`Création du projet: ${item.projectName}`);
            const { data: newProject, error: projectError } = await supabase
              .from("projects")
              .insert([{ name: item.projectName }])
              .select("id, name")
              .single();

            if (projectError) throw projectError;
            project = newProject;
            existingProjects?.push(project);
            console.log("Projet créé:", project);
          }

          // Trouver ou créer le type de dépense
          let expenseType = expenseTypes?.find(t => 
            t.name.toLowerCase() === item.designation.toLowerCase()
          );

          if (!expenseType) {
            console.log(`Création du type de dépense: ${item.designation}`);
            // Créer le type de dépense s'il n'existe pas
            const { data: newExpenseType, error: expenseTypeError } = await supabase
              .from("expense_types")
              .insert([{ 
                name: item.designation,
                code: item.designation.toUpperCase().replace(/\s+/g, '_')
              }])
              .select("id, name")
              .single();

            if (expenseTypeError) throw expenseTypeError;
            expenseType = newExpenseType;
            expenseTypes?.push(expenseType);
            console.log("Type de dépense créé:", expenseType);
          }

          // Générer une date (1er du mois de l'année courante)
          const currentYear = new Date().getFullYear();
          const monthNumber = monthToNumber[item.month];
          const expenseDate = `${currentYear}-${monthNumber}-01`;

          // Créer la dépense
          const expenseData = {
            project_id: project.id,
            expense_type_id: expenseType.id,
            amount: item.amount,
            expense_date: expenseDate,
            description: `Import ${item.month} ${currentYear}`,
          };

          console.log("Création de la dépense:", expenseData);
          const { error: expenseError } = await supabase
            .from("expenses")
            .insert([expenseData]);

          if (expenseError) throw expenseError;

          results.success++;
          results.details.success.push(item);
          console.log(`Succès pour item ${i + 1}`);

        } catch (error) {
          console.error(`Erreur pour item ${i + 1}:`, error);
          results.errors++;
          results.details.errors.push(`Ligne ${i + 1}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        }

        // Mettre à jour le progrès
        setProgress(50 + ((i + 1) / data.length) * 50);
      }

    } catch (error) {
      console.error("Erreur globale dans processImport:", error);
      results.errors = data.length;
      results.details.errors.push(`Erreur générale: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
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
            Votre fichier Excel doit avoir ce format avec les projets en lignes et les mois en colonnes :
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Structure attendue :</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <Badge variant="outline">Projet</Badge>
                <Badge variant="outline">Desgnation</Badge>
                <Badge variant="outline">Janvier</Badge>
                <Badge variant="outline">Février</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                ... Mars, Avril, Mai, Juin, Juillet, Août, Septembre, Octobre, Novembre, Décembre
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Exemple :</strong> Chaque ligne représente un projet avec sa désignation (FOURNISSEUR, NDF, etc.) 
                et les montants pour chaque mois. Les cellules vides ou avec 0 seront ignorées.
              </p>
            </div>
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
                  Transformation et traitement des données Excel
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