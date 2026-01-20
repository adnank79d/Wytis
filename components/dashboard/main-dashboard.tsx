"use client";

import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Activity, Users, FilePlus, FileText, Lock, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCompactCurrency } from "@/lib/format-currency";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    };
    activity: {
        invoicesThisMonth: number;
        lastInvoiceDate: string | null;
    };
    subscription: {
        status: 'active' | 'expired' | 'paid';
        trialEndsAt: string;
    };
    userRole: Role;
    userName?: string;
}

function formatDate(date: string | null) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

export function MainDashboard({ metrics, activity, subscription, userRole, userName = "User" }: MainDashboardProps) {
    const isTrialExpired = subscription.status === 'expired';
    const canCreateInvoice = userRole === 'owner' && !isTrialExpired;
    const isRestricted = userRole === 'staff';
    const greeting = getGreeting();

    return (
        <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full pb-8 md:pb-12 animate-in fade-in duration-500">

            {/* WELCOME SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {greeting}, <span className="text-primary">{userName}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-0.5 md:mt-1">
                        Here's what's happening with your business today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild={canCreateInvoice}
                        disabled={!canCreateInvoice}
                        size="default"
                        className={cn(
                            "shadow-lg hover:shadow-xl transition-all text-sm md:text-base h-9 md:h-10 px-3 md:px-4",
                            canCreateInvoice ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
                        )}
                    >
                        {canCreateInvoice ? (
                            <Link href="/invoices/new">
                                <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                                New Invoice
                            </Link>
                        ) : (
                            <span className="flex items-center cursor-not-allowed">
                                <Lock className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                                New Invoice
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 auto-rows-[minmax(100px,auto)] md:auto-rows-[minmax(140px,auto)]">

                {/* 1. REVENUE (Large Card) */}
                <div className="col-span-2 md:col-span-2 lg:col-span-2 row-span-1 md:row-span-2">
                    <KpiCard
                        label="Total Revenue"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.revenue)}
                        icon={isRestricted ? Lock : IndianRupee}
                        className="h-full"
                        trend={metrics.revenueTrend}
                        chartData={metrics.revenueHistory}
                        chartColor="#6366f1" // Indigo
                    />
                </div>

                {/* 2. NET PROFIT */}
                <div className="col-span-1 md:col-span-1 row-span-1">
                    <KpiCard
                        label="Net Profit"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.netProfit)}
                        icon={isRestricted ? Lock : TrendingUp}
                        trend={metrics.profitTrend}
                        chartData={metrics.profitHistory} // Reuse logic or separate if needed
                        chartColor="#10b981" // Emerald
                    />
                </div>

                {/* 3. RECEIVABLES */}
                <div className="col-span-1 md:col-span-1 row-span-1">
                    <KpiCard
                        label="Receivables"
                        value={formatCompactCurrency(metrics.receivables)}
                        caption="Expected income"
                        icon={Users}
                        className="bg-orange-50/50 dark:bg-orange-950/10"
                    />
                </div>

                {/* 4. GST LIABILITY */}
                <div className="col-span-1 md:col-span-1 row-span-1">
                    <KpiCard
                        label="GST Payable"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.gstPayable)}
                        icon={isRestricted ? Lock : Activity}
                    />
                </div>

                {/* 5. CREDIT PAYABLE */}
                <div className="col-span-1 md:col-span-1 row-span-1">
                    <KpiCard
                        label="Credit Payable"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.payables)}
                        caption="Amount to Pay"
                        icon={isRestricted ? Lock : FilePlus} // Example icon, could use something more relevant like 'CreditCard' or 'Wallet'
                        className="bg-red-50/50 dark:bg-red-950/10"
                    />
                </div>

                {/* 5. ACTIVITY / QUICK ACTIONS (Medium Card) */}
                <Card className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1 glass-card border-none flex flex-col justify-center relative overflow-hidden group">
                    <CardContent className="p-4 md:p-6 relative z-10">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                            <span className="text-xs md:text-sm font-medium text-muted-foreground">Recent Activity</span>
                            <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold">
                            {activity.invoicesThisMonth}
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                            Invoices this month
                        </p>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="h-16 w-16 md:h-24 md:w-24" />
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* SECONDARY ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">

                {/* SUBSCRIPTION STATUS */}
                <Card className="col-span-1 md:col-span-1 glass-card border-none">
                    <CardContent className="p-4 md:p-6 flex flex-row items-center gap-3 md:gap-4">
                        <div className={cn(
                            "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0",
                            subscription.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                        )}>
                            <Lock className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm font-medium text-muted-foreground">Subscription</p>
                            <p className="font-semibold capitalize text-foreground text-sm md:text-base truncate">{subscription.status} Plan</p>
                        </div>
                        {userRole === 'owner' && (
                            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 md:h-10 md:w-10" asChild>
                                <Link href="/settings/billing">
                                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* VIEW REPORTS SHORTCUT */}
                <Card className="col-span-1 md:col-span-1 glass-card border-none cursor-pointer hover:bg-muted/50 transition-colors group">
                    <Link href="/reports">
                        <CardContent className="p-4 md:p-6 flex flex-row items-center gap-3 md:gap-4">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">Financial Reports</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">View detailed P&L and GST</p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                    </Link>
                </Card>

                {/* ACCOUNT STATUS / USER ROLE */}
                <Card className="col-span-1 sm:col-span-2 md:col-span-1 glass-card border-none">
                    <CardContent className="p-4 md:p-6 flex flex-row items-center gap-3 md:gap-4">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 border">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] md:text-xs">U</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-foreground">Logged in as</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground capitalize">{userRole}</p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
