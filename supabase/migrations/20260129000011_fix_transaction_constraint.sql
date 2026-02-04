-- Fix Transaction Check Constraint
-- The 'handle_invoice_voided' trigger attempts to insert source_type='void', 
-- but the original table constraint only allowed ('invoice', 'expense', 'manual').

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_source_type_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_source_type_check 
CHECK (source_type IN ('invoice', 'expense', 'manual', 'void'));

-- Reload schema cache ensuring the database allows the new value
NOTIFY pgrst, 'reload schema';
