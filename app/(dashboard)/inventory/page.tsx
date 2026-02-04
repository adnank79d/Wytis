import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package, AlertTriangle, IndianRupee, Box, TrendingUp, AlertOctagon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { getInventory, getInventoryStats } from "@/lib/actions/inventory";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddProductDialog } from "./_components/add-product-dialog";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context & Role
    const { data: membership } = await supabase
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

    if (!membership || !membership.businesses) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No business account found.</p>
            </div>
        );
    }

    const business = membership.businesses as unknown as { name: string; subscription_status: string };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canEdit = (userRole === 'owner' || userRole === 'accountant') && !isTrialExpired;

    // Fetch Data
    const [inventoryData, stats] = await Promise.all([
        getInventory(),
        getInventoryStats()
    ]);

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
                        Inventory <span className="text-slate-900">Management</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Track stock levels, value, and product details.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canEdit && <AddProductDialog categories={inventoryData.categories} />}
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpICard
                    title="Total Value"
                    value={formatCurrency(stats.totalValue)}
                    icon={IndianRupee}
                    color="emerald"
                    subtext="Asset Valuation"
                />
                <KpICard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={Box}
                    color="indigo"
                    subtext="Active SKUs"
                />
                <KpICard
                    title="Low Stock"
                    value={stats.lowStock}
                    icon={AlertOctagon}
                    color="rose"
                    subtext="Requires Attention"
                    isAlert={stats.lowStock > 0}
                />
                <KpICard
                    title="Stock Health"
                    value={stats.lowStock === 0 ? "100%" : `${Math.round(((stats.totalProducts - stats.lowStock) / stats.totalProducts) * 100)}%`}
                    icon={CheckCircle2}
                    color="slate"
                    subtext="Items In Stock"
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="space-y-4">
                <InventoryTable
                    products={inventoryData.products}
                    categories={inventoryData.categories}
                    canEdit={canEdit}
                />
            </div>
        </div >
    );
}

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    };
    const s = styles[color];

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
