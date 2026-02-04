'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Void an invoice by changing status from 'issued' to 'cancelled'
 * Database trigger automatically creates reversing ledger entries
 */
export async function voidInvoice(invoiceId: string) {
    const supabase = await createClient();

    // Get user context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'Not authenticated' };
    }

    // Get business context
    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .single();

    if (!membership) {
        return { success: false, message: 'No business found' };
    }

    // Permission check (only owner can void)
    if (membership.role !== 'owner') {
        return { success: false, message: 'Only business owner can void invoices' };
    }

    // Verify invoice exists and is issued
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, invoice_number')
        .eq('id', invoiceId)
        .eq('business_id', membership.business_id)
        .single();

    if (fetchError || !invoice) {
        return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status !== 'issued') {
        return {
            success: false,
            message: `Cannot void ${invoice.status} invoice. Only issued invoices can be voided.`
        };
    }

    // Update status to 'cancelled'
    // Database trigger will automatically create reversing ledger entries
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

    if (updateError) {
        console.error('Void invoice error:', updateError);
        return { success: false, message: updateError.message || 'Failed to void invoice' };
    }

    // Revalidate paths
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    revalidatePath(`/invoices/${invoiceId}`);

    return {
        success: true,
        message: `Invoice ${invoice.invoice_number} voided successfully`
    };
}
