import { useState } from "react";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExportButton } from "@/components/common/ExportButton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Expenses = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dépenses</h1>
          <p className="text-muted-foreground">
            Gérez toutes les dépenses de vos projets
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton type="expenses" />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="transition-all duration-200 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter une dépense</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle dépense pour un projet.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ExpensesList />
    </div>
  );
};

export default Expenses;