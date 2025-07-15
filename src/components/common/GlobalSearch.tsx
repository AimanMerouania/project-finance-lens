import { useState, useRef, useEffect } from "react";
import { Search, FileText, Folder, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["global-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { expenses: [], projects: [] };

      const [expensesResult, projectsResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("id, description, amount, expense_date, projects(name), expense_types(name)")
          .or(`description.ilike.%${debouncedSearch}%, projects.name.ilike.%${debouncedSearch}%`)
          .limit(5),
        supabase
          .from("projects")
          .select("id, name, description, client")
          .or(`name.ilike.%${debouncedSearch}%, description.ilike.%${debouncedSearch}%, client.ilike.%${debouncedSearch}%`)
          .limit(5),
      ]);

      return {
        expenses: expensesResult.data || [],
        projects: projectsResult.data || [],
      };
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const handleSelectItem = (type: string, id: string) => {
    setOpen(false);
    setSearchValue("");
    
    if (type === "expense") {
      navigate("/expenses");
    } else if (type === "project") {
      navigate("/projects");
    }
  };

  // Raccourci clavier Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[300px] justify-start text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
        >
          <Search className="mr-2 h-4 w-4" />
          Rechercher...
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Rechercher projets, dépenses..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Recherche en cours..." : "Aucun résultat trouvé."}
            </CommandEmpty>
            
            {searchResults?.projects && searchResults.projects.length > 0 && (
              <CommandGroup heading="Projets">
                {searchResults.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => handleSelectItem("project", project.id)}
                    className="cursor-pointer"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{project.name}</span>
                      {project.client && (
                        <span className="text-xs text-muted-foreground">{project.client}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {searchResults?.expenses && searchResults.expenses.length > 0 && (
              <CommandGroup heading="Dépenses">
                {searchResults.expenses.map((expense) => (
                  <CommandItem
                    key={expense.id}
                    onSelect={() => handleSelectItem("expense", expense.id)}
                    className="cursor-pointer"
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {expense.description || expense.projects?.name || "Dépense"}
                      </span>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                         <span>{Number(expense.amount).toLocaleString("fr-FR")} MAD</span>
                         <span>•</span>
                         <span>{expense.expense_types?.name}</span>
                       </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}