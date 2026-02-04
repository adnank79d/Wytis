import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Target, CheckCircle, TrendingUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

import { getCustomers } from "@/lib/actions/crm";
import { CustomersTable } from "@/components/crm/customers-table";
import { AddCustomerDialog } from "@/components/crm/add-customer-dialog";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate" }: any) {
    const styles: any = {
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" },
        purple: { bg: "bg-purple-50/50 hover:bg-purple-50", border: "border-purple-100 hover:border-purple-200", iconBg: "bg-purple-100 text-purple-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
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

export default async function CRMPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const customers = await getCustomers();

    const leadsCount = customers.filter(c => c.status === 'lead').length;
    const prospectsCount = customers.filter(c => c.status === 'prospect').length;
    const customersCount = customers.filter(c => c.status === 'customer').length;

    // Calculate a simple "conversion rate" dummy metric (Customers / Total * 100)
    const total = leadsCount + prospectsCount + customersCount;
    const conversionRate = total > 0 ? Math.round((customersCount / total) * 100) : 0;

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        CRM <span className="text-slate-900">Overview</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Manage your sales pipeline and client relationships.
                    </p>
                </div>
                <AddCustomerDialog />
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpICard
                    title="Active Leads"
                    value={leadsCount}
                    subtext="Potential opportunities"
                    icon={Target}
                    color="blue"
                />
                <KpICard
                    title="In Negotiation"
                    value={prospectsCount}
                    subtext="Proposal stage"
                    icon={Users}
                    color="purple"
                />
                <KpICard
                    title="Customers"
                    value={customersCount}
                    subtext="Closed won deals"
                    icon={CheckCircle}
                    color="emerald"
                />
                <KpICard
                    title="Conversion Rate"
                    value={`${conversionRate}%`}
                    subtext="Lead to Customer"
                    icon={TrendingUp}
                    color="amber"
                />
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">Customer Database</h2>
                    <div className="flex items-center gap-2">
                        {/* 
                         Placeholder filters or actions can go here
                        */}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <CustomersTable customers={customers} />
                </div>
            </div>
        </div>
    );
}
