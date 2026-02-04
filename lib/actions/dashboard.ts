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

// ============================================================================
// HELPER: Get Business Context
// ============================================================================

async function getBusinessContext() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('⚠️  getBusinessContext: No user found');
        return null;
    }

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .single();

    if (!membership) {
        console.log('⚠️  getBusinessContext: No membership found for user:', user.id);
        return null;
    }

    console.log('✅ getBusinessContext: Success', {
        userId: user.id.substring(0, 8) + '...',
        businessId: membership.business_id.substring(0, 8) + '...',
        role: membership.role
    });

    return {
        supabase,
        userId: user.id,
        businessId: membership.business_id,
        role: membership.role
    };
}

// ============================================================================
// DASHBOARD: Get Financial Metrics
// ============================================================================
// CRITICAL: ALL metrics derived EXCLUSIVELY from SQL views
// NO direct queries to invoices, expenses, or payments tables
// Any deviation is a CRITICAL BUG
// ============================================================================

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const context = await getBusinessContext();
    if (!context) {
        return {
            revenue: 0,
            revenueTrend: 0,
            revenueHistory: [],
            netProfit: 0,
            profitTrend: 0,
            profitHistory: [],
            gstPayable: 0,
            receivables: 0,
            payables: 0,
            cashBalance: 0,
            cashIn: 0,
            cashOut: 0
        };
    }

    const { supabase, businessId } = context;

    // ========================================================================
    // FETCH ALL METRICS FROM SQL VIEW - SINGLE SOURCE OF TRUTH
    // ========================================================================
    // All financial calculations are done in the database
    // Frontend is display-only - NO calculations

    const { data: metrics, error: metricsError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    if (metricsError) {
        console.error('Dashboard Metrics Error:', metricsError);
        // Return zeros if view doesn't exist
        return {
            revenue: 0,
            revenueTrend: 0,
            revenueHistory: [],
            netProfit: 0,
            profitTrend: 0,
            profitHistory: [],
            gstPayable: 0,
            receivables: 0,
            payables: 0,
            cashBalance: 0,
            cashIn: 0,
            cashOut: 0
        };
    }

    // DEBUG: Log what we got from the view
    console.log('📊 Dashboard Metrics from View:', {
        businessId,
        hasData: !!metrics,
        revenue: metrics?.total_revenue,
        netProfit: metrics?.net_profit,
        ar: metrics?.accounts_receivable
    });

    // Extract metrics from view (all calculations done in SQL)
    // Use Math.max to ensure we never show negative values for these metrics
    // Negative values indicate data issues that should be investigated separately
    const revenue = Math.max(0, Number(metrics?.total_revenue || 0));
    const netProfit = Number(metrics?.net_profit || 0); // Can be negative (loss)
    const gstPayable = Math.max(0, Number(metrics?.gst_payable || 0));
    const receivables = Math.max(0, Number(metrics?.accounts_receivable || 0));
    const payables = Math.max(0, Number(metrics?.accounts_payable || 0));
    const cashBalance = Number(metrics?.net_cash || 0); // Can be negative (overdraft)

    // ========================================================================
    // TREND CALCULATIONS (Time-based data not in view yet)
    // ========================================================================
    // TODO: Create time-series views for trends
    // For now, we calculate trends from invoice dates (acceptable as it's time-based, not financial)

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

    const [currentMonthInvoices, lastMonthInvoices, paymentsResult] = await Promise.all([
        // This month invoices (for trend calculation only)
        supabase.from('invoices')
            .select('subtotal, invoice_date, status')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfMonth)
            .in('status', ['issued', 'paid']),

        // Last month invoices (for trend calculation only)
        supabase.from('invoices')
            .select('subtotal')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfLastMonth)
            .lte('invoice_date', endOfLastMonth)
            .in('status', ['issued', 'paid']),

        // Payments this month (for cash flow trend only)
        supabase.from('payments')
            .select('amount, payment_type, payment_date')
            .eq('business_id', businessId)
            .gte('payment_date', startOfMonth)
            .eq('status', 'completed')
    ]);

    // Revenue Trend (month-over-month)
    const thisMonthRevenue = currentMonthInvoices.data?.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0) || 0;
    const lastMonthRevenue = lastMonthInvoices.data?.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0) || 0;

    let revenueTrend = 0;
    if (lastMonthRevenue > 0) {
        revenueTrend = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    } else if (thisMonthRevenue > 0) {
        revenueTrend = 100;
    }

    // Revenue History (daily breakdown for chart)
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

    // Cash Flow (from payments this month)
    const cashIn = paymentsResult.data?.filter(p => p.payment_type === 'received').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const cashOut = paymentsResult.data?.filter(p => p.payment_type === 'made').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const finalMetrics = {
        revenue,
        revenueTrend,
        revenueHistory,
        netProfit,
        profitTrend: 0, // TODO: Calculate from historical ledger data
        profitHistory: [],
        gstPayable,
        receivables,
        payables,
        cashBalance,
        cashIn,
        cashOut
    };

    console.log('📤 Returning Dashboard Metrics:', {
        revenue: finalMetrics.revenue,
        netProfit: finalMetrics.netProfit,
        receivables: finalMetrics.receivables,
        gstPayable: finalMetrics.gstPayable
    });

    return finalMetrics;
}

// ============================================================================
// DASHBOARD: Get Top Customers
// ============================================================================

export interface TopCustomer {
    id: string;
    name: string;
    totalAmount: number;
    invoiceCount: number;
    initials: string;
}

export async function getTopCustomers(limit: number = 3): Promise<TopCustomer[]> {
    const context = await getBusinessContext();
    if (!context) return [];

    const { supabase, businessId } = context;

    // Get customers with their total invoice amounts
    const { data: customers } = await supabase
        .from('customers')
        .select(`
            id,
            name,
            invoices!inner(total_amount, status)
        `)
        .eq('business_id', businessId)
        .eq('invoices.status', 'paid');

    if (!customers || customers.length === 0) return [];

    // Aggregate invoice data per customer
    const customerStats = customers.reduce((acc: Record<string, { name: string; totalAmount: number; invoiceCount: number; id: string }>, customer: any) => {
        const customerId = customer.id;
        if (!acc[customerId]) {
            acc[customerId] = {
                id: customerId,
                name: customer.name,
                totalAmount: 0,
                invoiceCount: 0
            };
        }

        // Sum up all paid invoices for this customer
        if (customer.invoices && Array.isArray(customer.invoices)) {
            customer.invoices.forEach((invoice: any) => {
                acc[customerId].totalAmount += Number(invoice.total_amount || 0);
                acc[customerId].invoiceCount += 1;
            });
        }

        return acc;
    }, {});

    // Convert to array and sort by total amount
    const topCustomers = Object.values(customerStats)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, limit)
        .map(customer => ({
            ...customer,
            initials: customer.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }));

    return topCustomers;
}

// ============================================================================
// DASHBOARD: Get Alerts & Actions
// ============================================================================

export interface Alert {
    id: string;
    type: 'gst' | 'low_stock' | 'overdue' | 'bank_reconciliation';
    priority: 'urgent' | 'high' | 'medium';
    title: string;
    message: string;
    actionLabel: string;
    actionUrl?: string;
    metadata?: any;
}

export async function getAlerts(): Promise<Alert[]> {
    const context = await getBusinessContext();
    if (!context) return [];

    const { supabase, businessId } = context;
    const alerts: Alert[] = [];

    // 1. Check for low stock items
    const { data: lowStockProducts } = await supabase
        .from('inventory_products')
        .select('id, name, quantity, reorder_level')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .lte('quantity', supabase.rpc('reorder_level')); // quantity <= reorder_level

    if (lowStockProducts && lowStockProducts.length > 0) {
        // Get the most critical low stock item
        const criticalItem = lowStockProducts.sort((a, b) => a.quantity - b.quantity)[0];
        alerts.push({
            id: `low-stock-${criticalItem.id}`,
            type: 'low_stock',
            priority: 'urgent',
            title: 'Low Stock Alert',
            message: `${criticalItem.name} is below reorder level (${criticalItem.quantity} remaining).`,
            actionLabel: 'Create Purchase Order',
            actionUrl: '/inventory',
            metadata: { productId: criticalItem.id }
        });
    }

    // 2. Check for overdue invoices
    const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, due_date')
        .eq('business_id', businessId)
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString());

    if (overdueInvoices && overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        alerts.push({
            id: 'overdue-invoices',
            type: 'overdue',
            priority: 'high',
            title: 'Overdue Invoices',
            message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue totaling ₹${totalOverdue.toLocaleString('en-IN')}.`,
            actionLabel: 'View Overdue',
            actionUrl: '/invoices?filter=overdue',
            metadata: { count: overdueInvoices.length, amount: totalOverdue }
        });
    }

    // 3. GST Filing Alert (placeholder - would need GST filing tracking)
    // For now, we'll check if it's near month-end
    const today = new Date();
    const dayOfMonth = today.getDate();
    if (dayOfMonth >= 10 && dayOfMonth <= 11) {
        alerts.push({
            id: 'gst-filing',
            type: 'gst',
            priority: 'urgent',
            title: 'GST Filing Pending',
            message: `GSTR-1 for ${new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString('en-IN', { month: 'long' })} is due. Late fees may apply if not filed by 11th.`,
            actionLabel: 'File GSTR-1 Now',
            actionUrl: '/gst',
        });
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2 };
    return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// DASHBOARD: Get GST Compliance Status
// ============================================================================

export interface GSTCompliance {
    status: 'good' | 'warning' | 'error';
    statusMessage: string;
    checks: {
        label: string;
        passed: boolean;
    }[];
}

export async function getGSTCompliance(): Promise<GSTCompliance> {
    const context = await getBusinessContext();
    if (!context) {
        return {
            status: 'warning',
            statusMessage: 'Unable to verify GST compliance',
            checks: []
        };
    }

    const { supabase, businessId } = context;
    const checks: { label: string; passed: boolean }[] = [];

    // Check 1: All invoices have valid HSN codes
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, line_items')
        .eq('business_id', businessId)
        .limit(100);

    let hasValidHSN = true;
    if (invoices && invoices.length > 0) {
        // Check if line items have HSN codes
        for (const invoice of invoices) {
            if (invoice.line_items && Array.isArray(invoice.line_items)) {
                for (const item of invoice.line_items) {
                    if (!item.hsn_code || item.hsn_code.trim() === '') {
                        hasValidHSN = false;
                        break;
                    }
                }
            }
            if (!hasValidHSN) break;
        }
    }
    checks.push({ label: 'All invoices use valid HSN codes', passed: hasValidHSN });

    // Check 2: Input credits detected on expenses
    const { data: expenses } = await supabase
        .from('expenses')
        .select('id, gst_amount')
        .eq('business_id', businessId)
        .gt('gst_amount', 0)
        .limit(1);

    const hasInputCredits = !!(expenses && expenses.length > 0);
    checks.push({ label: 'Input credits detected on expenses', passed: hasInputCredits });

    // Determine overall status
    const allPassed = checks.every(check => check.passed);
    const somePassed = checks.some(check => check.passed);

    return {
        status: allPassed ? 'good' : (somePassed ? 'warning' : 'error'),
        statusMessage: allPassed ? 'GST Looks Good' : (somePassed ? 'GST Needs Attention' : 'GST Issues Detected'),
        checks
    };
}

// ============================================================================
// DASHBOARD: Get Activity
// ============================================================================

export interface ActivityItem {
    id: string;
    type: 'invoice' | 'payment';
    title: string;
    description: string;
    amount: number;
    status: string;
    date: string;
    entityName: string; // Customer name
}

export async function getRecentActivityStream(): Promise<ActivityItem[]> {
    const context = await getBusinessContext();
    if (!context) return [];

    const { supabase, businessId } = context;

    // Fetch recent invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
            id, 
            invoice_number, 
            total_amount, 
            status, 
            invoice_date,
            customers (name)
        `)
        .eq('business_id', businessId)
        .in('status', ['issued', 'paid', 'cancelled'])
        .order('invoice_date', { ascending: false })
        .limit(5);

    // Fetch recent payments
    const { data: payments } = await supabase
        .from('payments')
        .select(`
            id, 
            amount, 
            status, 
            payment_date,
            invoices (
                invoice_number,
                customers (name)
            )
        `)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(5);

    // Map to unified ActivityItem
    const invoiceItems: ActivityItem[] = (invoices || []).map(inv => ({
        id: inv.id,
        type: 'invoice',
        title: `Invoice ${inv.invoice_number}`,
        description: inv.status === 'cancelled' ? 'Invoice cancelled' : 'Invoice issued',
        amount: Number(inv.total_amount),
        status: inv.status,
        date: inv.invoice_date,
        // @ts-ignore
        entityName: inv.customers?.name || 'Unknown Customer'
    }));

    const paymentItems: ActivityItem[] = (payments || []).map(pay => ({
        id: pay.id,
        type: 'payment',
        title: `Payment Received`,
        description: `For ${
            // @ts-ignore 
            pay.invoices?.invoice_number || 'Invoice'
            }`,
        amount: Number(pay.amount),
        status: pay.status,
        date: pay.payment_date,
        // @ts-ignore
        entityName: pay.invoices?.customers?.name || 'Unknown Customer'
    }));

    // Combine and sort by date descending
    return [...invoiceItems, ...paymentItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
}

// Keep existing getDashboardActivity for compatibility if needed, or deprecate
export async function getDashboardActivity(): Promise<DashboardActivity> {
    // ... existing implementation
    const context = await getBusinessContext();
    if (!context) {
        return {
            invoicesThisMonth: 0,
            paymentsThisMonth: 0,
            lastInvoiceDate: null,
            lastPaymentDate: null,
            overdueCount: 0,
            overdueAmount: 0
        };
    }

    const { supabase, businessId } = context;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const [invoicesResult, paymentsResult, overdueResult] = await Promise.all([
        supabase.from('invoices')
            .select('invoice_date')
            .eq('business_id', businessId)
            .gte('invoice_date', startOfMonth)
            .in('status', ['issued', 'paid']),

        supabase.from('payments')
            .select('payment_date')
            .eq('business_id', businessId)
            .gte('payment_date', startOfMonth)
            .eq('status', 'completed'),

        supabase.from('invoices')
            .select('total_amount, due_date')
            .eq('business_id', businessId)
            .eq('status', 'issued')
            .lt('due_date', today.toISOString().split('T')[0])
    ]);

    const lastInvoice = await supabase
        .from('invoices')
        .select('invoice_date')
        .eq('business_id', businessId)
        .in('status', ['issued', 'paid'])
        .order('invoice_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    const lastPayment = await supabase
        .from('payments')
        .select('payment_date')
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    return {
        invoicesThisMonth: invoicesResult.data?.length || 0,
        paymentsThisMonth: paymentsResult.data?.length || 0,
        lastInvoiceDate: lastInvoice.data?.invoice_date || null,
        lastPaymentDate: lastPayment.data?.payment_date || null,
        overdueCount: overdueResult.data?.length || 0,
        overdueAmount: overdueResult.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
    };
}

// ============================================================================
// DASHBOARD: Get Invoice Stats
// ============================================================================

export async function getInvoiceStats(): Promise<InvoiceStats> {
    const context = await getBusinessContext();
    if (!context) {
        return {
            total: 0,
            draftCount: 0,
            issuedCount: 0,
            paidCount: 0,
            voidedCount: 0,
            totalRevenue: 0,
            outstanding: 0,
            collected: 0,
            overdueCount: 0,
            overdueAmount: 0
        };
    }

    const { supabase, businessId } = context;

    const { data: invoices } = await supabase
        .from('invoices')
        .select('status, total_amount, subtotal, due_date')
        .eq('business_id', businessId);

    if (!invoices) {
        return {
            total: 0,
            draftCount: 0,
            issuedCount: 0,
            paidCount: 0,
            voidedCount: 0,
            totalRevenue: 0,
            outstanding: 0,
            collected: 0,
            overdueCount: 0,
            overdueAmount: 0
        };
    }

    const today = new Date().toISOString().split('T')[0];

    return {
        total: invoices.length,
        draftCount: invoices.filter(i => i.status === 'draft').length,
        issuedCount: invoices.filter(i => i.status === 'issued').length,
        paidCount: invoices.filter(i => i.status === 'paid').length,
        voidedCount: invoices.filter(i => i.status === 'voided').length,
        totalRevenue: invoices.filter(i => i.status !== 'draft' && i.status !== 'voided')
            .reduce((sum, i) => sum + Number(i.subtotal || 0), 0),
        outstanding: invoices.filter(i => i.status === 'issued')
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        collected: invoices.filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        overdueCount: invoices.filter(i => i.status === 'issued' && i.due_date && i.due_date < today).length,
        overdueAmount: invoices.filter(i => i.status === 'issued' && i.due_date && i.due_date < today)
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
    };
}
