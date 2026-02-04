'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * IMMUTABLE LEDGER SYSTEM - INVOICE ACTIONS
 * 
 * These functions ONLY update invoice status.
 * All ledger entry creation is handled by database triggers.
 * 
 * Lifecycle: draft → issued → cancelled
 */

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
        .single();

    if (!membership) return null;

    return {
        supabase,
        userId: user.id,
        businessId: membership.business_id,
        role: membership.role as 'owner' | 'accountant' | 'staff'
    };
}

// ============================================================================
// ISSUE INVOICE
// ============================================================================
/**
 * Transitions invoice from 'draft' to 'issued'
 * Database trigger creates ledger entries automatically
 */
export async function issueInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) {
        return { success: false, message: 'Not authenticated' };
    }

    const { supabase, businessId, role } = context;

    // Permission check
    if (role === 'staff') {
        return { success: false, message: 'Staff cannot issue invoices' };
    }

    // Verify invoice exists and is draft
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
        return {
            success: false,
            message: `Invoice is already ${invoice.status}`
        };
    }

    // Update status to 'issued'
    // Database trigger will create ledger entries automatically
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'issued' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Issue invoice error:', updateError);
        return { success: false, message: 'Failed to issue invoice' };
    }

    // Revalidate paths
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    revalidatePath(`/invoices/${invoiceId}`);

    return {
        success: true,
        message: `Invoice ${invoice.invoice_number} issued successfully`
    };
}

// ============================================================================
// CANCEL INVOICE (Reversal)
// ============================================================================
/**
 * Transitions invoice from 'issued' to 'cancelled'
 * Database trigger creates REVERSING ledger entries
 * This maintains immutable audit trail
 */
export async function cancelInvoice(invoiceId: string, reason?: string) {
    const context = await getBusinessContext();
    if (!context) {
        return { success: false, message: 'Not authenticated' };
    }

    const { supabase, businessId, role } = context;

    // Permission check
    if (role !== 'owner') {
        return { success: false, message: 'Only owner can cancel invoices' };
    }

    // Verify invoice exists and is issued
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status !== 'issued') {
        return {
            success: false,
            message: `Cannot cancel ${invoice.status} invoice. Only issued invoices can be cancelled.`
        };
    }

    // Update status to 'cancelled'
    // Database trigger will create reversing ledger entries automatically
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Cancel invoice error:', updateError);
        return { success: false, message: 'Failed to cancel invoice' };
    }

    // Revalidate paths
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    revalidatePath(`/invoices/${invoiceId}`);

    return {
        success: true,
        message: `Invoice ${invoice.invoice_number} cancelled successfully`
    };
}

// ============================================================================
// DELETE INVOICE (Draft Only)
// ============================================================================
/**
 * Deletes a draft invoice
 * Database trigger prevents deletion of issued/cancelled invoices
 */
export async function deleteInvoice(invoiceId: string) {
    const context = await getBusinessContext();
    if (!context) {
        return { success: false, message: 'Not authenticated' };
    }

    const { supabase, businessId, role } = context;

    // Permission check
    if (role !== 'owner') {
        return { success: false, message: 'Only owner can delete invoices' };
    }

    // Verify invoice exists
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    // Database trigger will block deletion if status != 'draft'
    // But we check here for better UX
    if (invoice.status !== 'draft') {
        return {
            success: false,
            message: `Cannot delete ${invoice.status} invoice. Use cancellation instead.`
        };
    }

    // Attempt deletion
    const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

    if (deleteError) {
        console.error('Delete invoice error:', deleteError);
        return {
            success: false,
            message: deleteError.message || 'Failed to delete invoice'
        };
    }

    // Revalidate paths
    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return {
        success: true,
        message: `Invoice ${invoice.invoice_number} deleted`
    };
}

// ============================================================================
// MARK AS PAID (Deprecated - Use Payment Tracking Instead)
// ============================================================================
/**
 * @deprecated Payment tracking should be separate from invoice status
 * This function is kept for backward compatibility but should not be used
 */
export async function markInvoiceAsPaid(invoiceId: string) {
    return {
        success: false,
        message: 'Payment tracking is not yet implemented in the new system'
    };
}
