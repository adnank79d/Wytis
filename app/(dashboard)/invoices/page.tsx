import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Lock,
    Receipt,
    Clock,
    CheckCircle2,
    TrendingUp,
    Calendar,
    ChevronRight,
    FileEdit,
    Search,
    Download
} from "lucide-react";
import { Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { CreateInvoiceDialog } from "./_components/create-invoice-dialog";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate" }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default shadow-sm hover:shadow-md", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500/90">{title}</span>
                {Icon && (<div className={cn("p-1.5 rounded-md transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}
            </div>
            <div className="space-y-1">
                <div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div>
                {subtext && (<span className="text-xs text-slate-500 font-medium">{subtext}</span>)}
            </div>
        </div>
    );
}

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
            <div className="p-8 text-center text-muted-foreground bg-slate-50 rounded-xl m-8 border border-slate-200 border-dashed">
                <p className="font-semibold text-slate-900">No business account found.</p>
                <p className="text-sm">Please contact support or create a business.</p>
            </div>
        );
    }

    const membership = membershipData;
    const business = membership.businesses as unknown as { name: string; trial_ends_at: string; subscription_status: 'active' | 'expired' | 'paid' };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canCreateInvoice = userRole === 'owner' && !isTrialExpired;

    // 2. Fetch Data for Dialog (Customers & Products)
    let existingCustomers: any[] = [];
    let inventoryProducts: any[] = [];

    if (canCreateInvoice) {
        const { data: customers } = await supabase
            .from('customers')
            .select('id, name, email, phone, tax_id')
            .eq('business_id', membership.business_id)
            .order('name');
        existingCustomers = customers || [];

        const { data: products } = await supabase
            .from('inventory_products')
            .select('id, name, sku, unit_price, cost_price, gst_rate, quantity, prices_include_tax')
            .eq('business_id', membership.business_id)
            .eq('is_active', true)
            .order('name');
        inventoryProducts = products || [];
    }

    // 3. Fetch Invoices with optional filter
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

    // 4. Calculate Stats (from all invoices, not filtered)
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

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid':
                return "bg-emerald-50 text-emerald-700 border-emerald-100/80 shadow-none";
            case 'issued':
                return "bg-amber-50 text-amber-700 border-amber-100/80 shadow-none";
            case 'draft':
                return "bg-slate-50 text-slate-600 border-slate-200/80 shadow-none";
            default:
                return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-3 h-3" />;
            case 'issued': return <Clock className="w-3 h-3" />;
            default: return <FileEdit className="w-3 h-3" />;
        }
    };

    const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Invoices
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Manage your billing and receivables efficiently.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex bg-white h-10 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>

                    {canCreateInvoice ? (
                        <CreateInvoiceDialog
                            existingCustomers={existingCustomers}
                            inventoryProducts={inventoryProducts}
                        />
                    ) : (
                        <Button disabled className="h-10 px-4 bg-slate-100 text-slate-400 shadow-sm rounded-lg font-semibold border border-slate-200">
                            <Lock className="mr-2 h-4 w-4 text-slate-300" />
                            New Invoice
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpICard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={TrendingUp}
                    color="indigo"
                    subtext="Net taxable value"
                />
                <KpICard
                    title="Outstanding"
                    value={formatCurrency(stats.outstanding)}
                    subtext={`${stats.issuedCount} unpaid invoices`}
                    icon={Clock}
                    color="amber"
                />
                <KpICard
                    title="Collected"
                    value={formatCurrency(stats.paidAmount)}
                    subtext={`${stats.paidCount} paid invoices`}
                    icon={CheckCircle2}
                    color="emerald"
                />
                <KpICard
                    title="Drafts"
                    value={stats.draftCount.toString()}
                    subtext="Unsent invoices"
                    icon={FileEdit}
                    color="slate"
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white flex flex-col min-h-[500px]">

                {/* TOOLBAR */}
                <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* FILTERS */}
                    <div className="flex bg-slate-100/80 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full border border-slate-200/50">
                        {[
                            { id: 'all', label: 'All Invoices', count: stats.total },
                            { id: 'issued', label: 'Unpaid', count: stats.issuedCount },
                            { id: 'paid', label: 'Paid', count: stats.paidCount },
                            { id: 'draft', label: 'Draft', count: stats.draftCount },
                        ].map(tab => (
                            <Link
                                key={tab.id}
                                href={tab.id === 'all' ? '/invoices' : `/invoices?status=${tab.id}`}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all",
                                    (!params.status && tab.id === 'all') || params.status === tab.id
                                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                )}
                            >
                                {tab.label} <span className={cn("ml-1 opaciy-60 font-medium", (!params.status && tab.id === 'all') || params.status === tab.id ? "text-indigo-400" : "text-slate-400")}>{tab.count}</span>
                            </Link>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search client, #ID..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>
                </div>

                {/* LIST */}
                <div className="flex flex-col relative">
                    {/* TABLE HEADER (Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-[73px] z-10 backdrop-blur-sm">
                        <div className="col-span-4">Invoice Details</div>
                        <div className="col-span-3">Customer</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-1"></div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {!invoices || invoices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-80 text-center p-8">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">No invoices found</h3>
                                <p className="text-sm text-slate-500 max-w-sm mt-1">
                                    {params.status
                                        ? `There are no ${params.status} invoices to display in this period.`
                                        : "Create your first invoice to verify your workflow and get paid faster."}
                                </p>
                            </div>
                        ) : (
                            invoices.map((inv) => (
                                <Link
                                    key={inv.id}
                                    href={`/invoices/${inv.id}`}
                                    className="group block hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 md:px-8 py-4 items-center">

                                        {/* Mobile: Top Row (ID + Status) */}
                                        <div className="md:hidden flex justify-between items-center w-full mb-1">
                                            <span className="font-bold text-slate-900">{inv.invoice_number}</span>
                                            <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 leading-none", getStatusStyles(inv.status))}>
                                                {getStatusIcon(inv.status)} {formatStatus(inv.status)}
                                            </div>
                                        </div>

                                        {/* COL 1: Details */}
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className={cn("p-2 rounded-xl border hidden md:flex transition-all shadow-sm",
                                                inv.status === 'paid' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-slate-200 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500"
                                            )}>
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm hidden md:block group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{inv.invoice_number}</p>
                                                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 md:mt-0.5 uppercase tracking-wide">
                                                    <Calendar className="w-3 h-3 opacity-60" /> {formatDate(inv.invoice_date)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* COL 2: Customer */}
                                        <div className="col-span-3 flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center text-[11px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                                                {inv.customer_name?.substring(0, 2).toUpperCase() || "CL"}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{inv.customer_name}</span>
                                        </div>

                                        {/* COL 3: Amount */}
                                        <div className="col-span-2 text-right md:text-right flex items-center md:block justify-between md:justify-end w-full">
                                            <span className="md:hidden text-xs text-slate-400 font-medium">Total Amount</span>
                                            <div className="flex flex-col">
                                                <p className="font-bold text-slate-900 text-sm">{formatCurrency(inv.total_amount)}</p>
                                                {inv.gst_amount > 0 && <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Tax: {formatCurrency(inv.gst_amount)}</p>}
                                            </div>
                                        </div>

                                        {/* COL 4: Status (Desktop Only) */}
                                        <div className="hidden md:flex col-span-2 justify-center">
                                            <div className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 leading-none transition-all", getStatusStyles(inv.status))}>
                                                {getStatusIcon(inv.status)} {formatStatus(inv.status)}
                                            </div>
                                        </div>

                                        {/* COL 5: Action */}
                                        <div className="col-span-1 flex justify-end">
                                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-indigo-100">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    <p>Total Records: {invoices?.length || 0}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled className="h-8 px-4 text-[10px] font-bold bg-white text-slate-400 border-slate-200 rounded-lg uppercase tracking-wider">Previous</Button>
                        <Button variant="outline" size="sm" disabled className="h-8 px-4 text-[10px] font-bold bg-white text-slate-400 border-slate-200 rounded-lg uppercase tracking-wider">Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
