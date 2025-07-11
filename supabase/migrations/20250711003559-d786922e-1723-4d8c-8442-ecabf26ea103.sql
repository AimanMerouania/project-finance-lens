-- Add missing fields to projects table
ALTER TABLE public.projects 
ADD COLUMN budget NUMERIC,
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN client TEXT;

-- Add missing fields to expenses table  
ALTER TABLE public.expenses
ADD COLUMN invoice_reference TEXT,
ADD COLUMN category TEXT;