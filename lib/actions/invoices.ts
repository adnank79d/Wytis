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
    discount: z.coerce.number().min(0).default(0),
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
        discount: formData.get('discount') || 0,
        items: items,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customer_id, customer_name, invoice_date, due_date, status, notes, discount, items: validItems } = validatedFields.data;

    // Enforce Billing Limits
    const { getBillingCapabilities } = await import('@/lib/billing/capabilities');
    const capabilities = await getBillingCapabilities(businessId);
    if (!capabilities.canCreateInvoice) {
        return { message: capabilities.reason || 'Plan limit reached.' };
    }

    // Generate sequential invoice number
    const invoice_number = await generateInvoiceNumber(supabase, businessId);

    // Calculate Totals
    // Note: unit_price is stored as tax-exclusive (already converted if prices_include_tax was true)
    const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // GST Calculation: Round each line item's GST to 2 decimals before summing
    // This matches the client-side calculation and prevents floating-point errors
    const gst_amount = validItems.reduce((sum, item) => {
        const lineGst = item.quantity * item.unit_price * (item.gst_rate / 100);
        return sum + Math.round(lineGst * 100) / 100;
    }, 0);

    const total_amount = Math.max(0, (Math.round((subtotal + gst_amount) * 100) / 100) - discount);

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
            discount_amount: discount, // Added discount_amount
        } as any) // Cast to any to avoid type error until migration is applied
        .select()
        .single();

    if (invoiceError) {
        console.error('Invoice Insert Error', invoiceError);
        return { message: `Database Error: ${invoiceError.message}` };
    }

    // Prepare Cost Prices map for products
    const productIds = validItems.map(i => i.product_id).filter(Boolean) as string[];
    let productCosts: Record<string, number> = {};

    if (productIds.length > 0) {
        const { data: products } = await supabase
            .from('inventory_products')
            .select('id, cost_price')
            .in('id', productIds);

        console.log("Fetched Products for Cost:", products); // DEBUG LOG

        products?.forEach(p => {
            productCosts[p.id] = Number(p.cost_price || 0);
        });
    }

    console.log("Cost Map:", productCosts); // DEBUG LOG

    // Insert Items (with cost_price for COGS calculation)
    const itemsData = validItems.map(item => {
        const dbCost = item.product_id ? productCosts[item.product_id] : undefined;
        // Prioritize DB cost, then item cost (from form?), then 0
        const finalCost = dbCost !== undefined ? dbCost : (item.cost_price || 0);

        return {
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost_price: finalCost,
            gst_rate: item.gst_rate,
            line_total: (item.quantity * item.unit_price) * (1 + item.gst_rate / 100)
        };
    });

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

// ============================================================================
// ACTION: Issue Invoice (Convert Draft to Issued)
// ============================================================================

export async function issueInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // 1. Fetch Invoice + Items
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
            *,
            invoice_items (*)
        `)
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status !== 'draft') {
        return { success: false, message: `Cannot issue invoice: current status is "${invoice.status}"` };
    }

    // 2. Determine Place of Supply
    // Fetch Business State
    const { data: business } = await supabase
        .from('businesses')
        .select('state')
        .eq('id', businessId)
        .single();

    // Fetch Customer State
    let customerState = null;
    if (invoice.customer_id) {
        const { data: customer } = await supabase
            .from('customers')
            .select('state')
            .eq('id', invoice.customer_id)
            .single();
        customerState = customer?.state;
    }

    // Default to Intra-state (CGST+SGST) if states match or unknown (safest default for local business)
    // Or Inter-state (IGST) if different. 
    // If state is missing, we assume local (Intra-state) for now as typical behavior.
    const isInterState = business?.state && customerState && business.state.toLowerCase() !== customerState.toLowerCase();

    // 3. Update status to issued
    // The database trigger (handle_invoice_issued) will automatically:
    // 1. Create transaction record
    // 2. Create ledger entries (Dr AR, Cr Sales, Cr GST)
    // 3. Record COGS entries (Dr COGS, Cr Inventory)
    // 4. Create GST records for compliance
    // 5. Update inventory quantities
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

    // Update Invoice Status
    // The database trigger (handle_invoice_paid) will automatically:
    // 1. Create payment transaction
    // 2. Create ledger entries (Dr Bank, Cr AR)
    // 3. Log audit trail
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Update Error', updateError);
        return { success: false, message: 'Failed to update invoice status' };
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

    // Call database function to handle cleanup with SECURITY DEFINER
    const { data, error } = await supabase.rpc('delete_invoice_with_cleanup', {
        p_invoice_id: invoiceId,
        p_business_id: businessId
    });

    if (error) {
        console.error('Delete Invoice Error', error);
        return { success: false, message: error.message || 'Failed to delete invoice' };
    }

    // data is the jsonb object returned by the function
    const result = data as { success: boolean; message: string };

    if (!result.success) {
        return result;
    }

    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return result;
}

// ============================================================================
// ACTION: Void Invoice (For issued/paid invoices - creates reversal)
// ============================================================================

export async function voidInvoice(invoiceId: string, reason?: string) {
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
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'cancelled') {
        return { success: false, message: 'Invoice is already voided' };
    }

    if (invoice.status === 'draft') {
        return { success: false, message: 'Cannot void a draft. Delete it instead.' };
    }

    // Allow voiding of both 'issued' and 'paid' invoices
    if (invoice.status !== 'issued' && invoice.status !== 'paid') {
        return { success: false, message: `Cannot void ${invoice.status} invoice. Only issued or paid invoices can be voided.` };
    }

    // Update status to 'cancelled' (Trigger will handle accounting reversals)
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId)
        .eq('business_id', businessId);

    if (updateError) {
        console.error('Void Invoice Error', updateError);
        return { success: false, message: updateError.message || 'Failed to void invoice' };
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
