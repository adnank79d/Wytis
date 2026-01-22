import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    TrendingUp,
    Wallet,
    CreditCard,
    Banknote,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; status?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context
    const { data: membershipData } = await supabase
        .from("memberships")
        .select(`
            role,
            business_id,
            businesses (
                name,
                subscription_status
            )
        `)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membershipData || !membershipData.businesses) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No business account found.</p>
            </div>
        );
    }

    const membership = membershipData;
    const business = membership.businesses as unknown as { subscription_status: string };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canEdit = (userRole === 'owner' || userRole === 'accountant') && !isTrialExpired;

    // Fetch payments
    let paymentsQuery = supabase
        .from('payments')
        .select(`
            *,
            invoice:invoices(invoice_number)
        `)
        .eq('business_id', membership.business_id)
        .order('payment_date', { ascending: false });

    if (params.type && params.type !== 'all') {
        paymentsQuery = paymentsQuery.eq('payment_type', params.type);
    }

    if (params.status && params.status !== 'all') {
        paymentsQuery = paymentsQuery.eq('status', params.status);
    }

    const { data: payments } = await paymentsQuery;

    // Calculate stats
    const allPayments = payments || [];
    const totalReceived = allPayments
        .filter(p => p.payment_type === 'received' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaid = allPayments
        .filter(p => p.payment_type === 'made' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingCount = allPayments.filter(p => p.status === 'pending').length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'upi': return <Wallet className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'bank': return <Banknote className="h-4 w-4" />;
            default: return <Banknote className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string, compact = false) => {
        const text = compact ? status.charAt(0).toUpperCase() : status.charAt(0).toUpperCase() + status.slice(1);
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] md:text-xs px-1.5 md:px-2">{compact ? '✓' : 'Completed'}</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] md:text-xs px-1.5 md:px-2">{compact ? '...' : 'Pending'}</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 md:px-2">{compact ? '✗' : 'Failed'}</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2">{status}</Badge>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                        Payments
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground/80">
                        Track payments received and made.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild={canEdit}
                        disabled={!canEdit}
                        size="default"
                        className={cn(
                            "font-semibold text-xs md:text-sm h-9 md:h-10 px-3 md:px-5 rounded-lg md:rounded-xl shadow-md",
                            canEdit
                                ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {canEdit ? (
                            <Link href="/payments/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Record Payment
                            </Link>
                        ) : (
                            <span>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Record Payment
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Received</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalReceived)}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                                <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Paid Out</p>
                                <p className="text-lg md:text-2xl font-bold text-rose-600 mt-0.5">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-950/50 transition-colors">
                                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group",
                    pendingCount > 0 ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/40 bg-card"
                )}>
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Pending</p>
                                <p className={cn(
                                    "text-lg md:text-2xl font-bold mt-0.5",
                                    pendingCount > 0 ? "text-amber-600" : "text-foreground"
                                )}>{pendingCount}</p>
                            </div>
                            <div className={cn(
                                "h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center transition-colors",
                                pendingCount > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                            )}>
                                <Clock className={cn(
                                    "h-4 w-4 md:h-5 md:w-5",
                                    pendingCount > 0 ? "text-amber-600" : "text-muted-foreground"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <Link
                    href="/payments"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        !params.type || params.type === 'all'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    All
                </Link>
                <Link
                    href="/payments?type=received"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        params.type === 'received'
                            ? "bg-emerald-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    Received
                </Link>
                <Link
                    href="/payments?type=made"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        params.type === 'made'
                            ? "bg-rose-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    Paid Out
                </Link>
            </div>

            {/* PAYMENTS LIST */}
            {!payments || payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] border-2 border-dashed rounded-xl md:rounded-2xl bg-muted/30">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold">No payments yet</h3>
                    <p className="text-muted-foreground text-xs md:text-sm max-w-xs text-center mt-2 mb-6">
                        Record your first payment to start tracking cash flow.
                    </p>
                    {canEdit && (
                        <Button asChild className="rounded-lg">
                            <Link href="/payments/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Record Payment
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {payments.map((payment) => (
                        <Card
                            key={payment.id}
                            className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                        >
                            <CardContent className="p-3 md:p-5">
                                {/* Mobile: Stacked layout */}
                                <div className="flex items-start justify-between gap-2 md:gap-4">
                                    <div className="flex items-start gap-2.5 md:gap-4 flex-1 min-w-0">
                                        <div className={cn(
                                            "h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                            payment.payment_type === 'received'
                                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                                : "bg-rose-50 dark:bg-rose-950/30"
                                        )}>
                                            {payment.payment_type === 'received' ? (
                                                <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                                            ) : (
                                                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm md:text-base text-foreground truncate">
                                                    {payment.party_name}
                                                </p>
                                                {/* Show compact badge on mobile */}
                                                <span className="md:hidden shrink-0">
                                                    {getStatusBadge(payment.status, true)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                                    {formatDate(payment.payment_date)}
                                                </span>
                                                <span className="hidden md:inline text-muted-foreground">•</span>
                                                <span className="hidden md:flex text-[10px] md:text-xs text-muted-foreground capitalize items-center gap-1">
                                                    {getMethodIcon(payment.payment_method)}
                                                    {payment.payment_method}
                                                </span>
                                                {payment.invoice && (
                                                    <>
                                                        <span className="text-muted-foreground hidden md:inline">•</span>
                                                        <span className="text-[10px] md:text-xs text-primary">
                                                            #{(payment.invoice as { invoice_number: string }).invoice_number}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {/* Mobile: Show method inline */}
                                            <span className="md:hidden text-[10px] text-muted-foreground capitalize flex items-center gap-1 mt-1">
                                                {getMethodIcon(payment.payment_method)}
                                                {payment.payment_method}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={cn(
                                            "font-bold text-sm md:text-lg",
                                            payment.payment_type === 'received' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {payment.payment_type === 'received' ? '+' : '-'}
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        {/* Desktop: Full badge */}
                                        <div className="hidden md:block mt-1">
                                            {getStatusBadge(payment.status)}
                                        </div>
                                    </div>
                                </div>
                                {payment.notes && (
                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/30 line-clamp-2">
                                        {payment.notes}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
