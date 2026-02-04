import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { PaymentsTable } from "./_components/payments-table";
import { AddPaymentDialog } from "./_components/add-payment-dialog";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" }
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default", s.bg, s.border)}>
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

export default async function PaymentsPage() {
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

    // Fetch ALL payments
    const { data: payments } = await supabase
        .from('payments')
        .select(`
            *,
            invoice:invoices(invoice_number)
        `)
        .eq('business_id', membership.business_id)
        .order('payment_date', { ascending: false });

    // Fetch invoices for linking (limit to recent 50 for performance)
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, total_amount')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false })
        .limit(50);

    const allPayments = payments || [];
    const availableInvoices = (invoices || []) as any[];

    // Calculate stats
    const totalReceived = allPayments
        .filter(p => p.payment_type === 'received' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = allPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingCount = allPayments.filter(p => p.status === 'pending').length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Payments <span className="text-slate-900">Overview</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Track all incoming and outgoing payments.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canEdit && <AddPaymentDialog invoices={availableInvoices} />}
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KpICard
                    title="Total Received"
                    value={formatCurrency(totalReceived)}
                    subtext="All time received"
                    icon={ArrowDownLeft}
                    color="emerald"
                />
                <KpICard
                    title="Pending Amount"
                    value={formatCurrency(totalPending)}
                    subtext={`${pendingCount} pending payments`}
                    icon={Clock}
                    color="amber"
                />
                <KpICard
                    title="Net Cash Flow"
                    value={formatCurrency(totalReceived - totalPending)} // Placeholder logic for now
                    subtext="Received - Pending"
                    icon={CheckCircle2}
                    color="indigo"
                />
                <KpICard
                    title="Total Transactions"
                    value={allPayments.length}
                    subtext="Lifetime records"
                    icon={ArrowUpRight} // Reusing ArrowUpRight as generic transaction icon
                    color="slate"
                />
            </div>

            {/* PAYMENTS TABLE */}
            <PaymentsTable payments={allPayments as any[]} canEdit={canEdit} />
        </div >
    );
}
