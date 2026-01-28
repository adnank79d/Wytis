-- Enhanced CRM columns for customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create customer_interactions table
CREATE TABLE IF NOT EXISTS public.customer_interactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'other')),
    details text,
    interaction_date timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Track which staff logged it
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage interactions of their business" ON public.customer_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = customer_interactions.business_id
            AND memberships.user_id = auth.uid()
        )
    );

-- Trigger to update last_contacted_at on new interaction
CREATE OR REPLACE FUNCTION public.update_last_contacted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.customers
    SET last_contacted_at = NEW.interaction_date,
        updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_interaction_created ON public.customer_interactions;
CREATE TRIGGER on_interaction_created
    AFTER INSERT ON public.customer_interactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_contacted();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON public.customer_interactions(customer_id);
