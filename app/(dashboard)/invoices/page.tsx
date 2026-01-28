import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    FileText,
    Lock,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    IndianRupee,
    Calendar,
    User,
    ChevronRight,
    FileEdit,
} from "lucide-react";
import { Role, can, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Get Business Context & Role
    const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select(`
            role,
            business_id,
            businesses (
                name,
                trial_ends_at,
                subscription_status
            )
        `)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membershipData || !membershipData.businesses) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No business account found.</p>
                <p className="text-sm">Please contact support or create a business.</p>
            </div>
        );
    }

    const membership = membershipData;
    const business = membership.businesses as unknown as { name: string; trial_ends_at: string; subscription_status: 'active' | 'expired' | 'paid' };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canCreateInvoice = userRole === 'owner' && !isTrialExpired;

    // 2. Fetch Invoices with optional filter
    let invoicesQuery = supabase
        .from("invoices")
        .select("id, invoice_number, customer_name, invoice_date, subtotal, gst_amount, total_amount, status")
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false });

    if (params.status && params.status !== 'all') {
        invoicesQuery = invoicesQuery.eq('status', params.status);
    }

    const { data: invoices, error } = await invoicesQuery;

    if (error) {
        console.error("Error fetching invoices:", error);
    }

    // 3. Calculate Stats (from all invoices, not filtered)
    const { data: allInvoices } = await supabase
        .from("invoices")
        .select("status, total_amount, subtotal")
        .eq("business_id", membership.business_id);

    const stats = {
        totalRevenue: allInvoices?.filter(i => i.status !== 'draft').reduce((sum, i) => sum + Number(i.subtotal || 0), 0) || 0,
        outstanding: allInvoices?.filter(i => i.status === 'issued').reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0,
        paidAmount: allInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0,
        draftCount: allInvoices?.filter(i => i.status === 'draft').length || 0,
        issuedCount: allInvoices?.filter(i => i.status === 'issued').length || 0,
        paidCount: allInvoices?.filter(i => i.status === 'paid').length || 0,
        total: allInvoices?.length || 0,
    };

    // Utility functions
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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    badge: <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-xs px-1.5 md:px-2.5">Paid</Badge>,
                    icon: <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />,
                    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
                    color: "text-emerald-600"
                };
            case 'issued':
                return {
                    badge: <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-xs px-1.5 md:px-2.5">Issued</Badge>,
                    icon: <Receipt className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />,
                    iconBg: "bg-blue-50 dark:bg-blue-950/30",
                    color: "text-blue-600"
                };
            default:
                return {
                    badge: <Badge variant="outline" className="text-muted-foreground text-[10px] md:text-xs px-1.5 md:px-2.5 border-muted-foreground/30">Draft</Badge>,
                    icon: <FileEdit className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />,
                    iconBg: "bg-muted",
                    color: "text-muted-foreground"
                };
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                        Invoices
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground/80">
                        Create, manage, and track your invoices.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild={canCreateInvoice}
                        disabled={!canCreateInvoice}
                        size="default"
                        className={cn(
                            "font-semibold text-xs md:text-sm h-9 md:h-10 px-3 md:px-5 rounded-lg md:rounded-xl shadow-md",
                            canCreateInvoice
                                ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {canCreateInvoice ? (
                            <Link href="/invoices/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Invoice
                            </Link>
                        ) : (
                            <span className="flex items-center">
                                <Lock className="mr-1.5 h-4 w-4" />
                                New Invoice
                            </span>
                        )}
                    </Button>
                    {!canCreateInvoice && (
                        <span className="text-[10px] text-muted-foreground hidden md:block">
                            {isTrialExpired ? "Trial Expired" : "Owner access required"}
                        </span>
                    )}
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Revenue</p>
                                <p className="text-base md:text-2xl font-bold text-foreground mt-0.5">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group",
                    stats.outstanding > 0 ? "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10" : "border-border/40 bg-card"
                )}>
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Outstanding</p>
                                <p className={cn(
                                    "text-base md:text-2xl font-bold mt-0.5",
                                    stats.outstanding > 0 ? "text-amber-600" : "text-foreground"
                                )}>{formatCurrency(stats.outstanding)}</p>
                            </div>
                            <div className={cn(
                                "h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center transition-colors",
                                stats.outstanding > 0 ? "bg-amber-100 dark:bg-amber-950/30" : "bg-muted"
                            )}>
                                <Clock className={cn(
                                    "h-4 w-4 md:h-5 md:w-5",
                                    stats.outstanding > 0 ? "text-amber-600" : "text-muted-foreground"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Collected</p>
                                <p className="text-base md:text-2xl font-bold text-emerald-600 mt-0.5">{formatCurrency(stats.paidAmount)}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group",
                    stats.draftCount > 0 ? "border-muted-foreground/20" : "border-border/40 bg-card"
                )}>
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Drafts</p>
                                <p className="text-base md:text-2xl font-bold text-foreground mt-0.5">{stats.draftCount}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                                <FileEdit className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <Link
                    href="/invoices"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        !params.status || params.status === 'all'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    All ({stats.total})
                </Link>
                <Link
                    href="/invoices?status=draft"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        params.status === 'draft'
                            ? "bg-slate-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    Draft ({stats.draftCount})
                </Link>
                <Link
                    href="/invoices?status=issued"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        params.status === 'issued'
                            ? "bg-blue-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    Issued ({stats.issuedCount})
                </Link>
                <Link
                    href="/invoices?status=paid"
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        params.status === 'paid'
                            ? "bg-emerald-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    Paid ({stats.paidCount})
                </Link>
            </div>

            {/* INVOICES LIST */}
            {!invoices || invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] border-2 border-dashed rounded-xl md:rounded-2xl bg-muted/30">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold">
                        {params.status ? `No ${params.status} invoices` : 'No invoices yet'}
                    </h3>
                    <p className="text-muted-foreground text-xs md:text-sm max-w-xs text-center mt-2 mb-6">
                        {params.status
                            ? `You don't have any invoices with ${params.status} status.`
                            : 'Create your first invoice to start tracking revenue.'}
                    </p>
                    {canCreateInvoice && !params.status && (
                        <Button asChild className="rounded-lg">
                            <Link href="/invoices/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Create Invoice
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice) => {
                        const statusConfig = getStatusConfig(invoice.status);
                        return (
                            <Link
                                key={invoice.id}
                                href={`/invoices/${invoice.id}`}
                                className="block"
                            >
                                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                                    <CardContent className="p-3 md:p-5">
                                        <div className="flex items-start justify-between gap-2 md:gap-4">
                                            <div className="flex items-start gap-2.5 md:gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                    statusConfig.iconBg
                                                )}>
                                                    {statusConfig.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm md:text-base text-foreground">
                                                            {invoice.invoice_number}
                                                        </p>
                                                        <span className="md:hidden shrink-0">
                                                            {statusConfig.badge}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 flex-wrap">
                                                        <span className="text-[10px] md:text-xs text-foreground/80 flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {invoice.customer_name}
                                                        </span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(invoice.invoice_date)}
                                                        </span>
                                                    </div>
                                                    {invoice.gst_amount > 0 && (
                                                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                            GST: {formatCurrency(invoice.gst_amount)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                <p className={cn(
                                                    "font-bold text-sm md:text-lg",
                                                    invoice.status === 'paid' ? "text-emerald-600" : "text-foreground"
                                                )}>
                                                    {formatCurrency(invoice.total_amount)}
                                                </p>
                                                <div className="hidden md:block">
                                                    {statusConfig.badge}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
