'use server';

import { createClient } from "@/lib/supabase/server";

export interface SubscriptionData {
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'expired' | 'paid';
    planName: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
}

export async function getBusinessSubscription(): Promise<SubscriptionData> {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            status: 'expired',
            planName: 'Free',
            trialEndsAt: null,
            currentPeriodEnd: null
        };
    }

    // 2. Get User's Business
    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (!membership) {
        return {
            status: 'expired',
            planName: 'Free',
            trialEndsAt: null,
            currentPeriodEnd: null
        };
    }

    // 3. Get Active Subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, price_id, trial_end')
        .eq('business_id', membership.business_id)
        .in('status', ['active', 'trialing'])
        .order('created', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!subscription) {
        // Check if there is ANY subscription history or if it's a truly new account
        // For now, default to Free/Expired if no active sub
        return {
            status: 'expired',
            planName: 'Free Plan',
            trialEndsAt: null,
            currentPeriodEnd: null
        };
    }

    // Map internal status to UI status
    // The dashboard expects: 'active' | 'expired' | 'paid'
    // But our DB stores Stripe statuses: 'active', 'trialing', etc.
    // We map 'active' -> 'paid' for the UI to show "Pro Plan" 

    let uiStatus: SubscriptionData['status'] = 'expired';

    if (subscription.status === 'active') {
        uiStatus = 'paid';
    } else if (subscription.status === 'trialing') {
        uiStatus = 'active'; // Shows as active trial
    }

    return {
        status: uiStatus,
        planName: subscription.price_id ? 'Pro Plan' : 'Free Plan',
        trialEndsAt: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end
    };
}
