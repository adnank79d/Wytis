import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { Role } from "@/lib/permissions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch Business Trial Info
    const { data: membership } = await supabase
        .from("memberships")
        .select(`
            role,
            business_id,
            businesses (
                name,
                subscriptions (
                    status,
                    current_period_end,
                    trial_end,
                    price_id
                )
            )
        `)
        .eq("user_id", user.id)
        .limit(1)
        .single();

    // Type assertion or check safe access
    const business = (membership?.businesses as unknown as { name: string, subscriptions: any[] }) || { name: 'My Business', subscriptions: [] };
    const userRole = membership?.role as Role;
    const subscription = business.subscriptions?.[0];

    // Determine Banner State
    let bannerStatus: 'active' | 'expired' | 'paid' = 'active';
    let bannerDate = new Date().toISOString();

    if (subscription) {
        if (subscription.status === 'active') {
            bannerStatus = 'paid'; // Hide banner for active/paid plans
        } else if (subscription.status === 'trialing') {
            bannerStatus = 'active';
            bannerDate = subscription.trial_end || subscription.current_period_end;
        } else {
            // canceled, past_due, unpaid
            bannerStatus = 'expired';
            bannerDate = subscription.current_period_end;
        }
    } else {
        // No subscription found = Expired Trial (or never started)
        bannerStatus = 'expired';
        bannerDate = new Date().toISOString(); // Now
    }

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-muted/5">
            {/* 1. Header (Fixed top) */}
            <Header
                userRole={userRole}
                businessName={business?.name}
                userEmail={user.email}
                userName={userName}
            />

            {/* 2. Main Layout (Flex Row) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar (Hidden on mobile) */}
                <Sidebar className="hidden md:flex" />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col w-full overflow-hidden">
                    {/* Trial Banner inside Content Area, at the top */}
                    {business && (
                        <div className="bg-background border-b shrink-0 z-10">
                            <TrialBanner
                                status={bannerStatus}
                                trialEndsAt={bannerDate}
                            />
                        </div>
                    )}

                    {/* Scrollable Page Content */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 w-full">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
