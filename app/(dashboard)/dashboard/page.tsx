import { createClient } from "@/lib/supabase/server";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { redirect } from "next/navigation";
import { Role } from "@/lib/permissions";


interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
    const searchParams = await props.searchParams;
    const showDemo = searchParams.view === "demo";
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

    // Fallback while we fix the schema
    const business = { trial_ends_at: new Date().toISOString(), subscription_status: 'active' as const };
    const userRole = membership.role as Role;
    // @ts-ignore
    const businessName = membership.businesses?.name;
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

    // 4. Data Fetching for Main Dashboard
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [pnlResult, gstResult, lastInvoiceResult, currentMonthInvoices, receivablesResult, lastMonthPnlResult, balanceSheetResult] = await Promise.all([
        supabase.from('profit_and_loss_view').select('*').eq('business_id', membership.business_id),
        supabase.from('gst_summary_view').select('total_payable').eq('business_id', membership.business_id),
        supabase.from('invoices').select('invoice_date').eq('business_id', membership.business_id).order('invoice_date', { ascending: false }).limit(1).single(),
        supabase.from('invoices').select('*').eq('business_id', membership.business_id).gte('invoice_date', startOfMonth.toISOString()), // Count handled by length
        supabase.from('customer_receivables_view').select('outstanding_amount').eq('business_id', membership.business_id),
        // Simplification: We assume pnl view handles time, but it actually aggregates ALL TIME by default in the view definition.
        // The view definition aggregates EVERYTHING. So precise monthly trend requires a TIME-FILTERED view or raw ledger query.
        // For this demo/task, we might not have a time-filtered view.
        // Let's assume for now we use the current month invoices for revenue Trend (proxy).
        supabase.from('invoices').select('total_amount, invoice_date').eq('business_id', membership.business_id).gte('invoice_date', startOfLastMonth.toISOString()).lte('invoice_date', endOfLastMonth.toISOString()),
        supabase.from('balance_sheet_view').select('account_name, amount').eq('business_id', membership.business_id).eq('account_name', 'Accounts Payable').maybeSingle()
    ]);

    // METRIC 1: REVENUE (Assuming PnL view returns total income)
    // To support trends correctly, we should ideally query the ledger with date filters.
    // Given constraints, I will use INVOICES for Revenue Trend calculation as it has dates.
    // Total Revenue (All Time or YTD? usually PnL view is All Time). 
    // Let's use PnL for "Total" and Invoices for "Trend" proxy.
    const income = pnlResult.data?.filter(r => r.category === 'Income').reduce((sum, r) => sum + Number(r.net_amount), 0) || 0;
    const netProfit = pnlResult.data?.reduce((sum, r) => sum + Number(r.net_amount), 0) || 0;

    const gstPayable = gstResult.data?.reduce((sum, r) => sum + Number(r.total_payable), 0) || 0;
    const receivables = receivablesResult.data?.reduce((sum, r) => sum + Number(r.outstanding_amount), 0) || 0;

    // Accounts Payable (Liability is usually negative in Db-Cr logic, so flip sign for display if needed, 
    // but view might return it as absolute or negative. 
    // balance_sheet_view returns (Debit - Credit). For Liability, Credit > Debit, so result is Negative.
    // We want to show positive "Amount to Pay".
    const payables = Math.abs(Number(balanceSheetResult.data?.amount || 0));

    // TREND CALCULATION (Revenue based on Invoices)
    const thisMonthRevenue = currentMonthInvoices.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
    const lastMonthRevenue = lastMonthPnlResult.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

    let revenueTrend = 0;
    if (lastMonthRevenue > 0) {
        revenueTrend = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
        revenueTrend = 100; // 100% growth if starting from 0
    }

    // CHART DATA (Daily Revenue for Current Month)
    // Aggregate invoices by day
    const dailyRevenue: Record<string, number> = {};
    currentMonthInvoices.data?.forEach(inv => {
        if (!inv.invoice_date) return;
        const day = new Date(inv.invoice_date).toLocaleDateString('en-CA'); // YYYY-MM-DD
        dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(inv.total_amount || 0);
    });

    // Fill in missing days for smooth chart? Or just present days.
    const chartData = Object.keys(dailyRevenue).sort().map(date => ({
        date,
        value: dailyRevenue[date]
    }));

    // If empty (no invoices this month), provide dummy flat line or empty
    if (chartData.length === 0) {
        // Maybe show last few invoices if empty?
    }


    return (
        <MainDashboard
            metrics={{
                revenue: income,
                revenueTrend: Math.round(revenueTrend),
                revenueHistory: chartData,
                netProfit: netProfit,
                profitTrend: 0, // Hard to calc without time-based ledger
                profitHistory: [],
                gstPayable: gstPayable,
                receivables: receivables,
                payables: payables
            }}
            activity={{
                invoicesThisMonth: currentMonthInvoices.data?.length || 0,
                lastInvoiceDate: lastInvoiceResult.data?.invoice_date || null
            }}
            subscription={{
                status: business.subscription_status,
                trialEndsAt: business.trial_ends_at
            }}
            userRole={userRole}
            userName={userName}
        />
    );
}
