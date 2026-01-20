import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PricingTable } from '@/components/billing/pricing-table';
import { BillingSettings } from '@/components/billing/billing-settings';
import { PromoCodeInput } from '@/components/billing/promo-code-input';

export default async function BillingPage() {
    const supabase = await createClient();

    // 1. Auth & Business
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (!membership) redirect('/onboarding'); // or some error page
    if (membership.role !== 'owner') {
        return <div className="p-8">Only business owners can manage billing.</div>;
    }

    // 2. Fetch Subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, prices(*, products(*))')
        .eq('business_id', membership.business_id)
        .in('status', ['trialing', 'active'])
        .single();

    // 3. Fetch Products (if needed)
    // 3. Fetch Products (Always fetch to show upgrading options)
    const { data } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true)
        .order('metadata->index')  // Optional ordering
        .order('unit_amount', { foreignTable: 'prices' });
    const products = data || [];

    return (
        <div className="space-y-6">
            {subscription && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Your Subscription</h3>
                    <BillingSettings subscription={subscription} />
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">{subscription ? 'Change Plan' : 'Select a Plan'}</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose the plan that fits your business needs.
                    </p>
                </div>
                <PricingTable products={products as any} />
                <PromoCodeInput />
            </div>
        </div>
    );

}
