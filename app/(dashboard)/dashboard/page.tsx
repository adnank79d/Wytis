import { createClient } from "@/lib/supabase/server";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { redirect } from "next/navigation";
import { Role } from "@/lib/permissions";
import { getDashboardMetrics, getDashboardActivity, getRecentActivityStream, getTopCustomers, getAlerts, getGSTCompliance } from "@/lib/actions/dashboard";
import { getBusinessSubscription } from "@/lib/actions/subscription";
import { getInventoryStats } from "@/lib/actions/inventory";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Find User's Business (Primary)
    const { data: membership } = await supabase
        .from("memberships")
        .select(`
            role,
            business_id,
            businesses(
                name
            )
        `)
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) {
        return (
            <div className="p-8 max-w-xl mx-auto mt-20 bg-background border rounded-lg shadow-sm">
                <h1 className="text-xl font-bold text-red-600 mb-4">Debug: Membership Not Found</h1>
                <div className="mt-6">
                    <a href="/onboarding" className="text-primary hover:underline">Go to Onboarding</a>
                </div>
            </div>
        );
    }

    const userRole = membership.role as Role;
    // @ts-ignore
    const businessName = membership.businesses?.name;

    // Extract only first name from metadata
    const firstName = user.user_metadata?.first_name || '';
    const userName = firstName || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    // 2. Use Centralized Dashboard Data Layer
    const [metrics, activity, recentStream, subscriptionData, inventoryStats, topCustomers, alerts, gstCompliance] = await Promise.all([
        getDashboardMetrics(),
        getDashboardActivity(),
        getRecentActivityStream(),
        getBusinessSubscription(),
        getInventoryStats(),
        getTopCustomers(3),
        getAlerts(),
        getGSTCompliance()
    ]);

    // Map subscription data for component
    let dashboardSubStatus: 'active' | 'expired' | 'paid' = 'expired';
    if (subscriptionData.status === 'paid') dashboardSubStatus = 'paid';
    if (subscriptionData.status === 'active') dashboardSubStatus = 'active';

    const subscription = {
        status: dashboardSubStatus,
        trialEndsAt: subscriptionData.trialEndsAt || new Date().toISOString()
    };

    return (
        <MainDashboard
            metrics={{
                revenue: metrics?.revenue || 0,
                revenueTrend: metrics?.revenueTrend || 0,
                revenueHistory: metrics?.revenueHistory || [],
                netProfit: metrics?.netProfit || 0,
                profitTrend: metrics?.profitTrend || 0,
                profitHistory: metrics?.profitHistory || [],
                gstPayable: metrics?.gstPayable || 0,
                receivables: metrics?.receivables || 0,
                payables: metrics?.payables || 0,
                cashBalance: metrics?.cashBalance || 0
            }}
            activity={{
                recentStream: recentStream || [],
                overdueCount: activity?.overdueCount || 0,
                overdueAmount: activity?.overdueAmount || 0
            }}
            inventory={{
                totalProducts: inventoryStats?.totalProducts || 0,
                lowStock: inventoryStats?.lowStock || 0,
                totalValue: inventoryStats?.totalValue || 0
            }}
            topCustomers={topCustomers || []}
            alerts={alerts || []}
            gstCompliance={gstCompliance}
            subscription={subscription}
            userRole={userRole}
            userName={userName}
        />
    );
}
