'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const InvoiceItemSchema = z.object({
    product_id: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
    cost_price: z.coerce.number().min(0).default(0),
    gst_rate: z.number().min(0, "GST Rate must be >= 0"),
});

const CreateInvoiceSchema = z.object({
    customer_id: z.string().optional(),
    customer_name: z.string().min(1, "Customer Name is required"),
    invoice_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    due_date: z.string().optional(),
    items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
    status: z.enum(['draft', 'issued']),
    notes: z.string().optional(),
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

// ============================================================================
// HELPER: Get Business Context
// ============================================================================

async function getBusinessContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (!membership) return null;

    return { supabase, userId: user.id, businessId: membership.business_id, role: membership.role };
}

// ============================================================================
// HELPER: Generate Invoice Number (Sequential)
// ============================================================================

async function generateInvoiceNumber(supabase: any, businessId: string): Promise<string> {
    // Get the latest invoice number for this business
    const { data: latestInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Extract number from pattern INV-XXXXXX or start from 1
    let nextNumber = 1;
    if (latestInvoice?.invoice_number) {
        const match = latestInvoice.invoice_number.match(/INV-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    // Format: INV-000001, INV-000002, etc.
    return `INV-${nextNumber.toString().padStart(6, '0')}`;
}

// ============================================================================
// ACTION: Create Invoice
// ============================================================================

export async function createInvoice(prevState: CreateInvoiceState, formData: FormData) {
    const context = await getBusinessContext();
    if (!context) return { message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // Parse items from JSON string
    const rawItems = formData.get('items') as string;
    let items;
    try {
        items = JSON.parse(rawItems);
    } catch {
        return { message: 'Invalid items data' };
    }

    // Validate all fields
    const validatedFields = CreateInvoiceSchema.safeParse({
        customer_id: formData.get('customer_id') || undefined,
        customer_name: formData.get('customer_name'),
        invoice_date: formData.get('invoice_date'),
        due_date: formData.get('due_date') || undefined,
        status: formData.get('status'),
        notes: formData.get('notes') || undefined,
        items: items,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customer_id, customer_name, invoice_date, due_date, status, notes, items: validItems } = validatedFields.data;

    // Enforce Billing Limits
    const { getBillingCapabilities } = await import('@/lib/billing/capabilities');
    const capabilities = await getBillingCapabilities(businessId);
    if (!capabilities.canCreateInvoice) {
        return { message: capabilities.reason || 'Plan limit reached.' };
    }

    // Generate sequential invoice number
    const invoice_number = await generateInvoiceNumber(supabase, businessId);

    // Calculate Totals
    const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const gst_amount = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.gst_rate / 100)), 0);
    const total_amount = subtotal + gst_amount;

    // Insert Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            business_id: businessId,
            invoice_number,
            customer_name,
            customer_id: customer_id || null,
            invoice_date,
            due_date: due_date || null,
            subtotal,
            gst_amount,
            total_amount,
            status,
            notes: notes || null,
        })
        .select()
        .single();

    if (invoiceError) {
        console.error('Invoice Insert Error', invoiceError);
        return { message: `Database Error: ${invoiceError.message}` };
    }

    // Insert Items (with cost_price for COGS calculation)
    const itemsData = validItems.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: item.cost_price || 0,
        gst_rate: item.gst_rate,
        line_total: (item.quantity * item.unit_price) * (1 + item.gst_rate / 100)
    }));

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

    if (itemsError) {
        console.error('Invoice Items Insert Error', itemsError);
        // Rollback: Delete the invoice if items fail
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return { message: `Database Error: ${itemsError.message}` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/invoices');
    redirect('/invoices');
}

// ============================================================================
// ACTION: Issue Invoice (Convert Draft to Issued)
// ============================================================================

export async function issueInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // Verify ownership and current status
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status !== 'draft') {
        return { success: false, message: `Cannot issue invoice: current status is "${invoice.status}"` };
    }

    // Update status to issued (trigger will create ledger entries)
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'issued' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Issue Invoice Error', updateError);
        return { success: false, message: 'Failed to issue invoice' };
    }

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return { success: true, message: `Invoice ${invoice.invoice_number} has been issued` };
}

// ============================================================================
// ACTION: Mark Invoice as Paid
// ============================================================================

export async function markInvoiceAsPaid(invoiceId: string, amount: number) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // Fetch Invoice to Verify Ownership and Current Status
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'paid') {
        return { success: false, message: 'Invoice is already paid' };
    }

    if (invoice.status === 'draft') {
        return { success: false, message: 'Cannot mark a draft invoice as paid. Issue it first.' };
    }

    // Update Invoice Status (status column is guaranteed to exist)
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Update Error', updateError);
        return { success: false, message: 'Failed to update invoice status' };
    }

    // Create Accounting Transaction
    // Debit Bank (Asset +), Credit Accounts Receivable (Asset -)
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            business_id: businessId,
            source_type: 'invoice', // Use 'invoice' as source_type (valid in constraint)
            source_id: invoiceId,
            amount: amount,
            transaction_type: 'credit',
            transaction_date: new Date().toISOString().split('T')[0] // Date only
        })
        .select()
        .single();

    if (txError) {
        console.error('Transaction Error', txError);
        // Revert invoice status
        await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
        return { success: false, message: 'Failed to create accounting transaction: ' + txError.message };
    }

    // Create Ledger Entries
    const ledgerEntries = [
        {
            business_id: businessId,
            transaction_id: transaction.id,
            account_name: 'Bank',
            debit: amount,
            credit: 0
        },
        {
            business_id: businessId,
            transaction_id: transaction.id,
            account_name: 'Accounts Receivable',
            debit: 0,
            credit: amount
        }
    ];

    const { error: ledgerError } = await supabase.from('ledger_entries').insert(ledgerEntries);

    if (ledgerError) {
        console.error('Ledger Error', ledgerError);
        return { success: false, message: 'Payment recorded, but ledger update failed.' };
    }

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    revalidatePath('/reports');

    return { success: true, message: `Invoice ${invoice.invoice_number} marked as paid` };
}

// ============================================================================
// ACTION: Delete Invoice (Only drafts can be deleted)
// ============================================================================

export async function deleteInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId, role } = context;

    // Only owner can delete
    if (role !== 'owner') {
        return { success: false, message: 'Only the business owner can delete invoices' };
    }

    // Verify ownership and current status
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
        return {
            success: false,
            message: `Cannot delete ${invoice.status} invoice. Only draft invoices can be deleted.`
        };
    }

    // Delete invoice (cascade will delete items)
    const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

    if (deleteError) {
        console.error('Delete Invoice Error', deleteError);
        return { success: false, message: 'Failed to delete invoice' };
    }

    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return { success: true, message: `Draft invoice ${invoice.invoice_number} deleted` };
}

// ============================================================================
// ACTION: Void Invoice (For issued/paid invoices - creates reversal)
// ============================================================================

export async function voidInvoice(invoiceId: string, reason: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId, role } = context;

    // Only owner can void
    if (role !== 'owner') {
        return { success: false, message: 'Only the business owner can void invoices' };
    }

    // Verify ownership
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'voided') {
        return { success: false, message: 'Invoice is already voided' };
    }

    if (invoice.status === 'draft') {
        return { success: false, message: 'Cannot void a draft. Delete it instead.' };
    }

    // Update status to voided
    const { error: updateError } = await supabase
        .from('invoices')
        .update({
            status: 'voided',
            voided_at: new Date().toISOString(),
            void_reason: reason
        })
        .eq('id', invoiceId);

    if (updateError) {
        return { success: false, message: 'Failed to void invoice' };
    }

    // Create reversal ledger entries
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            business_id: businessId,
            description: `VOID: Invoice #${invoice.invoice_number} - ${reason}`,
            transaction_date: new Date().toISOString(),
            source_type: 'void',
            source_id: invoiceId,
            amount: invoice.total_amount,
            transaction_type: 'debit'
        })
        .select()
        .single();

    if (!txError && transaction) {
        // Reverse the original entries
        const reversalEntries = [
            // Reverse AR (credit becomes debit)
            {
                business_id: businessId,
                transaction_id: transaction.id,
                account_name: 'Accounts Receivable',
                debit: 0,
                credit: invoice.total_amount
            },
            // Reverse Sales (debit what was credited)
            {
                business_id: businessId,
                transaction_id: transaction.id,
                account_name: 'Sales',
                debit: invoice.subtotal,
                credit: 0
            }
        ];

        if (invoice.gst_amount > 0) {
            reversalEntries.push({
                business_id: businessId,
                transaction_id: transaction.id,
                account_name: 'GST Payable',
                debit: invoice.gst_amount,
                credit: 0
            });
        }

        await supabase.from('ledger_entries').insert(reversalEntries);
    }

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    revalidatePath('/reports');

    return { success: true, message: `Invoice ${invoice.invoice_number} has been voided` };
}

// ============================================================================
// ACTION: Get Customers
// ============================================================================

export async function getCustomers() {
    const context = await getBusinessContext();
    if (!context) return [];

    const { supabase, businessId } = context;

    const { data } = await supabase
        .from('customers')
        .select('id, name, tax_id, email, phone')
        .eq('business_id', businessId)
        .order('name');

    return data || [];
}

// ============================================================================
// ACTION: Get Invoice Details
// ============================================================================

export async function getInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    const { data: invoice } = await supabase
        .from('invoices')
        .select(`
            *,
            invoice_items (
                id,
                product_id,
                description,
                quantity,
                unit_price,
                cost_price,
                gst_rate,
                line_total
            )
        `)
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    return invoice;
}

// ============================================================================
// ACTION: Get Invoice Stats
// ============================================================================

export async function getInvoiceStats() {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    const { data: invoices } = await supabase
        .from('invoices')
        .select('status, total_amount, subtotal')
        .eq('business_id', businessId);

    if (!invoices) return null;

    return {
        total: invoices.length,
        draftCount: invoices.filter(i => i.status === 'draft').length,
        issuedCount: invoices.filter(i => i.status === 'issued').length,
        paidCount: invoices.filter(i => i.status === 'paid').length,
        voidedCount: invoices.filter(i => i.status === 'voided').length,
        totalRevenue: invoices.filter(i => i.status !== 'draft' && i.status !== 'voided')
            .reduce((sum, i) => sum + Number(i.subtotal || 0), 0),
        outstanding: invoices.filter(i => i.status === 'issued')
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        collected: invoices.filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    };
}

// ============================================================================
// ACTION: Duplicate Invoice (Create copy as draft)
// ============================================================================

export async function duplicateInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // Fetch original invoice with items
    const { data: original, error: fetchError } = await supabase
        .from('invoices')
        .select(`
            *,
            invoice_items (*)
        `)
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !original) {
        return { success: false, message: 'Invoice not found' };
    }

    // Generate new invoice number
    const invoice_number = await generateInvoiceNumber(supabase, businessId);

    // Create new invoice as draft
    const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert({
            business_id: businessId,
            invoice_number,
            customer_name: original.customer_name,
            customer_id: original.customer_id,
            invoice_date: new Date().toISOString().split('T')[0],
            subtotal: original.subtotal,
            gst_amount: original.gst_amount,
            total_amount: original.total_amount,
            status: 'draft',
            notes: original.notes,
        })
        .select()
        .single();

    if (createError || !newInvoice) {
        return { success: false, message: 'Failed to create duplicate invoice' };
    }

    // Copy items
    if (original.invoice_items && original.invoice_items.length > 0) {
        const newItems = original.invoice_items.map((item: any) => ({
            invoice_id: newInvoice.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost_price: item.cost_price || 0,
            gst_rate: item.gst_rate,
            line_total: item.line_total,
        }));

        await supabase.from('invoice_items').insert(newItems);
    }

    revalidatePath('/invoices');

    return { success: true, message: `Created duplicate as ${invoice_number}`, invoiceId: newInvoice.id };
}
