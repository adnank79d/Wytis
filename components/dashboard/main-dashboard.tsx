"use client";

import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Activity, Users, FilePlus, FileText, Lock, Plus, ArrowRight, Sparkles } from "lucide-react";
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
    if (hour < 12) return { text: "Good morning", emoji: "☀️" };
    if (hour < 18) return { text: "Good afternoon", emoji: "🌤️" };
    return { text: "Good evening", emoji: "🌙" };
}

export function MainDashboard({ metrics, activity, subscription, userRole, userName = "User" }: MainDashboardProps) {
    const isTrialExpired = subscription.status === 'expired';
    const canCreateInvoice = userRole === 'owner' && !isTrialExpired;
    const isRestricted = userRole === 'staff';
    const greeting = getGreeting();

    return (
        <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full pb-6 md:pb-12 animate-in fade-in duration-500">

            {/* WELCOME SECTION - Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-0.5">
                    <p className="text-muted-foreground/70 text-xs md:text-sm font-medium flex items-center gap-1">
                        <span>{greeting.emoji}</span>
                        <span>{greeting.text}</span>
                    </p>
                    <h1 className="text-xl md:text-4xl font-bold tracking-tight text-foreground">
                        Welcome, <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">{userName}</span>
                    </h1>
                    <p className="text-muted-foreground/80 text-xs md:text-base">
                        Your business overview for today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild={canCreateInvoice}
                        disabled={!canCreateInvoice}
                        size="default"
                        className={cn(
                            "font-semibold text-xs md:text-sm h-9 md:h-10 px-3 md:px-5 rounded-lg md:rounded-xl shadow-md md:shadow-lg",
                            canCreateInvoice
                                ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {canCreateInvoice ? (
                            <Link href="/invoices/new" className="flex items-center gap-2">
                                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                <span>New Invoice</span>
                            </Link>
                        ) : (
                            <span className="flex items-center gap-2 cursor-not-allowed">
                                <Lock className="h-4 w-4" />
                                <span>New Invoice</span>
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* BENTO GRID - Premium Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 auto-rows-[minmax(100px,auto)] md:auto-rows-[minmax(140px,auto)]">

                {/* 1. REVENUE (Large Card) */}
                <div className="col-span-2 lg:col-span-2 row-span-1 md:row-span-2">
                    <KpiCard
                        label="Total Revenue"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.revenue)}
                        icon={isRestricted ? Lock : IndianRupee}
                        className="h-full"
                        trend={metrics.revenueTrend}
                        chartData={metrics.revenueHistory}
                        chartColor="#6366f1"
                    />
                </div>

                {/* 2. NET PROFIT */}
                <div className="col-span-1 row-span-1">
                    <KpiCard
                        label="Net Profit"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.netProfit)}
                        icon={isRestricted ? Lock : TrendingUp}
                        trend={metrics.profitTrend}
                        chartData={metrics.profitHistory}
                        chartColor="#10b981"
                        className="h-full"
                    />
                </div>

                {/* 3. RECEIVABLES */}
                <div className="col-span-1 row-span-1">
                    <KpiCard
                        label="Receivables"
                        value={formatCompactCurrency(metrics.receivables)}
                        caption="Expected income"
                        icon={Users}
                        className="h-full"
                    />
                </div>

                {/* 4. GST LIABILITY */}
                <div className="col-span-1 row-span-1">
                    <KpiCard
                        label="GST Payable"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.gstPayable)}
                        icon={isRestricted ? Lock : Activity}
                        className="h-full"
                    />
                </div>

                {/* 5. PAYABLES */}
                <div className="col-span-1 row-span-1">
                    <KpiCard
                        label="Payables"
                        value={isRestricted ? "Restricted" : formatCompactCurrency(metrics.payables)}
                        caption="Amount to Pay"
                        icon={isRestricted ? Lock : FilePlus}
                        className="h-full"
                    />
                </div>

                {/* 6. ACTIVITY CARD */}
                <Card className="col-span-2 lg:col-span-2 row-span-1 rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/60 hover:translate-y-[-2px] overflow-hidden group">
                    <CardContent className="p-4 md:p-5 h-full flex flex-col justify-between relative">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide mb-1 md:mb-2">Recent Activity</p>
                                <div className="text-2xl md:text-3xl font-bold text-foreground">
                                    {activity.invoicesThisMonth}
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-1 font-medium">
                                    Invoices this month
                                </p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary/70 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" asChild className="rounded-lg text-xs font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors">
                                <Link href="/invoices">
                                    View all invoices
                                    <ArrowRight className="h-3 w-3 ml-1.5" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* SECONDARY ROW - Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

                {/* SUBSCRIPTION STATUS */}
                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/60 hover:translate-y-[-2px] group">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            subscription.status === 'paid'
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50"
                        )}>
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">Subscription</p>
                            <p className="font-semibold capitalize text-foreground text-sm md:text-base truncate">
                                {subscription.status === 'paid' ? 'Pro' : subscription.status} Plan
                            </p>
                        </div>
                        {userRole === 'owner' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary" asChild>
                                <Link href="/settings/billing">
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* VIEW REPORTS */}
                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-2px] cursor-pointer group">
                    <Link href="/reports">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className="h-10 w-10 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:scale-105 transition-all">
                                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Reports</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground/70">P&L, GST & more</p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </CardContent>
                    </Link>
                </Card>

                {/* ACCOUNT STATUS */}
                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/60 hover:translate-y-[-2px] sm:col-span-2 lg:col-span-1 group">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10 md:h-11 md:w-11 border-2 border-primary/10">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs md:text-sm font-semibold">
                                {userName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{userName || 'User'}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground/70 capitalize flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                {userRole} account
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
