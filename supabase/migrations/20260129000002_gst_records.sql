-- Create gst_records table for granular tax tracking
CREATE TABLE IF NOT EXISTS public.gst_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    tax_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    gst_type VARCHAR(10) NOT NULL CHECK (gst_type IN ('CGST', 'SGST', 'IGST', 'CESS')),
    rate NUMERIC(5,2) NOT NULL, -- Tax Rate (e.g., 9.00 for CGST)
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.gst_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gst records for their business"
    ON public.gst_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.user_id = auth.uid()
            AND memberships.business_id = gst_records.business_id
        )
    );

-- Index for Report Generation
CREATE INDEX idx_gst_records_period ON public.gst_records(business_id, tax_period, gst_type);
