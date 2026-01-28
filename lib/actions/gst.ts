"use server";

import { createClient } from "@/lib/supabase/server";

export type GSTSummary = {
    outputTax: number;
    inputTax: number;
    netPayable: number;
    totalSales: number;
    totalPurchases: number;
};

export type GSTRRow = {
    id: string;
    date: string;
    partyName: string; // Customer or Supplier
    gstin: string | null;
    taxableValue: number;
    taxAmount: number;
    totalValue: number;
    type: 'B2B' | 'B2C' | 'Expense';
};

async function getBusinessId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select(`business_id`)
        .eq('user_id', user.id)
        .limit(1)
        .single();

    return membership?.business_id || null;
}

export async function getGSTSummary(month: number, year: number): Promise<GSTSummary> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { outputTax: 0, inputTax: 0, netPayable: 0, totalSales: 0, totalPurchases: 0 };

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // OUTPUT TAX (From Invoices)
    const { data: outputData } = await supabase
        .from('invoices')
        .select('gst_amount, subtotal')
        .eq('business_id', businessId)
        .in('status', ['paid', 'issued'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

    const outputTax = outputData?.reduce((sum, i) => sum + Number(i.gst_amount), 0) || 0;
    const totalSales = outputData?.reduce((sum, i) => sum + Number(i.subtotal), 0) || 0; // Taxable Value

    // INPUT TAX (From Expenses)
    const { data: inputData } = await supabase
        .from('expenses')
        .select('gst_amount, amount') // amount in expenses usually includes tax, so we might need back calc if not stored separately. But we added gst_amount.
        .eq('business_id', businessId)
        .gt('gst_amount', 0)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    const inputTax = inputData?.reduce((sum, e) => sum + Number(e.gst_amount), 0) || 0;
    // For purchases taxable value = (amount - gst_amount) (naive approx)
    const totalPurchases = inputData?.reduce((sum, e) => sum + (Number(e.amount) - Number(e.gst_amount)), 0) || 0;

    return {
        outputTax,
        inputTax,
        netPayable: outputTax - inputTax,
        totalSales,
        totalPurchases
    };
}

export async function getGSTR1Data(month: number, year: number): Promise<GSTRRow[]> {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Assuming we use the view or just raw query
    // Querying raw invoices for simplicity unless view is strictly needed
    const { data } = await supabase
        .from('invoices')
        .select(`
            id,
            invoice_date,
            customer_name,
            invoice_number,
            subtotal,
            gst_amount,
            total_amount,
            customer:customers(gst_number)
        `)
        .eq('business_id', businessId)
        .in('status', ['paid', 'issued'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date', { ascending: false });

    return (data || []).map((inv: any) => ({
        id: inv.id,
        date: inv.invoice_date,
        partyName: inv.customer_name,
        gstin: inv.customer?.gst_number || 'N/A',
        taxableValue: Number(inv.subtotal),
        taxAmount: Number(inv.gst_amount),
        totalValue: Number(inv.total_amount),
        type: inv.customer?.gst_number ? 'B2B' : 'B2C'
    }));
}

export async function getGSTR2Data(month: number, year: number): Promise<GSTRRow[]> {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId)
        .gt('gst_amount', 0)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

    return (data || []).map((exp: any) => ({
        id: exp.id,
        date: exp.expense_date,
        partyName: exp.description, // Often supplier name is in desc or we should add supplier_name col. Using desc for now.
        gstin: exp.supplier_gstin || 'N/A',
        taxableValue: Number(exp.amount) - Number(exp.gst_amount),
        taxAmount: Number(exp.gst_amount),
        totalValue: Number(exp.amount),
        type: 'Expense'
    }));
}
