-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense types table
CREATE TABLE public.expense_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  expense_type_id UUID NOT NULL REFERENCES public.expense_types(id),
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a business app)
CREATE POLICY "Enable read access for all users" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.expense_types FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.expense_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.expense_types FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.expense_types FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.suppliers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.expenses FOR DELETE USING (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense types
INSERT INTO public.expense_types (name, code, description) VALUES 
  ('NDF', 'NDF', 'Notes de frais'),
  ('Achats', 'ACH', 'Achats et accessoires'),
  ('Main-d''œuvre', 'MO', 'Main-d''œuvre'),
  ('Sous-traitance', 'ST', 'Sous-traitance'),
  ('Production interne', 'PI', 'Production interne');

-- Create indexes for better performance
CREATE INDEX idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_expense_type_id ON public.expenses(expense_type_id);
CREATE INDEX idx_expenses_supplier_id ON public.expenses(supplier_id);