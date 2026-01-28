'use server'

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialReport {
    summary: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
        gstPayable: number;
        outstandingReceivables: number;
    };
    trends: {
        revenue: { date: string; value: number }[];
        expenses: { date: string; value: number }[];
        profit: { date: string; value: number }[];
    };
    categoryBreakdown: {
        name: string;
        value: number;
        percentage: number;
    }[];
    details: {
        income: { account_name: string; amount: number }[];
        expenses: { account_name: string; amount: number }[];
    };
    gst: {
        tax_period: string;
        gst_type: string;
        total_payable: number;
    }[];
    receivables: {
        invoice_number: string;
        customer_name: string;
        outstanding_amount: number;
        days_overdue: number;
        status: string;
    }[];
}

// ============================================================================
// HELPER: Get Business Context
// ============================================================================

async function getBusinessContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (!membership) return null;

    return { supabase, userId: user.id, businessId: membership.business_id, role: membership.role };
}

// ============================================================================
// REPORTS: Get All Financial Reports
// ============================================================================

export async function getFinancialReports(): Promise<FinancialReport | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    // Fetch data in parallel
    const [
        pnlResult,
        gstResult,
        receivablesResult,
        monthlyTrendsResult
    ] = await Promise.all([
        // 1. P&L (Current State)
        supabase.from('profit_and_loss_view').select('account_name, category, net_amount').eq('business_id', businessId),

        // 2. GST Summary
        supabase.from('gst_summary_view').select('*').eq('business_id', businessId).order('tax_period', { ascending: false }),

        // 3. Receivables (issued invoices)
        // We need to calculate days overdue manually from invoices table if not in view
        // Let's rely on manually querying invoices for granular details
        supabase.from('invoices')
            .select('invoice_number, customer_name, total_amount, due_date, status')
            .eq('business_id', businessId)
            .eq('status', 'issued')
            .order('due_date', { ascending: true }),

        // 4. Monthly Trends (Proxy using Invoices for Revenue, Transactions for Expenses)
        // This is a simplified approach. A real system needs a comprehensive monthly ledger view.
        // For now, we will aggregate last 6 months of invoices.
        // Let's query raw invoices for trend
        supabase.from('invoices')
            .select('invoice_date, subtotal')
            .eq('business_id', businessId)
            .in('status', ['issued', 'paid'])
            .gte('invoice_date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
            .order('invoice_date', { ascending: true })
    ]);

    // --- Process P&L Data ---
    const incomeRecords = pnlResult.data?.filter(r => r.category === 'Income') || [];
    const expenseRecords = pnlResult.data?.filter(r => r.category === 'Expense') || [];

    const totalRevenue = incomeRecords.reduce((sum, r) => sum + Number(r.net_amount || 0), 0);
    // Expenses are negative in DB usually, but view might normalize. Based on previous code, they need Math.abs
    // Check previous dashboard code: Math.abs(expenseRecords...)
    const totalExpenses = Math.abs(expenseRecords.reduce((sum, r) => sum + Number(r.net_amount || 0), 0));
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // --- Process GST ---
    const gstData = gstResult.data?.map(r => ({
        tax_period: r.tax_period,
        gst_type: r.gst_type,
        total_payable: Number(r.total_payable || 0)
    })) || [];
    const gstPayable = gstData.reduce((sum, r) => sum + r.total_payable, 0);

    // --- Process Receivables ---
    const now = new Date();
    const receivablesData = (receivablesResult.data || []).map(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date();
        const diffTime = Math.max(0, now.getTime() - dueDate.getTime());
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            invoice_number: inv.invoice_number,
            customer_name: inv.customer_name,
            outstanding_amount: Number(inv.total_amount),
            days_overdue: daysOverdue,
            status: daysOverdue > 0 ? 'Overdue' : 'Due Soon'
        };
    });
    const outstandingReceivables = receivablesData.reduce((sum, r) => sum + r.outstanding_amount, 0);

    // --- Process Trends (Revenue) ---
    // Aggregate by month for the last 6 months
    const trendMap: Record<string, number> = {};
    const trendResultRaw = monthlyTrendsResult.data || [];

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' }); // Jan 2026
        trendMap[key] = 0;
    }

    // Fill data
    (monthlyTrendsResult.data as any[])?.forEach(inv => {
        const d = new Date(inv.invoice_date);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (trendMap[key] !== undefined) {
            trendMap[key] += Number(inv.subtotal || 0);
        }
    });

    const revenueTrend = Object.entries(trendMap).map(([date, value]) => ({ date, value }));

    // --- Category Breakdown ---
    const categoryBreakdown = expenseRecords.map(r => ({
        name: r.account_name,
        value: Math.abs(Number(r.net_amount)),
        percentage: 0 // Calc below
    })).sort((a, b) => b.value - a.value);

    // Calculate percentages
    if (totalExpenses > 0) {
        categoryBreakdown.forEach(c => {
            c.percentage = (c.value / totalExpenses) * 100;
        });
    }

    return {
        summary: {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            gstPayable,
            outstandingReceivables
        },
        trends: {
            revenue: revenueTrend,
            expenses: [], // Need accurate time-based expense data (future work)
            profit: []
        },
        categoryBreakdown,
        details: {
            income: incomeRecords.map(r => ({ account_name: r.account_name, amount: Number(r.net_amount) })),
            expenses: expenseRecords.map(r => ({ account_name: r.account_name, amount: Math.abs(Number(r.net_amount)) }))
        },
        gst: gstData,
        receivables: receivablesData
    };
}
