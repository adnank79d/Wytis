import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserPlus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { CustomersTable } from "./_components/customers-table";
import { AddCustomerDialog } from "./_components/add-customer-dialog";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" }
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

export default async function CustomersPage() {
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

    // Fetch customers
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false });

    // Calculate stats
    const totalCustomers = customers?.length || 0;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = customers?.filter(c =>
        new Date(c.created_at) >= firstOfMonth
    ).length || 0;

    // Get invoice counts per customer
    const { data: invoices } = await supabase
        .from('invoices')
        .select('customer_name, total_amount')
        .eq('business_id', membership.business_id);

    // Map stats to customers
    const customerStats = new Map<string, { count: number; total: number }>();
    invoices?.forEach(inv => {
        // Note: Grouping by name is fragile if names are not unique, but matches existing logic.
        // Ideally should group by customer_id if invoices stored it.
        const existing = customerStats.get(inv.customer_name) || { count: 0, total: 0 };
        customerStats.set(inv.customer_name, {
            count: existing.count + 1,
            total: existing.total + Number(inv.total_amount || 0)
        });
    });

    const activeCustomers = customerStats.size;

    const customersWithStats = customers?.map(c => ({
        ...c,
        stats: customerStats.get(c.name)
    })) || [];

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Customer <span className="text-slate-900">Directory</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Manage your client relationships.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canEdit && <AddCustomerDialog />}
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <KpICard
                    title="Total Customers"
                    value={totalCustomers}
                    subtext="All registered clients"
                    icon={Users}
                    color="slate"
                />
                <KpICard
                    title="Active Clients"
                    value={activeCustomers}
                    subtext="Billed at least once"
                    icon={TrendingUp}
                    color="emerald"
                />
                <KpICard
                    title="New This Month"
                    value={newThisMonth}
                    subtext={`Since ${firstOfMonth.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                    icon={UserPlus}
                    color="blue"
                />
            </div>

            {/* CUSTOMERS TABLE */}
            <CustomersTable customers={customersWithStats} canEdit={canEdit} />
        </div>
    );
}
