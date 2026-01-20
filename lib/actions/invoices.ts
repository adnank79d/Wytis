'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
    gst_rate: z.number().min(0, "GST Rate must be >= 0"),
});

const CreateInvoiceSchema = z.object({
    customer_id: z.string().optional(),
    customer_name: z.string().min(1, "Customer Name is required"),
    invoice_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
    status: z.enum(['draft', 'issued']),
});

export type CreateInvoiceState = {
    errors?: {
        customer_name?: string[];
        invoice_date?: string[];
        items?: string[];
        formErrors?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: CreateInvoiceState, formData: FormData) {
    const supabase = await createClient();

    // Parse Payload manually because of nested items array structure in FormData
    // Usually standard formData.get() is hard for arrays. 
    // We expect the client to send a JSON string for 'items' or handle it structured.
    // For simplicity, let's assume we pass the raw object if we were using client components directly calling this, 
    // but if adhering to strict form actions:

    // Simplification: We'll accept a JSON string for items for now to avoid complexity of parsing `items[0].description` etc.
    const rawItems = formData.get('items') as string;
    let items;
    try {
        items = JSON.parse(rawItems);
    } catch {
        return { message: 'Invalid items data' };
    }

    const validatedFields = CreateInvoiceSchema.safeParse({
        customer_id: formData.get('customer_id') || undefined,
        customer_name: formData.get('customer_name'),
        invoice_date: formData.get('invoice_date'),
        status: formData.get('status'),
        items: items,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customer_id, customer_name, invoice_date, status, items: validItems } = validatedFields.data;

    // 1. Get User Business Info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized' };

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .limit(1)
        .single();

    if (!membership) return { message: 'No business found' };

    // 1.5 Enforce Billing Limits
    const { getBillingCapabilities } = await import('@/lib/billing/capabilities');
    const capabilities = await getBillingCapabilities(membership.business_id);
    if (!capabilities.canCreateInvoice) {
        return { message: capabilities.reason || 'Plan limit reached.' };
    }

    // 2. Generate Invoice Number (Simple sequential logic or random for now)
    // In real app, we query max number. For MVP, we use a timestamp-based or simple random string.
    const invoice_number = `INV-${Date.now().toString().slice(-6)}`;

    // 3. Calculate Totals
    const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const gst_amount = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.gst_rate / 100)), 0);
    const total_amount = subtotal + gst_amount;

    // 4. Insert Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            business_id: membership.business_id,
            invoice_number,
            customer_name, // redundant if customer_id exists but useful for snapshot
            // customer_id: customer_id || null, // Temporary fix: forcing name-only to prevent schema mismatch errors if migration is pending
            invoice_date,
            subtotal,
            gst_amount,
            total_amount,
            status
        })
        .select()
        .limit(1)
        .limit(1)
        .single();

    if (invoiceError) {
        console.error('Invoice Insert Error', invoiceError);
        return { message: 'Database Error: Failed to create invoice.' };
    }

    // 5. Insert Items
    const itemsData = validItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
        line_total: (item.quantity * item.unit_price) * (1 + item.gst_rate / 100)
    }));

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

    if (itemsError) {
        // Warning: Transaction partial failure risk here if not wrapped in RPC? 
        // Supabase REST doesn't support transactions easily without RPC.
        // For MVP, we assume success or manual cleanup.
        console.error('Invoice Items Insert Error', itemsError);
        return { message: `Database Error: ${itemsError.message} (${itemsError.details})` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/invoices');
    redirect('/dashboard');
}

export async function getCustomers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: membership } = await supabase.from('memberships').select('business_id').eq('user_id', user.id).single();
    if (!membership) return [];

    const { data } = await supabase
        .from('customers')
        .select('id, name, tax_id')
        .eq('business_id', membership.business_id)
        .order('name');

    return data || [];
}

export async function markInvoiceAsPaid(invoiceId: string, amount: number) {
    const supabase = await createClient();

    // 1. Authenticate and Get Business Context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized' };

    const { data: membership } = await supabase.from('memberships').select('business_id').eq('user_id', user.id).single();
    if (!membership) return { message: 'No business found' };

    // 2. Fetch Invoice to Verify Ownership and Current Status
    const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('business_id', membership.business_id)
        .limit(1)
        .single();

    if (!invoice) return { message: 'Invoice not found' };
    if (invoice.status === 'paid') return { message: 'Invoice is already paid' };

    // 3. Update Invoice Status
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

    if (updateError) return { message: 'Failed to update status' };

    // 4. Create Accounting Transaction
    // Concept: Debit Bank (Asset +), Credit Accounts Receivable (Asset -)
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            business_id: membership.business_id,
            description: `Payment for Invoice #${invoice.invoice_number}`,
            date: new Date().toISOString(),
            source_type: 'payment', // assuming this is a valid type or 'journal'
            source_id: invoiceId
        })
        .select()
        .limit(1)
        .single();

    if (txError) {
        console.error('Transaction Error', txError);
        // Partial failure risk: Invoice updated but no ledger entry. 
        // In prod, revert invoice status or use RPC.
        return { message: 'Invoice marked paid, but accounting entry failed.' };
    }

    // 5. Create Ledger Entries
    const ledgerEntries = [
        {
            business_id: membership.business_id,
            transaction_id: transaction.id,
            account_name: 'Bank', // Simplified: In real app, select which bank account
            debit: amount,
            credit: 0
        },
        {
            business_id: membership.business_id,
            transaction_id: transaction.id,
            account_name: 'Accounts Receivable',
            debit: 0,
            credit: amount
        }
    ];

    const { error: ledgerError } = await supabase.from('ledger_entries').insert(ledgerEntries);

    if (ledgerError) {
        console.error('Ledger Error', ledgerError);
        return { message: 'Payment recorded, but ledger update failed.' };
    }

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return { success: true };
}
