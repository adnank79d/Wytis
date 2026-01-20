'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/admin';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function createCheckoutSession(priceId: string, promoCode?: string) {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 2. Setup Admin Client (Bypass RLS for reliability)
    console.log("DEBUG: Checking Env Vars...");
    console.log("NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!serviceKey) {
        console.error("CRITICAL ERROR: 'SUPABASE_SERVICE_ROLE_KEY' is missing from environment.");
        throw new Error("Server Misconfiguration: Missing Service Key. Please add SUPABASE_SERVICE_ROLE_KEY to .env");
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const adminDb = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 3. Get Business (Using Admin Client)
    const { data: membership, error: memError } = await adminDb
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (memError || !membership) {
        console.error("Membership Fetch Error:", memError);
        throw new Error('No business found');
    }

    const businessId = membership.business_id;
    // const businessName = membership.businesses?.name;

    // Calculate mock dates
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    // Upsert subscription using ADMIN client
    const { error } = await adminDb
        .from('subscriptions')
        .upsert({
            id: `sub_mock_${Date.now()}`,
            business_id: businessId,
            status: 'active',
            price_id: priceId,
            quantity: 1,
            cancel_at_period_end: false,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
            created: now.toISOString(),
            metadata: { type: 'mock_subscription' }
        });

    if (error) {
        console.error("Mock Subscription Error:", error);
        throw new Error("Failed to upgrade plan");
    }

    // Redirect to success
    const origin = (await headers()).get('origin');
    redirect(`${origin}/settings/billing?success=true`);

    /* STRIPE LOGIC DISABLED
    // 3. Get or Create Stripe Customer
    let { data: customerData } = await supabase ...
    // ... rest of stripe logic ...
    */
}

export async function createPortalSession() {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 2. Get Business
    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (!membership) throw new Error('No business found');

    // MOCK PORTAL: Just redirect back for now since there is no billing portal
    const origin = (await headers()).get('origin');
    redirect(`${origin}/settings/billing`);

    /* STRIPE PORTAL DISABLED
    // 3. Get Stripe Customer
    const { data: customerData } = await supabase ...
    // ...
    redirect(session.url);
    */
}
