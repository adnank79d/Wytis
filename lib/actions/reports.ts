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
    balanceSheet: {
        assets: { account_name: string; amount: number }[];
        liabilities: { account_name: string; amount: number }[];
        equity: { account_name: string; amount: number }[];
    };
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
        ledgerResult,
        monthlyTrendsResult
    ] = await Promise.all([
        // 1. P&L (Current State)
        supabase.from('profit_and_loss_view').select('account_name, category, net_amount').eq('business_id', businessId),

        // 2. Ledger Entries (For Balance Sheet)
        supabase.from('ledger_entries')
            .select('account_name, debit, credit')
            .eq('business_id', businessId),

        // 3. Monthly Trends
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
    const totalExpenses = Math.abs(expenseRecords.reduce((sum, r) => sum + Number(r.net_amount || 0), 0));
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // --- Process Balance Sheet ---
    const assets: Record<string, number> = {};
    const liabilities: Record<string, number> = {};
    const equity: Record<string, number> = {};

    // Group ledger entries by account
    const accountBalances: Record<string, number> = {};
    (ledgerResult.data || []).forEach((entry: any) => {
        const amount = Number(entry.debit) - Number(entry.credit);
        accountBalances[entry.account_name] = (accountBalances[entry.account_name] || 0) + amount;
    });

    // Classification Rules
    Object.entries(accountBalances).forEach(([account, balance]) => {
        // Skip zero balances? Maybe keep for completeness if non-zero
        if (Math.abs(balance) < 0.01) return;

        if (['Cash', 'Bank', 'Accounts Receivable', 'Inventory', 'GST Input Credit', 'Input CGST', 'Input SGST', 'Input IGST'].includes(account)) {
            // Assets (Debit is positive)
            assets[account] = balance;
        } else if (['Accounts Payable', 'GST Payable', 'Output CGST', 'Output SGST', 'Output IGST'].includes(account)) {
            // Liabilities (Credit is positive, so balance is negative, we invert for display)
            liabilities[account] = Math.abs(balance);
        } else if (['Capital', 'Retained Earnings', 'Opening Balance Equity'].includes(account)) {
            // Equity (Credit is positive)
            equity[account] = Math.abs(balance);
        }
        // P&L accounts are ignored here as they roll into Net Profit (Equity)
    });

    // Add Net Profit to Equity (Current Earnings)
    if (netProfit !== 0) {
        equity['Current Earnings'] = netProfit;
    }

    // Format for return
    const balanceSheet = {
        assets: Object.entries(assets).map(([n, v]) => ({ account_name: n, amount: v })),
        liabilities: Object.entries(liabilities).map(([n, v]) => ({ account_name: n, amount: v })),
        equity: Object.entries(equity).map(([n, v]) => ({ account_name: n, amount: v }))
    };

    // Calculate Summary Metrics from BS
    // We can use these for the summary section if we want accurate current snapshots
    // But P&L handles Revenue/Profit.
    // Receivables/Payables can come from BS accounts.
    const outstandingReceivables = assets['Accounts Receivable'] || 0;
    const accountsPayable = liabilities['Accounts Payable'] || 0; // Note: specific account
    const gstLiability = (liabilities['GST Payable'] || 0) + (liabilities['Output CGST'] || 0) + (liabilities['Output SGST'] || 0) + (liabilities['Output IGST'] || 0) - (assets['Input CGST'] || 0) - (assets['Input SGST'] || 0) - (assets['Input IGST'] || 0);
    // Note: GST computation above is rough. Ideally use the View. But this is strictly based on what we fetched.
    // To match previous logic, let's just use the BS classification.

    // --- Process Trends (Revenue) ---
    const trendMap: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        trendMap[key] = 0;
    }

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
        percentage: 0
    })).sort((a, b) => b.value - a.value);

    if (totalExpenses > 0) {
        categoryBreakdown.forEach(c => {
            c.percentage = (c.value / totalExpenses) * 100;
        });
    }

    // Since we removed 'gst' array from interface, we don't return it.
    // Wait, did I remove 'gst'? The user said "only three sections: Overview, P&L, Balance Sheet".
    // I should remove 'gst' from the interface too?
    // The previous interface had `gst`, `receivables`, `payables`.
    // I will replace ALL of them with `balanceSheet`.

    return {
        summary: {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            gstPayable: gstLiability > 0 ? gstLiability : 0, // Fallback
            outstandingReceivables
        },
        trends: {
            revenue: revenueTrend,
            expenses: [],
            profit: []
        },
        categoryBreakdown,
        details: {
            income: incomeRecords.map(r => ({ account_name: r.account_name, amount: Number(r.net_amount) })),
            expenses: expenseRecords.map(r => ({ account_name: r.account_name, amount: Math.abs(Number(r.net_amount)) }))
        },
        balanceSheet
    };
}
