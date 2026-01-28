-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    category text NOT NULL CHECK (category IN ('Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Software', 'Travel', 'Other')),
    payment_method text NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Debit Card')),
    receipt_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view expenses of their business" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = expenses.business_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create expenses for their business" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = expenses.business_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expenses of their business" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = expenses.business_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expenses of their business" ON public.expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = expenses.business_id
            AND memberships.user_id = auth.uid()
        )
    );

-- Trigger to handle accounting (Ledger Entries)
CREATE OR REPLACE FUNCTION public.handle_new_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
    v_asset_account text;
BEGIN
    -- Determine Asset Account based on payment method
    IF NEW.payment_method = 'Cash' THEN
        v_asset_account := 'Cash';
    ELSE
        v_asset_account := 'Bank';
    END IF;

    -- 1. Create Transaction
    INSERT INTO public.transactions (
        business_id,
        source_type,
        source_id,
        amount,
        transaction_type,
        transaction_date
    ) VALUES (
        NEW.business_id,
        'expense',
        NEW.id,
        NEW.amount,
        'debit',
        NEW.expense_date
    ) RETURNING id INTO v_transaction_id;

    -- 2. Create Ledger Entries
    -- Entry 1: Debit the Expense Category (e.g., 'Marketing') -> Increase Expense
    INSERT INTO public.ledger_entries (
        business_id,
        transaction_id,
        account_name,
        debit,
        credit
    ) VALUES (
        NEW.business_id,
        v_transaction_id,
        NEW.category,
        NEW.amount,
        0
    );

    -- Entry 2: Credit the Asset Account (Cash/Bank) -> Decrease Asset
    INSERT INTO public.ledger_entries (
        business_id,
        transaction_id,
        account_name,
        debit,
        credit
    ) VALUES (
        NEW.business_id,
        v_transaction_id,
        v_asset_account,
        0,
        NEW.amount
    );

    RETURN NEW;
END;
$$;

-- Register Trigger
DROP TRIGGER IF EXISTS on_expense_created ON public.expenses;
CREATE TRIGGER on_expense_created
    AFTER INSERT ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_expense();

-- Handle Expense Deletion (Reversal)
CREATE OR REPLACE FUNCTION public.handle_expense_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete associated transaction (Cascade will handle ledger entries)
    DELETE FROM public.transactions
    WHERE source_id = OLD.id AND source_type = 'expense';
    
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_expense_deleted ON public.expenses;
CREATE TRIGGER on_expense_deleted
    BEFORE DELETE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_expense_deleted();

-- UPDATE PROFIT & LOSS VIEW TO INCLUDE DYNAMIC EXPENSE CATEGORIES
CREATE OR REPLACE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
SELECT
  business_id,
  account_name,
  CASE
    WHEN account_name IN ('Sales', 'Other Income') THEN 'Income'
    ELSE 'Expense'
  END as category,
  SUM(credit - debit) as net_amount
FROM public.ledger_entries
WHERE account_name NOT IN ('Cash', 'Bank', 'Accounts Receivable', 'Accounts Payable', 'GST Payable', 'Capital', 'Retained Earnings', 'Inventory', 'GST Input Credit')
GROUP BY business_id, account_name;
