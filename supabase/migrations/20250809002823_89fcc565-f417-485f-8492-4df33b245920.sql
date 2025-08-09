-- Create revenues table for project revenue tracking
CREATE TABLE public.revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  revenue_date DATE NOT NULL,
  description TEXT,
  invoice_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

-- Create policies for revenues
CREATE POLICY "Enable read access for all users" 
ON public.revenues 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON public.revenues 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON public.revenues 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all users" 
ON public.revenues 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_revenues_updated_at
BEFORE UPDATE ON public.revenues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN comments TEXT;

-- Create budget alerts table
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_percentage NUMERIC DEFAULT 80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for budget alerts
CREATE POLICY "Enable read access for all users" 
ON public.budget_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON public.budget_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON public.budget_alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all users" 
ON public.budget_alerts 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_budget_alerts_updated_at
BEFORE UPDATE ON public.budget_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();