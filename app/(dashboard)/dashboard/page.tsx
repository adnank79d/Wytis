import { createClient } from "@/lib/supabase/server";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { redirect } from "next/navigation";
import { Role } from "@/lib/permissions";
import { getDashboardMetrics, getDashboardActivity } from "@/lib/actions/dashboard";


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
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

    // 2. Use Centralized Dashboard Data Layer
    const [metrics, activity] = await Promise.all([
        getDashboardMetrics(),
        getDashboardActivity()
    ]);

    // Fallback subscription data
    const subscription = {
        status: 'active' as const,
        trialEndsAt: new Date().toISOString()
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
                payables: metrics?.payables || 0
            }}
            activity={{
                invoicesThisMonth: activity?.invoicesThisMonth || 0,
                lastInvoiceDate: activity?.lastInvoiceDate || null
            }}
            subscription={subscription}
            userRole={userRole}
            userName={userName}
        />
    );
}
