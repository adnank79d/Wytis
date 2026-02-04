'use server'

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsOverview {
    financials: {
        revenueHistory: { date: string; value: number }[];
        expenseHistory: { date: string; value: number }[];
        profitHistory: { date: string; value: number }[];
        currentRevenue: number;
        revenueGrowth: number; // Percentage
    };
    crm: {
        customerGrowthHistory: { date: string; value: number }[];
        totalCustomers: number;
        newCustomersThisMonth: number;
        activeDealsValue: number; // Potential revenue
    };
    payroll: {
        payrollCostHistory: { date: string; value: number }[];
        totalPayrollYTD: number;
        avgMonthlyPayroll: number;
    };
    topExpenses: {
        category: string;
        amount: number;
        percentage: number;
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
// MAIN: Get Analytics Overview
// ============================================================================

export async function getAnalyticsOverview(): Promise<AnalyticsOverview | null> {
    const context = await getBusinessContext();
    if (!context) return null;

    const { supabase, businessId } = context;

    // Define time range (Last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // Fetch Data in Parallel
    const [
        invoicesResult,
        customersResult,
        payrollResult,
        expensesResult,
        activeDealsResult
    ] = await Promise.all([
        // 1. Invoices (Revenue)
        supabase.from('invoices')
            .select('invoice_date, subtotal, status')
            .eq('business_id', businessId)
            .in('status', ['issued', 'paid'])
            .gte('invoice_date', sixMonthsAgo)
            .order('invoice_date', { ascending: true }),

        // 2. Customers (Growth)
        supabase.from('customers')
            .select('created_at')
            .eq('business_id', businessId)
            .gte('created_at', sixMonthsAgo)
            .order('created_at', { ascending: true }),

        // 3. Payroll (Costs)
        supabase.from('payroll_runs')
            .select('month, year, total_amount, status')
            .eq('business_id', businessId),
        // We'll filter/sort later as there won't be too many runs

        // 4. Expenses (P&L for Cost breakdown) - simplified
        // ideally we query the 'transactions' or 'expenses' table if it exists,
        // or the P&L view. Let's use P&L view for categorization.
        supabase.from('profit_and_loss_view')
            .select('account_name, net_amount, category')
            .eq('business_id', businessId)
            .eq('category', 'Expense'),

        // 5. Active Deals (CRM) - approximation based on negotiations
        // Assuming we might have a 'deals' table or using customer status
        // For now, let's use customers with status 'lead' or 'prospect' as "Active Deals" 
        // strictly, we don't have a deal value column yet, so we'll just count them or return 0 for now.
        // Actually, let's just return total count of active leads for now.
        supabase.from('customers')
            .select('id')
            .eq('business_id', businessId)
            .in('status', ['lead', 'negotiation'])
    ]);

    // --- Process Financials (Revenue) ---
    const revenueMap: Record<string, number> = {};
    const last6MonthsKeys: string[] = [];

    // Init map
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        revenueMap[key] = 0;
        last6MonthsKeys.push(key);
    }

    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    invoicesResult.data?.forEach(inv => {
        const d = new Date(inv.invoice_date);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (revenueMap[key] !== undefined) {
            revenueMap[key] += Number(inv.subtotal || 0);
        }

        // Current vs Last Month
        if (inv.invoice_date >= startOfCurrentMonth) {
            currentMonthRevenue += Number(inv.subtotal || 0);
        } else if (inv.invoice_date >= startOfLastMonth && inv.invoice_date < startOfCurrentMonth) {
            lastMonthRevenue += Number(inv.subtotal || 0);
        }
    });

    const revenueHistory = last6MonthsKeys.map(key => ({ date: key, value: revenueMap[key] }));
    const revenueGrowth = lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : (currentMonthRevenue > 0 ? 100 : 0);


    // --- Process CRM (Customer Growth) ---
    const customerMap: Record<string, number> = {};
    last6MonthsKeys.forEach(key => customerMap[key] = 0);

    let newCustomersThisMonth = 0;

    customersResult.data?.forEach(cus => {
        const d = new Date(cus.created_at);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (customerMap[key] !== undefined) {
            customerMap[key] += 1;
        }

        if (cus.created_at >= startOfCurrentMonth) {
            newCustomersThisMonth++;
        }
    });

    // Make cumulative or monthly? Let's do monthly new adds for now.
    const customerGrowthHistory = last6MonthsKeys.map(key => ({ date: key, value: customerMap[key] }));

    // Total Customers (need separate count if we paginated/filtered above, 
    // but assuming the query above filtered by date, we might miss old customers.
    // Let's do a quick separate count or just use what we have + "before 6 months"?
    // For accuracy, let's do a separate simplified count query.
    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['active']); // Only active customers


    // --- Process Payroll ---
    const payrollMap: Record<string, number> = {};
    last6MonthsKeys.forEach(key => payrollMap[key] = 0);

    let totalPayrollYTD = 0;

    payrollResult.data?.forEach(run => {
        // Construct date from month/year
        // month is usually string or number? In DB it is likely integer 1-12 or string.
        // Checking migration: month is integer, year is integer.
        const d = new Date(run.year, run.month - 1, 1);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });

        if (payrollMap[key] !== undefined) {
            payrollMap[key] += Number(run.total_amount || 0);
        }

        // YTD Logic (Current Year)
        if (run.year === new Date().getFullYear()) {
            totalPayrollYTD += Number(run.total_amount || 0);
        }
    });

    const payrollCostHistory = last6MonthsKeys.map(key => ({ date: key, value: payrollMap[key] }));
    const avgMonthlyPayroll = payrollResult.data && payrollResult.data.length > 0
        ? totalPayrollYTD / payrollResult.data.length // Simplified average
        : 0;

    // --- Process Expenses (Top Categories) ---
    const totalExpenses = expensesResult.data?.reduce((sum, r) => sum + Math.abs(Number(r.net_amount || 0)), 0) || 0;

    const topExpenses = expensesResult.data
        ?.map(r => ({
            category: r.account_name,
            amount: Math.abs(Number(r.net_amount || 0)),
            percentage: 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) // Top 5
        .map(item => ({
            ...item,
            percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
        })) || [];


    // --- Assemble ---
    return {
        financials: {
            revenueHistory,
            expenseHistory: [], // TODO: Accurate expense history requires transaction dates
            profitHistory: [], // TODO: Derived from Rev - Exp
            currentRevenue: currentMonthRevenue,
            revenueGrowth,
        },
        crm: {
            customerGrowthHistory,
            totalCustomers: totalCustomers || 0,
            newCustomersThisMonth,
            activeDealsValue: activeDealsResult.data?.length || 0 // Just count of leads for now
        },
        payroll: {
            payrollCostHistory,
            totalPayrollYTD,
            avgMonthlyPayroll
        },
        topExpenses
    };
}
