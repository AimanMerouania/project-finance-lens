import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const revenueSchema = z.object({
  project_id: z.string().min(1, "Le projet est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  revenue_date: z.date({
    required_error: "La date est requise",
  }),
  description: z.string().optional(),
  invoice_reference: z.string().optional(),
  payment_status: z.enum(["pending", "received", "overdue"]).default("pending"),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface RevenueFormProps {
  onSuccess?: () => void;
  initialData?: Partial<RevenueFormData>;
  revenueId?: string;
}

export function RevenueForm({ onSuccess, initialData, revenueId }: RevenueFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      project_id: initialData?.project_id || "",
      amount: initialData?.amount || 0,
      revenue_date: initialData?.revenue_date || new Date(),
      description: initialData?.description || "",
      invoice_reference: initialData?.invoice_reference || "",
      payment_status: initialData?.payment_status || "pending",
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const createRevenueMutation = useMutation({
    mutationFn: async (data: RevenueFormData) => {
      const { error } = await supabase
        .from("revenues")
        .insert({
          project_id: data.project_id,
          amount: data.amount,
          revenue_date: data.revenue_date.toISOString().split('T')[0],
          description: data.description,
          invoice_reference: data.invoice_reference,
          payment_status: data.payment_status,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({
        title: "Succès",
        description: "Le revenu a été ajouté avec succès",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRevenueMutation = useMutation({
    mutationFn: async (data: RevenueFormData) => {
      const { error } = await supabase
        .from("revenues")
        .update({
          ...data,
          revenue_date: data.revenue_date.toISOString().split('T')[0],
        })
        .eq("id", revenueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({
        title: "Succès",
        description: "Le revenu a été modifié avec succès",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RevenueFormData) => {
    if (revenueId) {
      updateRevenueMutation.mutate(data);
    } else {
      createRevenueMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projet</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant (MAD)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revenue_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de revenu</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut de paiement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="received">Reçu</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="invoice_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence facture</FormLabel>
              <FormControl>
                <Input placeholder="REF-2024-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description du revenu..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createRevenueMutation.isPending || updateRevenueMutation.isPending}
          className="w-full"
        >
          {revenueId ? "Modifier le revenu" : "Ajouter le revenu"}
        </Button>
      </form>
    </Form>
  );
}