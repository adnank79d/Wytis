import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, ShoppingCart, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
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
    const canCreate = (userRole === 'owner' || userRole === 'accountant') && !isTrialExpired;

    // Fetch Data
    const purchaseOrders = await getPurchaseOrders();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Stats
    const totalCount = purchaseOrders.length;
    const draftCount = purchaseOrders.filter(po => po.status === 'draft').length;
    const openCount = purchaseOrders.filter(po => po.status === 'issued' || po.status === 'partially_received').length;

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                        Purchase Orders
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground/80">
                        Manage procurement and receiving.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <Button asChild size="sm" className="h-9">
                            <Link href="/purchase-orders/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Create PO
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
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total POs</p>
                            <p className="text-2xl font-bold mt-1">{totalCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drafts</p>
                            <p className="text-2xl font-bold mt-1">{draftCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Orders</p>
                            <p className="text-2xl font-bold mt-1">{openCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LIST */}
            <Card className="rounded-xl border border-border/40 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/40">
                            <tr>
                                <th className="px-4 py-3">PO Number</th>
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {purchaseOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : (
                                purchaseOrders.map((po: any) => (
                                    <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <Link href={`/purchase-orders/${po.id}`} className="hover:underline">
                                                {po.po_number || 'Draft'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            {po.vendor?.name || 'Unknown Vendor'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(po.po_date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className={cn(
                                                "capitalize text-xs font-normal border-0",
                                                po.status === 'issued' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                    po.status === 'draft' ? "bg-muted text-muted-foreground" :
                                                        po.status === 'partially_received' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                            po.status === 'closed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""
                                            )}>
                                                {po.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {formatCurrency(po.total_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button asChild variant="ghost" size="sm" className="h-8">
                                                <Link href={`/purchase-orders/${po.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
