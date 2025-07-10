import { ExcelImport } from "@/components/import/ExcelImport";

const Import = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import Excel</h1>
        <p className="text-muted-foreground">
          Importez vos données financières depuis un fichier Excel
        </p>
      </div>

      <ExcelImport />
    </div>
  );
};

export default Import;