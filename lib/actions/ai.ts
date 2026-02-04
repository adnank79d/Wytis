'use server'

import { getDashboardActivity, getDashboardMetrics } from "./dashboard";
import { getFinancialReports } from "./reports";
import { getAnalyticsOverview } from "./analytics";

// ============================================================================
// TYPES
// ============================================================================

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    data?: any; // Structured data for UI rendering (e.g., charts, lists)
    type?: 'text' | 'metric' | 'list' | 'chart';
    timestamp: number;
}

// ============================================================================
// INTENT RECOGNITION & PROCESSING
// ============================================================================

export async function processAIQuery(query: string): Promise<AIMessage> {
    const lowerQuery = query.toLowerCase();

    // 1. REVENUE / SALES
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('income')) {
        const metrics = await getDashboardMetrics();
        const financialReport = await getFinancialReports();

        if (!metrics) {
            return createResponse("I couldn't retrieve your revenue data at the moment.");
        }

        const responseText = `Your total revenue for this month is ${formatCurrency(metrics.revenue)}. Trend: ${metrics.revenueTrend > 0 ? '+' : ''}${metrics.revenueTrend}% compared to last month.`;

        return createResponse(responseText, {
            value: metrics.revenue,
            trend: metrics.revenueTrend,
            history: metrics.revenueHistory
        }, 'chart'); // UI can render a mini chart
    }

    // 2. PROFIT / P&L
    if (lowerQuery.includes('profit') || lowerQuery.includes('margin') || lowerQuery.includes('net income')) {
        const metrics = await getDashboardMetrics();
        if (!metrics) return createResponse("Unable to fetch profit data.");

        return createResponse(
            `Your Net Profit is currently ${formatCurrency(metrics.netProfit)}.`,
            {
                value: metrics.netProfit,
                label: "Net Profit"
            },
            'metric'
        );
    }

    // 3. EXPENSES / SPENDING
    if (lowerQuery.includes('expense') || lowerQuery.includes('spending') || lowerQuery.includes('cost')) {
        const analytics = await getAnalyticsOverview();
        if (!analytics) return createResponse("Unable to fetch expense data.");

        const topExpenses = analytics.topExpenses.map(e => `${e.category}: ${formatCurrency(e.amount)}`).join('\n');

        return createResponse(
            `Here are your top expenses:\n${topExpenses}`,
            analytics.topExpenses,
            'list'
        );
    }

    // 4. CUSTOMERS / USERS
    if (lowerQuery.includes('customer') || lowerQuery.includes('client') || lowerQuery.includes('user')) {
        const analytics = await getAnalyticsOverview();
        if (!analytics) return createResponse("Unable to fetch customer data.");

        return createResponse(
            `You have a total of ${analytics.crm.totalCustomers} customers. ${analytics.crm.newCustomersThisMonth} new customers joined this month.`,
            {
                total: analytics.crm.totalCustomers,
                new: analytics.crm.newCustomersThisMonth,
                history: analytics.crm.customerGrowthHistory
            },
            'chart'
        );
    }

    // 5. PAYROLL / SALARY
    if (lowerQuery.includes('payroll') || lowerQuery.includes('salary') || lowerQuery.includes('employee')) {
        const analytics = await getAnalyticsOverview();
        if (!analytics) return createResponse("Unable to fetch payroll data.");

        return createResponse(
            `Your total year-to-date payroll cost is ${formatCurrency(analytics.payroll.totalPayrollYTD)}. Average monthly payroll is ${formatCurrency(analytics.payroll.avgMonthlyPayroll)}.`,
            {
                totalYTD: analytics.payroll.totalPayrollYTD,
                history: analytics.payroll.payrollCostHistory
            },
            'chart'
        );
    }

    // 6. GST / TAX
    if (lowerQuery.includes('gst') || lowerQuery.includes('tax')) {
        const metrics = await getDashboardMetrics();
        if (!metrics) return createResponse("Unable to fetch tax data.");

        return createResponse(
            `Your estimated GST Payable is ${formatCurrency(metrics.gstPayable)}.`,
            {
                value: metrics.gstPayable,
                label: "GST Payable"
            },
            'metric'
        );
    }

    // DEFAULT / FALLBACK
    return createResponse(
        "I can help you with insights on Revenue, Profit, Expenses, Customers, Payroll, and GST. Try asking: 'How is my revenue?' or 'Show me top expenses'."
    );
}

// ============================================================================
// HELPERS
// ============================================================================

function createResponse(content: string, data?: any, type: 'text' | 'metric' | 'list' | 'chart' = 'text'): AIMessage {
    return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        data,
        type,
        timestamp: Date.now()
    };
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}
