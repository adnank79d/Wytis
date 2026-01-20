
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CustomerSchema = z.object({
    business_id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    address: z.string().optional(),
});

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Parse Input
        const body = await request.json();
        const result = CustomerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid Input', details: result.error.issues },
                { status: 400 }
            );
        }

        const { business_id, name, email, phone, tax_id, address } = result.data;

        // 3. Verify Membership
        const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .select('role')
            .eq('business_id', business_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json(
                { error: 'Forbidden: You do not have access to this business.' },
                { status: 403 }
            );
        }

        // 4. Enforce Trial (Write Operation)
        const { data: business } = await supabase
            .from('businesses')
            .select('trial_ends_at, subscription_status')
            .eq('id', business_id)
            .single();

        if (business) {
            const isPaid = business.subscription_status === 'paid';
            const isTrialActive = business.subscription_status === 'active' &&
                new Date(business.trial_ends_at) > new Date();

            if (!isPaid && !isTrialActive) {
                return NextResponse.json(
                    { error: 'Trial expired. Cannot create new customers.' },
                    { status: 403 }
                );
            }
        }

        // 5. Insert Customer
        const { data: customer, error: insertError } = await supabase
            .from('customers')
            .insert({
                business_id,
                name,
                email: email || null,
                phone: phone || null,
                tax_id: tax_id || null,
                address: address || null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Customer Creation Error:', insertError);
            return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
        }

        return NextResponse.json(customer);

    } catch (err) {
        console.error('Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
