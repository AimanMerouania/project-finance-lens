import { useState } from "react";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectForm } from "@/components/projects/ProjectForm";
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

const Projects = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets et suivez leurs performances
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton type="projects" />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="transition-all duration-200 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau projet</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau projet à votre portefeuille.
                </DialogDescription>
              </DialogHeader>
              <ProjectForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ProjectsList />
    </div>
  );
};

export default Projects;