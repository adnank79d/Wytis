-- Purchase Order Schema
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT, -- Vendors are in customers table with type/tag
    po_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'partially_received', 'closed', 'voided')) DEFAULT 'draft',
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Items
CREATE TABLE IF NOT EXISTS public.po_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.inventory_products(id) ON DELETE SET NULL, -- Improved reference
    description TEXT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Goods Receipt Note (GRN) Schema
CREATE TABLE IF NOT EXISTS public.grn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    grn_number TEXT NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- GRN Items (Tracks what was actually received)
CREATE TABLE IF NOT EXISTS public.grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.grn(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL REFERENCES public.po_items(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(15,2) NOT NULL CHECK (quantity_received >= 0)
);

-- RLS Policies
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;

-- Simple RLS Wrapper
CREATE POLICY "Access POs" ON public.purchase_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.business_id = purchase_orders.business_id)
);
CREATE POLICY "Access PO Items" ON public.po_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po JOIN public.memberships m ON po.business_id = m.business_id WHERE po.id = po_items.po_id AND m.user_id = auth.uid())
);
CREATE POLICY "Access GRNs" ON public.grn FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.business_id = grn.business_id)
);
CREATE POLICY "Access GRN Items" ON public.grn_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.grn g JOIN public.memberships m ON g.business_id = m.business_id WHERE g.id = grn_items.grn_id AND m.user_id = auth.uid())
);
