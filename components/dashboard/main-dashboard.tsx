"use client";

import { useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MainChart } from "@/components/dashboard/main-chart";
import { formatCompactCurrency } from "@/lib/format-currency";
import { ActivityItem, TopCustomer, Alert, GSTCompliance } from "@/lib/actions/dashboard";
import { Role } from "@/lib/permissions";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { Button } from "@/components/ui/button";
import {
    Plus, Download, Filter, ChartBar, Wallet, CreditCard, Users,
    ArrowRight, Printer, FileText, LayoutGrid, Bell, Search,
    MoreHorizontal, Calendar, ArrowUpRight, AlertTriangle, CheckCircle2, Truck,
    TrendingUp, TrendingDown, IndianRupee, PieChart, ShieldCheck, Check, Crown,
    Package, AlertOctagon, Layers, ArrowRightCircle, Box, Banknote, Clock, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MainDashboardProps {
    metrics: {
        revenue: number;
        revenueTrend?: number;
        revenueHistory?: { date: string; value: number }[];

        netProfit: number;
        profitTrend?: number;
        profitHistory?: { date: string; value: number }[];

        gstPayable: number;
        receivables: number;
        payables: number;
        cashBalance: number;
    };
    activity: {
        recentStream: ActivityItem[];
        overdueCount: number;
        overdueAmount: number;
    };
    inventory: {
        totalProducts: number;
        lowStock: number;
        totalValue: number;
    };
    topCustomers: TopCustomer[];
    alerts: Alert[];
    gstCompliance: GSTCompliance;
    subscription: {
        status: 'active' | 'expired' | 'paid';
        trialEndsAt: string;
    };
    userRole: Role;
    userName?: string;
}

export function MainDashboard({ metrics, activity, inventory, topCustomers, alerts, gstCompliance, subscription, userRole, userName = "User" }: MainDashboardProps) {

    const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Helper to format large numbers
    const formatLarge = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">

            {/* 0. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Hello, <span className="text-indigo-600">{userName}</span> <span className="animate-in fade-in zoom-in duration-1000 delay-300 inline-block origin-bottom-right hover:rotate-12 transition-transform cursor-default">👋</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Overview for {currentDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden md:inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">Owner View</span>
                    <Button variant="outline" size="sm" className="h-9">
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" /> This Month
                    </Button>
                </div>
            </div>

            {/* ZONE 1: TOP KPI ROW (5 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpICard title="Net Profit" value={formatCompactCurrency(metrics.netProfit)} trend={metrics.profitTrend} icon={TrendingUp} color="emerald" />
                <KpICard title="Sales (MTD)" value={formatCompactCurrency(metrics.revenue)} trend={metrics.revenueTrend} icon={CreditCard} color="violet" />
                <KpICard title="Receivables" value={formatCompactCurrency(metrics.receivables)} subtext={`${activity.overdueCount} overdue`} icon={Users} color="amber" />
                <KpICard title="Payables" value={formatCompactCurrency(metrics.payables)} icon={FileText} color="rose" />
                <KpICard title="GST Payable" value={formatCompactCurrency(metrics.gstPayable)} subtext="Due in 5 days" icon={IndianRupee} color="slate" />
            </div>

            {/* ZONE 2 & 3: SPLIT LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ZONE 2 LEFT: INSIGHTS (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-8">

                    {/* CASH CONTROL */}
                    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="flex flex-col md:flex-row">
                            {/* LEFT: Primary Focus (Available Cash) */}
                            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Available Cash</span>
                                </div>
                                <div className="mt-2">
                                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                                        {formatCompactCurrency(metrics.cashBalance)}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">
                                        After receivables & payables (today)
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <span className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                                        metrics.cashBalance > metrics.payables
                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full mr-2", metrics.cashBalance > metrics.payables ? "bg-emerald-600" : "bg-amber-600")} />
                                        {metrics.cashBalance > metrics.payables ? "Healthy Position" : "Tight Position"}
                                    </span>
                                </div>
                            </div>

                            {/* RIGHT: Drivers (Cash In/Out) */}
                            <div className="flex-1 p-6 md:p-8 bg-slate-50/30 flex flex-col justify-center gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-600">Cash In (30d)</span>
                                        <span className="text-base font-bold text-slate-900">+ {formatCompactCurrency(metrics.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-600">Cash Out (30d)</span>
                                        <span className="text-base font-bold text-slate-900">- {formatCompactCurrency(metrics.revenue * 0.72)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Net Movement</span>
                                        <span className="text-lg font-bold text-emerald-700">+ {formatCompactCurrency(metrics.revenue * 0.28)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM: Action Insight */}
                        <div className="bg-amber-50/50 border-t border-amber-100 p-4 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {formatLarge(activity.overdueAmount)} stuck in overdue receivables
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Recovering this would improve cash position by ~12%.
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 shadow-sm shrink-0 font-semibold w-full sm:w-auto">
                                View Overdue Invoices
                            </Button>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* TOP CUSTOMERS */}
                        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="py-4 border-b border-slate-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold text-slate-800">Top Customers</CardTitle>
                                <Button variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2">
                                    View All <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {topCustomers.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">
                                            <p className="text-sm">No customer data available</p>
                                        </div>
                                    ) : (
                                        topCustomers.map((customer, i) => {
                                            const colors = [
                                                "bg-indigo-100 text-indigo-700",
                                                "bg-emerald-100 text-emerald-700",
                                                "bg-amber-100 text-amber-700"
                                            ];
                                            const maxAmount = topCustomers[0]?.totalAmount || 1;
                                            const percentage = Math.round((customer.totalAmount / maxAmount) * 100);

                                            return (
                                                <div key={customer.id} className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Avatar className={cn("h-10 w-10 border border-white shadow-sm font-bold text-xs", colors[i % 3])}>
                                                                <AvatarFallback>{customer.initials}</AvatarFallback>
                                                            </Avatar>
                                                            {i === 0 && (
                                                                <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-900 p-0.5 rounded-full border border-white shadow-sm">
                                                                    <Crown className="w-2.5 h-2.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{customer.name}</p>
                                                            <p className="text-xs text-slate-500 font-medium">{customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? 's' : ''} • <span className="text-emerald-600">Active</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-sm font-bold text-slate-900">₹{customer.totalAmount.toLocaleString('en-IN')}</span>
                                                        <div className="flex items-center justify-end gap-1 mt-1">
                                                            <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ALERTS & ACTIONS */}
                        <Card className="border border-slate-200 shadow-sm rounded-xl h-full flex flex-col">
                            <CardHeader className="py-4 border-b border-slate-50 flex flex-row items-center justify-between bg-white rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-semibold text-slate-800">Alerts & Actions</CardTitle>
                                    {alerts.length > 0 && (
                                        <div className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                                            {alerts.length} Pending
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 bg-slate-50/30">
                                {alerts.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        <p className="text-sm">No alerts at this time</p>
                                        <p className="text-xs mt-1">All systems running smoothly</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {alerts.map((alert) => {
                                            // Map alert types to icons and colors
                                            const alertStyles = {
                                                gst: {
                                                    icon: AlertOctagon,
                                                    bg: 'bg-rose-50',
                                                    text: 'text-rose-600',
                                                    badgeBg: 'bg-rose-50',
                                                    badgeText: 'text-rose-600',
                                                    badgeBorder: 'border-rose-100',
                                                    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-100'
                                                },
                                                low_stock: {
                                                    icon: Package,
                                                    bg: 'bg-amber-50',
                                                    text: 'text-amber-600',
                                                    badgeBg: 'bg-amber-50',
                                                    badgeText: 'text-amber-600',
                                                    badgeBorder: 'border-amber-100',
                                                    buttonClass: 'border-amber-200 text-amber-700 hover:bg-amber-50 bg-white'
                                                },
                                                overdue: {
                                                    icon: AlertTriangle,
                                                    bg: 'bg-rose-50',
                                                    text: 'text-rose-600',
                                                    badgeBg: 'bg-rose-50',
                                                    badgeText: 'text-rose-600',
                                                    badgeBorder: 'border-rose-100',
                                                    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-100'
                                                },
                                                bank_reconciliation: {
                                                    icon: Layers,
                                                    bg: 'bg-indigo-50',
                                                    text: 'text-indigo-600',
                                                    badgeBg: 'bg-indigo-50',
                                                    badgeText: 'text-indigo-600',
                                                    badgeBorder: 'border-indigo-100',
                                                    buttonClass: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -ml-2 px-2'
                                                }
                                            };

                                            const style = alertStyles[alert.type];
                                            const Icon = style.icon;
                                            const priorityLabel = alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1);

                                            return (
                                                <div key={alert.id} className="p-4 hover:bg-white transition-colors group">
                                                    <div className="flex gap-3">
                                                        <div className={cn("mt-0.5 p-2 rounded-lg shrink-0 self-start group-hover:scale-105 transition-transform", style.bg, style.text)}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                                                                <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border", style.badgeBg, style.badgeText, style.badgeBorder)}>
                                                                    {priorityLabel}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                                {alert.message}
                                                            </p>
                                                            <div className="pt-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant={alert.type === 'bank_reconciliation' ? 'ghost' : (alert.type === 'low_stock' ? 'outline' : 'default')}
                                                                    className={cn("h-7 text-xs w-full sm:w-auto", style.buttonClass)}
                                                                    onClick={() => {
                                                                        if (alert.actionUrl) window.location.href = alert.actionUrl;
                                                                    }}
                                                                >
                                                                    {alert.actionLabel}{' '}
                                                                    {alert.type !== 'bank_reconciliation' && alert.type !== 'low_stock' && (
                                                                        <ArrowRightCircle className="w-3 h-3 ml-1.5" />
                                                                    )}
                                                                    {alert.type === 'bank_reconciliation' && (
                                                                        <ArrowRight className="w-3 h-3 ml-1" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ZONE 2 RIGHT: INDIAN CONTEXT */}
                <div className="flex flex-col gap-6">

                    {/* GST CONFIDENCE SECTION */}
                    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="p-5 border-b border-slate-50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Confidence</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(16,185,129,0.1)] animate-pulse",
                                    gstCompliance.status === 'good' ? 'bg-emerald-500' :
                                        gstCompliance.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                                )} />
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{gstCompliance.statusMessage}</h3>
                            </div>
                        </div>

                        <div className="px-5 py-4 bg-slate-50/50 space-y-3">
                            {gstCompliance.checks.length === 0 ? (
                                <div className="text-center py-2">
                                    <span className="text-sm text-slate-500">No compliance data available</span>
                                </div>
                            ) : (
                                gstCompliance.checks.map((check, index) => (
                                    <div key={index} className="flex items-start gap-2.5">
                                        <div className={cn(
                                            "mt-0.5 rounded-full p-0.5",
                                            check.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                        )}>
                                            {check.passed ? (
                                                <Check className="w-3 h-3" />
                                            ) : (
                                                <X className="w-3 h-3" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-slate-600">{check.label}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white">
                            <Button variant="outline" className="w-full justify-between group text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all bg-white font-medium">
                                <span className="text-xs font-semibold">Generate Summary</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </div>
                    </Card>

                    {/* INVENTORY HEALTH */}
                    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                        <CardHeader className="py-4 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Box className="w-4 h-4 text-slate-400" />
                                    <CardTitle className="text-sm font-medium text-slate-600">Inventory Health</CardTitle>
                                </div>
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                                    {formatCompactCurrency(inventory.totalValue)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-6">
                            {/* Stats */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{inventory.totalProducts}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-1">Total Stock Items</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-rose-600 mb-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-2xl font-bold">{inventory.lowStock}</span>
                                    </div>
                                    <p className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 inline-block">Low Stock</p>
                                </div>
                            </div>
                            {/* Health Bar */}
                            <div className="space-y-2">
                                <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                                    {inventory.totalProducts === 0 ? (
                                        <div className="h-full bg-slate-300 w-full" />
                                    ) : (
                                        <>
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, 100 - (inventory.lowStock / inventory.totalProducts * 100))}%` }} />
                                            <div className="h-full bg-rose-500" style={{ width: `${inventory.lowStock / inventory.totalProducts * 100}%` }} />
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Low</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Empty</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs h-8 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50">
                                View Valuation Report
                            </Button>
                        </CardContent>
                    </Card>

                    {/* MONEY AT RISK (Replaces Logistics) */}
                    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white">
                        <CardHeader className="py-4 border-b border-slate-50">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Money at Risk</CardTitle>
                                </div>
                                <CardDescription className="text-xs">Liabilities impacting cash flow</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">

                                {/* Item 1: Overdue. Context: 2 Customers */}
                                <div className="p-4 flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-700">Overdue Receivables</p>
                                        <div className="flex items-center gap-2 text-xs text-rose-600 font-medium">
                                            <Clock className="w-3 h-3" /> 2 customers &gt; 15 days
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900">{formatCompactCurrency(activity.overdueAmount)}</div>
                                        <Button variant="link" className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-semibold self-end">
                                            Send Reminder
                                        </Button>
                                    </div>
                                </div>

                                {/* Item 2: Unpaid Payables */}
                                <div className="p-4 flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-700">Unpaid Vendor Bills</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Banknote className="w-3 h-3" /> Due in next 30 days
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900">{formatCompactCurrency(metrics.payables)}</div>
                                        <Button variant="link" className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-semibold self-end">
                                            Schedule Payment
                                        </Button>
                                    </div>
                                </div>

                                {/* Item 3: GST Payable */}
                                <div className="p-4 flex items-center justify-between group bg-slate-50/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-700">GST Liability</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <FileText className="w-3 h-3" /> January Return
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900">{formatCompactCurrency(metrics.gstPayable)}</div>
                                        <Button variant="link" className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-semibold self-end">
                                            File Return
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

// Sub-components for cleaner code
function KpICard({ title, value, subtext, trend, icon: Icon, color = "slate" }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        violet: { bg: "bg-violet-50/50 hover:bg-violet-50", border: "border-violet-100 hover:border-violet-200", iconBg: "bg-violet-100 text-violet-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" },
        rose: { bg: "bg-rose-50/50 hover:bg-rose-50", border: "border-rose-100 hover:border-rose-200", iconBg: "bg-rose-100 text-rose-600", text: "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    };
    const s = styles[color];
    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between h-full min-h-[110px] transition-all duration-200 group cursor-default", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-3"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500/90">{title}</span>{Icon && (<div className={cn("p-1.5 rounded-md transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}</div>
            <div className="space-y-1"><div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div><div className="flex items-center gap-2 h-5">{trend !== undefined && (<div className={cn("flex items-center text-xs font-bold", trend > 0 ? "text-emerald-600" : (trend < 0 ? "text-rose-600" : "text-slate-500"))}>{trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : (trend < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null)}{trend > 0 ? "+" : ""}{trend}%</div>)}{subtext && (<span className="text-xs text-slate-500 font-medium truncate">{subtext}</span>)}</div></div>
        </div>
    );
}
