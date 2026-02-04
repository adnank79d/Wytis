'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CreateBusinessSchema = z.object({
    name: z.string().min(2, "Business name must be at least 2 characters"),
    gst_number: z.string().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
});

export type CreateBusinessState = {
    errors?: {
        name?: string[];
        gst_number?: string[];
        address_line1?: string[];
        city?: string[];
        state?: string[];
        pincode?: string[];
        formErrors?: string[];
    };
    message?: string | null;
};

export async function createBusiness(prevState: CreateBusinessState, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = CreateBusinessSchema.safeParse({
        name: formData.get('name'),
        gst_number: formData.get('gst_number') || undefined,
        address_line1: formData.get('address_line1') || undefined,
        address_line2: formData.get('address_line2') || undefined,
        city: formData.get('city') || undefined,
        state: formData.get('state') || undefined,
        pincode: formData.get('pincode') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to create business. Please check fields.',
        };
    }

    const { name, gst_number, address_line1, address_line2, city, state, pincode } = validatedFields.data;

    // 1. Create Business & Membership via RPC (Atomic)
    const { data: business, error: rpcError } = await supabase
        .rpc('create_business_with_owner', {
            name,
            gst_number: gst_number || null,
            address_line1: address_line1 || null,
            address_line2: address_line2 || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null
        });

    if (rpcError) {
        console.error('Create Business RPC Error', rpcError);
        return { message: `Error: ${rpcError.message || JSON.stringify(rpcError)}` };
    }

    // 3. Revalidate and Redirect
    revalidatePath('/dashboard');
    redirect('/dashboard');
}

const UpdateBusinessSchema = CreateBusinessSchema.partial();

export type UpdateBusinessState = {
    errors?: {
        name?: string[];
        gst_number?: string[];
        address_line1?: string[];
        address_line2?: string[];
        city?: string[];
        state?: string[];
        pincode?: string[];
        formErrors?: string[];
    };
    message?: string | null;
};

export async function updateBusiness(prevState: UpdateBusinessState, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'Unauthorized' };

    const businessId = formData.get('business_id') as string;
    if (!businessId) return { message: 'Missing business ID' };

    // 1. Verify Ownership
    const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .limit(1)
        .single();

    if (!membership || membership.role !== 'owner') {
        return { message: 'Unauthorized: Only owners can update business settings.' };
    }

    // 2. Validate using Partial Schema
    const rawData: Record<string, any> = {};
    if (formData.has('name')) rawData.name = formData.get('name');
    if (formData.has('gst_number')) rawData.gst_number = formData.get('gst_number');
    if (formData.has('address_line1')) rawData.address_line1 = formData.get('address_line1');
    if (formData.has('address_line2')) rawData.address_line2 = formData.get('address_line2');
    if (formData.has('city')) rawData.city = formData.get('city');
    if (formData.has('state')) rawData.state = formData.get('state');
    if (formData.has('pincode')) rawData.pincode = formData.get('pincode');

    const validatedFields = UpdateBusinessSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation Failed',
        };
    }

    // 3. Update only present fields
    if (Object.keys(validatedFields.data).length === 0) {
        return { message: 'No changes detected.' };
    }

    const { error } = await supabase
        .from('businesses')
        .update(validatedFields.data)
        .eq('id', businessId);

    if (error) {
        return { message: 'Database Error: Failed to update business.' };
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/settings/gst');
    return { message: 'Success: Settings updated.' };
}
