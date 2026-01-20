import { createClient } from '@/lib/supabase/server';
import { PLANS, PlanTier } from './plans';

export interface BillingCapabilities {
    canCreateInvoice: boolean;
    canIssueInvoice: boolean;
    canAddUser: boolean;
    canExport: boolean;
    reason?: string;
    plan: PlanTier;
}

export async function getBillingCapabilities(businessId: string): Promise<BillingCapabilities> {
    const supabase = await createClient();

    // 1. Get Subscription & Plan
    // We join to get product metadata to know the tier
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, prices(*, products(*))')
        .eq('business_id', businessId)
        .in('status', ['active', 'trialing'])
        .single();

    let tier: PlanTier | null = null;

    // Check subscription first
    if (subscription?.prices?.products?.metadata) {
        // @ts-ignore
        tier = subscription.prices.products.metadata.tier as PlanTier;
    }

    // Fallback: Check Trial status if no active subscription
    if (!tier) {
        const { data: business } = await supabase.from('businesses').select('created_at').eq('id', businessId).limit(1).single();
        if (business) {
            const created = new Date(business.created_at);
            const now = new Date();
            const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
            if (diffDays <= 14) {
                tier = 'trial';
            }
        }
    }

    // If still no tier, it means Trial Expired and No Subscription
    if (!tier) {
        // Locked state
        return {
            canCreateInvoice: false,
            canIssueInvoice: false,
            canAddUser: false,
            canExport: false,
            reason: 'Trial expired. Please upgrade your plan.',
            plan: 'trial' // Technically expired trial
        };
    }

    const limits = PLANS[tier] || PLANS['starter']; // Robust fallback

    // 2. Check Usage
    const caps: BillingCapabilities = {
        canCreateInvoice: true,
        canIssueInvoice: true,
        canAddUser: true,
        canExport: limits.canExport,
        plan: tier,
    };

    // Invoices Check
    if (limits.maxInvoices !== -1) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .gte('created_at', startOfMonth.toISOString());

        if ((count || 0) >= limits.maxInvoices) {
            caps.canCreateInvoice = false;
            caps.reason = `Plan limit reached (${limits.maxInvoices} invoices/mo). Upgrade to increase.`;
        }
    }

    // User Check
    if (limits.maxUsers !== -1) {
        const { count } = await supabase
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        if ((count || 0) >= limits.maxUsers) {
            caps.canAddUser = false;
            if (!caps.reason) caps.reason = `Plan limit reached (${limits.maxUsers} users). Upgrade to add more.`;
        }
    }

    return caps;
}
