'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardMetrics {
    // Revenue & Profit
    revenue: number;
    revenueTrend: number;
    revenueHistory: { date: string; value: number }[];
    netProfit: number;
    profitTrend: number;
    profitHistory: { date: string; value: number }[];

    // Liabilities
    gstPayable: number;
    receivables: number;
    payables: number;

    // Cash Flow
    cashBalance: number;
    cashIn: number;
    cashOut: number;
}

export interface DashboardActivity {
    invoicesThisMonth: number;
    paymentsThisMonth: number;
    lastInvoiceDate: string | null;
    lastPaymentDate: string | null;
    overdueCount: number;
    overdueAmount: number;
}

export interface InvoiceStats {
    total: number;
    draftCount: number;
    issuedCount: number;
    paidCount: number;
    voidedCount: number;
    totalRevenue: number;
    outstanding: number;
    collected: number;
    overdueCount: number;
    overdueAmount: number;
}

export interface PaymentStats {
    totalReceived: number;
    totalPaid: number;
    pendingCount: number;
    recentCount: number;
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
// DASHBOARD: Get All Metrics (Unified Query)
// ============================================================================

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // Parallel queries for performance
    const [
        pnlResult,
        gstResult,
        receivablesResult,
        payablesResult,
        currentMonthInvoices,
        lastMonthInvoices,
        paymentsResult,
        bankBalanceResult
    ] = await Promise.all([
        // P&L View - Income & Expenses
        supabase.from('profit_and_loss_view')
            .select('account_name, category, net_amount')
            .eq('business_id', businessId),

        // GST Summary
        supabase.from('gst_summary_view')
            .select('total_payable')
            .eq('business_id', businessId),

        // Receivables (issued invoices)
        supabase.from('invoices')
            .select('total_amount')
            .eq('business_id', businessId)
            .eq('status', 'issued'),

        // Payables (balance sheet)
        supabase.from('balance_sheet_view')
            .select('amount')
            .eq('business_id', businessId)
            .eq('account_name', 'Accounts Payable')
            .maybeSingle(),

        // Current month invoices (for trend)
        supabase.from('invoices')
            .select('subtotal, invoice_date, status')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfMonth)
            .in('status', ['issued', 'paid']),

        // Last month invoices (for trend)
        supabase.from('invoices')
            .select('subtotal')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfLastMonth)
            .lte('invoice_date', endOfLastMonth)
            .in('status', ['issued', 'paid']),

        // Payments this month
        supabase.from('payments')
            .select('amount, payment_type, payment_date')
            .eq('business_id', businessId)
            .gte('payment_date', startOfMonth)
            .eq('status', 'completed'),

        // Bank balance from ledger
        supabase.from('balance_sheet_view')
            .select('amount')
            .eq('business_id', businessId)
            .eq('account_name', 'Bank')
            .maybeSingle()
    ]);

    // Calculate Revenue (from P&L - Sales + Other Income)
    const salesRecord = pnlResult.data?.find(r => r.account_name === 'Sales');
    const otherIncomeRecord = pnlResult.data?.find(r => r.account_name === 'Other Income');
    const revenue = Number(salesRecord?.net_amount || 0) + Number(otherIncomeRecord?.net_amount || 0);

    // Calculate Net Profit
    const incomeRecords = pnlResult.data?.filter(r => r.category === 'Income') || [];
    const expenseRecords = pnlResult.data?.filter(r => r.category === 'Expense') || [];
    const totalIncome = incomeRecords.reduce((sum, r) => sum + Number(r.net_amount || 0), 0);
    const totalExpense = Math.abs(expenseRecords.reduce((sum, r) => sum + Number(r.net_amount || 0), 0));
    const netProfit = totalIncome - totalExpense;

    // GST
    const gstPayable = gstResult.data?.reduce((sum, r) => sum + Number(r.total_payable || 0), 0) || 0;

    // Receivables (from issued invoices)
    const receivables = receivablesResult.data?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0;

    // Payables
    const payables = Math.abs(Number(payablesResult.data?.amount || 0));

    // Revenue Trend
    const thisMonthRevenue = currentMonthInvoices.data?.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0) || 0;
    const lastMonthRevenue = lastMonthInvoices.data?.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0) || 0;

    let revenueTrend = 0;
    if (lastMonthRevenue > 0) {
        revenueTrend = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    } else if (thisMonthRevenue > 0) {
        revenueTrend = 100;
    }

    // Revenue History (daily)
    const dailyRevenue: Record<string, number> = {};
    currentMonthInvoices.data?.forEach(inv => {
        if (!inv.invoice_date) return;
        const day = inv.invoice_date.split('T')[0];
        dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(inv.subtotal || 0);
    });
    const revenueHistory = Object.keys(dailyRevenue).sort().map(date => ({
        date,
        value: dailyRevenue[date]
    }));

    // Cash Flow
    const cashBalance = Number(bankBalanceResult.data?.amount || 0);
    const cashIn = paymentsResult.data?.filter(p => p.payment_type === 'received').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const cashOut = paymentsResult.data?.filter(p => p.payment_type === 'made').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    return {
        revenue,
        revenueTrend,
        revenueHistory,
        netProfit,
        profitTrend: 0, // Would need monthly ledger data
        profitHistory: [],
        gstPayable,
        receivables,
        payables,
        cashBalance,
        cashIn,
        cashOut
    };
}

// ============================================================================
// DASHBOARD: Get Activity
// ============================================================================

export async function getDashboardActivity(): Promise<DashboardActivity | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [invoicesResult, paymentsResult, overdueResult] = await Promise.all([
        // Invoices this month
        supabase.from('invoices')
            .select('id, invoice_date')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfMonth)
            .order('invoice_date', { ascending: false }),

        // Payments this month
        supabase.from('payments')
            .select('id, payment_date')
            .eq('business_id', businessId)
            .gte('payment_date', startOfMonth)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false }),

        // Overdue invoices
        supabase.from('invoices')
            .select('id, total_amount, due_date')
            .eq('business_id', businessId)
            .eq('status', 'issued')
            .lt('due_date', today)
    ]);

    return {
        invoicesThisMonth: invoicesResult.data?.length || 0,
        paymentsThisMonth: paymentsResult.data?.length || 0,
        lastInvoiceDate: invoicesResult.data?.[0]?.invoice_date || null,
        lastPaymentDate: paymentsResult.data?.[0]?.payment_date || null,
        overdueCount: overdueResult.data?.length || 0,
        overdueAmount: overdueResult.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
    };
}

// ============================================================================
// INVOICES: Get Stats (Aligned with Dashboard)
// ============================================================================

export async function getInvoiceStats(): Promise<InvoiceStats | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;
    const today = new Date().toISOString().split('T')[0];

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, total_amount, subtotal, due_date')
        .eq('business_id', businessId);

    if (error || !invoices) return null;

    const draftInvoices = invoices.filter(i => i.status === 'draft');
    const issuedInvoices = invoices.filter(i => i.status === 'issued');
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const voidedInvoices = invoices.filter(i => i.status === 'voided');
    const overdueInvoices = issuedInvoices.filter(i => i.due_date && i.due_date < today);

    return {
        total: invoices.length,
        draftCount: draftInvoices.length,
        issuedCount: issuedInvoices.length,
        paidCount: paidInvoices.length,
        voidedCount: voidedInvoices.length,
        totalRevenue: [...issuedInvoices, ...paidInvoices].reduce((sum, i) => sum + Number(i.subtotal || 0), 0),
        outstanding: issuedInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        collected: paidInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
    };
}

// ============================================================================
// PAYMENTS: Get Stats (Aligned with Dashboard)
// ============================================================================

export async function getPaymentStats(): Promise<PaymentStats | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: payments, error } = await supabase
        .from('payments')
        .select('payment_type, amount, status, payment_date')
        .eq('business_id', businessId);

    if (error || !payments) return null;

    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const recentPayments = completedPayments.filter(p => p.payment_date >= thirtyDaysAgo);

    return {
        totalReceived: completedPayments.filter(p => p.payment_type === 'received').reduce((sum, p) => sum + Number(p.amount || 0), 0),
        totalPaid: completedPayments.filter(p => p.payment_type === 'made').reduce((sum, p) => sum + Number(p.amount || 0), 0),
        pendingCount: pendingPayments.length,
        recentCount: recentPayments.length
    };
}

// ============================================================================
// RECENT ACTIVITY: Get Latest Transactions
// ============================================================================

export interface RecentActivity {
    id: string;
    type: 'invoice_created' | 'invoice_paid' | 'payment_received' | 'payment_made' | 'expense_added';
    description: string;
    amount: number;
    date: string;
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const context = await getBusinessContext();
    if (!context) return [];

    const { supabase, businessId } = context;

    // Get recent invoices and payments
    const [invoicesResult, paymentsResult] = await Promise.all([
        supabase.from('invoices')
            .select('id, invoice_number, customer_name, total_amount, status, created_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(limit),

        supabase.from('payments')
            .select('id, party_name, amount, payment_type, status, created_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(limit)
    ]);

    const activities: RecentActivity[] = [];

    // Map invoices to activities
    invoicesResult.data?.forEach(inv => {
        activities.push({
            id: inv.id,
            type: inv.status === 'paid' ? 'invoice_paid' : 'invoice_created',
            description: `Invoice #${inv.invoice_number} - ${inv.customer_name}`,
            amount: Number(inv.total_amount),
            date: inv.created_at
        });
    });

    // Map payments to activities
    paymentsResult.data?.forEach(pay => {
        if (pay.status !== 'completed') return;
        activities.push({
            id: pay.id,
            type: pay.payment_type === 'received' ? 'payment_received' : 'payment_made',
            description: `${pay.payment_type === 'received' ? 'Received from' : 'Paid to'} ${pay.party_name}`,
            amount: Number(pay.amount),
            date: pay.created_at
        });
    });

    // Sort by date and limit
    return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}

// ============================================================================
// REFRESH ALL: Trigger revalidation of all dashboard paths
// ============================================================================

export async function refreshDashboard() {
    revalidatePath('/dashboard');
    revalidatePath('/invoices');
    revalidatePath('/payments');
    revalidatePath('/reports');
    revalidatePath('/');
}
