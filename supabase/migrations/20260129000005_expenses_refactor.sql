-- Refactor Expenses to support Draft -> Posted workflow
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'voided'));

-- Drop the old insert trigger (immediate posting)
DROP TRIGGER IF EXISTS on_expense_created ON public.expenses;

-- Rename and update the function to handle posting
CREATE OR REPLACE FUNCTION public.handle_expense_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
    v_asset_account text;
BEGIN
    -- Only proceed if status changed to 'posted'
    -- (Strictly speaking the trigger condition handles this, but good safety)
    
    -- Determine Asset Account or Payable based on payment status/method
    -- For now, we assume simple "Paid" flow if payment_method is set.
    -- Future: If unpaid, credit Accounts Payable.
    
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
    -- Entry 1: Debit the Expense Category
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

    -- Entry 2: Credit the Asset Account
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

-- Create new trigger for UPDATE
DROP TRIGGER IF EXISTS on_expense_posted ON public.expenses;
CREATE TRIGGER on_expense_posted
    AFTER UPDATE ON public.expenses
    FOR EACH ROW
    WHEN (NEW.status = 'posted' AND OLD.status != 'posted')
    EXECUTE FUNCTION public.handle_expense_posted();
