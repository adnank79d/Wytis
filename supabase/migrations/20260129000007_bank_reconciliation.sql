-- Bank Transactions (Raw Feed)
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_account_name TEXT NOT NULL, -- e.g., "HDFC Primary"
    transaction_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    reference_id TEXT, -- e.g., UTR number
    status TEXT NOT NULL CHECK (status IN ('unmatched', 'matched', 'ignored')) DEFAULT 'unmatched',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliation Matching Table
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_transaction_id UUID NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
    ledger_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    match_score INT, -- Optional: confidence score from AI matching
    matched_by UUID REFERENCES auth.users(id),
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_bank_match UNIQUE (bank_transaction_id), -- One bank tx can only match one system tx (simple 1:1 for now)
    CONSTRAINT unique_ledger_match UNIQUE (ledger_transaction_id)
);

-- RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access Bank Tx" ON public.bank_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.business_id = bank_transactions.business_id)
);

CREATE POLICY "Access Reconciliations" ON public.bank_reconciliations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.business_id = bank_reconciliations.business_id)
);
