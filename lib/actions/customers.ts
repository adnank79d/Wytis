'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Types
export type Customer = {
    id: string;
    business_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    gst_number: string | null;
    notes: string | null;
    created_at: string;
    total_invoices?: number;
    total_amount?: number;
};

export type CustomerStats = {
    totalCustomers: number;
    activeCustomers: number;
    newThisMonth: number;
    totalRevenue: number;
};

// Schema
const CustomerSchema = z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    gst_number: z.string().optional(),
    notes: z.string().optional(),
});

export type CustomerFormState = {
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

// Get all customers with optional search
export async function getCustomers(search?: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    return (data || []) as Customer[];
}

// Get customer stats
export async function getCustomerStats(): Promise<CustomerStats> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { totalCustomers: 0, activeCustomers: 0, newThisMonth: 0, totalRevenue: 0 };
    }

    // Get customers
    const { data: customers } = await supabase
        .from('customers')
        .select('id, created_at')
        .eq('business_id', businessId);

    // Get invoice stats per customer
    const { data: invoices } = await supabase
        .from('invoices')
        .select('customer_name, total_amount')
        .eq('business_id', businessId);

    const totalCustomers = customers?.length || 0;

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = customers?.filter(c =>
        new Date(c.created_at) >= firstOfMonth
    ).length || 0;

    // Count unique customers with invoices
    const activeCustomers = new Set(invoices?.map(i => i.customer_name)).size;
    const totalRevenue = invoices?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;

    return { totalCustomers, activeCustomers, newThisMonth, totalRevenue };
}

// Get single customer
export async function getCustomer(customerId: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return null;

    const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('business_id', businessId)
        .single();

    return data as Customer | null;
}

// Add new customer
export async function addCustomer(prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = CustomerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email') || undefined,
        phone: formData.get('phone') || undefined,
        address: formData.get('address') || undefined,
        gst_number: formData.get('gst_number') || undefined,
        notes: formData.get('notes') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed. Please check the form.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('customers')
        .insert({
            business_id: businessId,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            gst_number: data.gst_number || null,
            notes: data.notes || null,
        });

    if (error) {
        console.error('Add customer error:', error);
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/customers');
    redirect('/customers');
}

// Update customer
export async function updateCustomer(
    customerId: string,
    prevState: CustomerFormState,
    formData: FormData
): Promise<CustomerFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = CustomerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email') || undefined,
        phone: formData.get('phone') || undefined,
        address: formData.get('address') || undefined,
        gst_number: formData.get('gst_number') || undefined,
        notes: formData.get('notes') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('customers')
        .update({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            gst_number: data.gst_number || null,
            notes: data.notes || null,
        })
        .eq('id', customerId)
        .eq('business_id', businessId);

    if (error) {
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/customers');
    revalidatePath(`/customers/${customerId}`);
    return { message: 'Customer updated successfully' };
}

// Delete customer
export async function deleteCustomer(customerId: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { success: false, message: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('business_id', businessId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/customers');
    return { success: true };
}
