'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Types
export type Payment = {
    id: string;
    business_id: string;
    payment_type: 'received' | 'made';
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'bank' | 'upi' | 'card' | 'cheque' | 'other';
    reference_number: string | null;
    invoice_id: string | null;
    party_name: string;
    notes: string | null;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    updated_at: string;
    invoice?: { invoice_number: string } | null;
};

export type PaymentStats = {
    totalReceived: number;
    totalPaid: number;
    pendingCount: number;
    recentCount: number;
};

// Schema
const PaymentSchema = z.object({
    payment_type: z.enum(['received', 'made']),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    payment_date: z.string().min(1, "Date is required"),
    payment_method: z.enum(['cash', 'bank', 'upi', 'card', 'cheque', 'other']),
    reference_number: z.string().optional(),
    invoice_id: z.string().optional(),
    party_name: z.string().min(1, "Party name is required"),
    notes: z.string().optional(),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('completed'),
});

export type PaymentFormState = {
    errors?: Record<string, string[]>;
    message?: string | null;
};

// Get user's business
async function getBusinessId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    return membership?.business_id || null;
}

// Get all payments with optional filters
export async function getPayments(
    type?: 'received' | 'made' | 'all',
    status?: string,
    startDate?: string,
    endDate?: string
) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    let query = supabase
        .from('payments')
        .select(`
            *,
            invoice:invoices(invoice_number)
        `)
        .eq('business_id', businessId)
        .order('payment_date', { ascending: false });

    if (type && type !== 'all') {
        query = query.eq('payment_type', type);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (startDate) {
        query = query.gte('payment_date', startDate);
    }

    if (endDate) {
        query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return (data || []) as Payment[];
}

// Get payment stats
export async function getPaymentStats(): Promise<PaymentStats> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { totalReceived: 0, totalPaid: 0, pendingCount: 0, recentCount: 0 };
    }

    const { data: payments } = await supabase
        .from('payments')
        .select('payment_type, amount, status, payment_date')
        .eq('business_id', businessId);

    if (!payments) {
        return { totalReceived: 0, totalPaid: 0, pendingCount: 0, recentCount: 0 };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalReceived = payments
        .filter(p => p.payment_type === 'received' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPaid = payments
        .filter(p => p.payment_type === 'made' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingCount = payments.filter(p => p.status === 'pending').length;

    const recentCount = payments.filter(p =>
        new Date(p.payment_date) >= thirtyDaysAgo
    ).length;

    return { totalReceived, totalPaid, pendingCount, recentCount };
}

// Add new payment
export async function addPayment(prevState: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = PaymentSchema.safeParse({
        payment_type: formData.get('payment_type'),
        amount: formData.get('amount'),
        payment_date: formData.get('payment_date'),
        payment_method: formData.get('payment_method'),
        reference_number: formData.get('reference_number') || undefined,
        invoice_id: formData.get('invoice_id') || undefined,
        party_name: formData.get('party_name'),
        notes: formData.get('notes') || undefined,
        status: formData.get('status') || 'completed',
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed. Please check the form.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('payments')
        .insert({
            business_id: businessId,
            payment_type: data.payment_type,
            amount: data.amount,
            payment_date: data.payment_date,
            payment_method: data.payment_method,
            reference_number: data.reference_number || null,
            invoice_id: data.invoice_id || null,
            party_name: data.party_name,
            notes: data.notes || null,
            status: data.status,
        });

    if (error) {
        console.error('Add payment error:', error);
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/payments');
    redirect('/payments');
}

// Update payment
export async function updatePayment(
    paymentId: string,
    prevState: PaymentFormState,
    formData: FormData
): Promise<PaymentFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = PaymentSchema.safeParse({
        payment_type: formData.get('payment_type'),
        amount: formData.get('amount'),
        payment_date: formData.get('payment_date'),
        payment_method: formData.get('payment_method'),
        reference_number: formData.get('reference_number') || undefined,
        invoice_id: formData.get('invoice_id') || undefined,
        party_name: formData.get('party_name'),
        notes: formData.get('notes') || undefined,
        status: formData.get('status') || 'completed',
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('payments')
        .update({
            payment_type: data.payment_type,
            amount: data.amount,
            payment_date: data.payment_date,
            payment_method: data.payment_method,
            reference_number: data.reference_number || null,
            invoice_id: data.invoice_id || null,
            party_name: data.party_name,
            notes: data.notes || null,
            status: data.status,
            updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('business_id', businessId);

    if (error) {
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { message: 'Payment updated successfully' };
}

// Delete payment
export async function deletePayment(paymentId: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { success: false, message: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)
        .eq('business_id', businessId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/payments');
    return { success: true };
}

// Get invoices for linking
export async function getInvoicesForPayment() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, total_amount, status')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

    return data || [];
}
