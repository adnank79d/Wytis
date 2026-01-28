import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, AlertTriangle, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { getInventory, getInventoryStats } from "@/lib/actions/inventory";
import { InventoryTable } from "@/components/inventory/inventory-table";

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
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                        Inventory
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground/80">
                        Manage your products and stock levels.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <Button asChild size="sm" className="h-9">
                            <Link href="/inventory/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Product
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-xl border border-border/40 bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-xl border shadow-sm transition-colors",
                    stats.lowStock > 0 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-border/40 bg-card"
                )}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock</p>
                            <p className={cn("text-2xl font-bold mt-1", stats.lowStock > 0 ? "text-amber-600" : "")}>
                                {stats.lowStock}
                            </p>
                        </div>
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            stats.lowStock > 0 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                        )}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN TABLE */}
            <InventoryTable
                products={inventoryData.products}
                categories={inventoryData.categories}
                canEdit={canEdit}
            />
        </div>
    );
}
