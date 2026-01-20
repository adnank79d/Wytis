-- Migration: 20240119000001_fix_invoice_items_rls
-- Description: Simplifies RLS on invoice_items to rely on parent invoice visibility.
-- Failure case: Complex joins in 'USING' clause for INSERT sometimes fail due to recursive RLS on joined tables.

--------------------------------------------------------------------------------
-- FIX RLS: INVOICE_ITEMS
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage invoice items of their business" ON public.invoice_items;

CREATE POLICY "Users can manage invoice items of their business"
  ON public.invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
    )
  );

-- Explanation:
-- Since 'invoices' table has its own RLS enforcing membership checks,
-- we can trust that if a user can SELECT the invoice (which they just created),
-- they are allowed to insert items for it.
-- This effectively inherits permissions from the parent Invoice.
