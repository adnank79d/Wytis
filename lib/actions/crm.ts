'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export type Customer = {
    id: string;
    business_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    gst_number: string | null;
    company_name: string | null;
    status: 'lead' | 'prospect' | 'customer' | 'inactive';
    tags: string[] | null;
    last_contacted_at: string | null;
    created_at: string;
};

export type Interaction = {
    id: string;
    business_id: string;
    customer_id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'other';
    details: string | null;
    interaction_date: string;
    created_at: string;
};

// ============================================================================
// SCHEMAS
// ============================================================================

const CustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal('')).or(z.null()),
    phone: z.string().optional().or(z.literal('')).or(z.null()),
    company_name: z.string().optional().or(z.literal('')).or(z.null()),
    address: z.string().optional().or(z.literal('')).or(z.null()),
    gst_number: z.string().optional().or(z.literal('')).or(z.null()),
    status: z.enum(['lead', 'prospect', 'customer', 'inactive']).default('lead'),
    tags: z.string().optional().or(z.literal('')).or(z.null()), // Comma separated for input
});

export type CustomerFormState = {
    errors?: Record<string, string[]>;
    message?: string | null;
    success?: boolean;
};

// ============================================================================
// ACTIONS
// ============================================================================

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

export async function getCustomers(search?: string, status?: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

    if (search) {
        query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data } = await query;
    return (data || []) as Customer[];
}

export async function addCustomer(prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { message: "Unauthorized", success: false };

    const validatedFields = CustomerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company_name: formData.get('company_name'),
        address: formData.get('address'),
        gst_number: formData.get('gst_number'),
        status: formData.get('status'),
        tags: formData.get('tags'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    const { data } = validatedFields;
    const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const { error } = await supabase
        .from('customers')
        .insert({
            business_id: businessId,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            address: data.address || null,
            gst_number: data.gst_number || null,
            status: data.status,
            tags: tagsArray,
        });

    if (error) {
        return { message: `Error: ${error.message}`, success: false };
    }

    revalidatePath('/crm');
    revalidatePath('/customers'); // Legacy path if exists
    return { message: "Customer added successfully", success: true };
}

export async function updateCustomer(id: string, prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { message: "Unauthorized", success: false };

    // Same schema/validation as add, minus creating checks
    const validatedFields = CustomerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company_name: formData.get('company_name'),
        address: formData.get('address'),
        gst_number: formData.get('gst_number'),
        status: formData.get('status'),
        tags: formData.get('tags'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false
        };
    }

    const { data } = validatedFields;
    const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const { error } = await supabase
        .from('customers')
        .update({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            address: data.address || null,
            gst_number: data.gst_number || null,
            status: data.status,
            tags: tagsArray,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('business_id', businessId);

    if (error) {
        return { message: `Error: ${error.message}`, success: false };
    }

    revalidatePath('/crm');
    return { message: "Customer updated successfully", success: true };
}

export async function getInteractions(customerId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('interaction_date', { ascending: false });

    return (data || []) as Interaction[];
}

export async function addInteraction(customerId: string, formData: FormData) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { success: false, message: "Unauthorized" };

    const type = formData.get('type') as string;
    const details = formData.get('details') as string;
    const date = formData.get('date') as string || new Date().toISOString();

    const { error } = await supabase
        .from('customer_interactions')
        .insert({
            business_id: businessId,
            customer_id: customerId,
            type,
            details,
            interaction_date: date
        });

    if (error) return { success: false, message: error.message };

    revalidatePath('/crm');
    return { success: true };
}
