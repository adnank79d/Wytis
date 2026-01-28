-- Create payroll_runs table
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
    year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'paid')),
    total_amount numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id, month, year)
);

-- Create payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    basic_salary numeric NOT NULL DEFAULT 0,
    allowances numeric NOT NULL DEFAULT 0,
    deductions numeric NOT NULL DEFAULT 0,
    net_salary numeric GENERATED ALWAYS AS (basic_salary + allowances - deductions) STORED,
    
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    payment_date date,
    
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_runs
CREATE POLICY "Users can manage payroll runs of their business" ON public.payroll_runs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = payroll_runs.business_id
            AND memberships.user_id = auth.uid()
        )
    );

-- RLS Policies for payslips
CREATE POLICY "Users can manage payslips of their business" ON public.payslips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = payslips.business_id
            AND memberships.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_business ON public.payroll_runs(business_id);
CREATE INDEX IF NOT EXISTS idx_payslips_run_id ON public.payslips(run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id);
