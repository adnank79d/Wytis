import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Edit,
    Package,
    AlertTriangle,
    IndianRupee,
    Boxes,
    Hash,
    Percent,
    TrendingUp,
    TrendingDown,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context
    const { data: membershipData } = await supabase
        .from("memberships")
        .select(`role, business_id, businesses (subscription_status)`)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membershipData) {
        redirect("/onboarding");
    }

    const business = membershipData.businesses as unknown as { subscription_status: string };
    const isTrialExpired = business.subscription_status === 'expired';
    const canEdit = (membershipData.role === 'owner' || membershipData.role === 'accountant') && !isTrialExpired;

    // Fetch product
    const { data: product, error } = await supabase
        .from('inventory_products')
        .select(`
            *,
            category:inventory_categories(id, name)
        `)
        .eq('id', id)
        .eq('business_id', membershipData.business_id)
        .single();

    if (error || !product) {
        notFound();
    }

    // Fetch recent movements
    const { data: movements } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isLowStock = product.quantity <= product.reorder_level;

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-6">
            {/* HEADER */}
            <div>
                <Link
                    href="/inventory"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Inventory
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                {product.name}
                            </h1>
                            {product.category && (
                                <Badge variant="secondary" className="text-xs">
                                    {(product.category as { name: string }).name}
                                </Badge>
                            )}
                        </div>
                        {product.sku && (
                            <p className="text-sm text-muted-foreground mt-1">
                                SKU: {product.sku}
                            </p>
                        )}
                    </div>
                    {canEdit && (
                        <Button asChild variant="outline" className="rounded-lg">
                            <Link href={`/inventory/${id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className={cn(
                    "rounded-xl border shadow-sm",
                    isLowStock ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/40"
                )}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                isLowStock ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"
                            )}>
                                <Boxes className={cn(
                                    "h-5 w-5",
                                    isLowStock ? "text-amber-600" : "text-primary"
                                )} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">In Stock</p>
                                <p className={cn(
                                    "text-lg font-bold",
                                    isLowStock ? "text-amber-600" : "text-foreground"
                                )}>
                                    {product.quantity} {product.unit}
                                </p>
                            </div>
                        </div>
                        {isLowStock && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                Below reorder level ({product.reorder_level})
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                <IndianRupee className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Selling Price</p>
                                <p className="text-lg font-bold text-foreground">
                                    {formatCurrency(product.unit_price)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                                <Hash className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">HSN Code</p>
                                <p className="text-lg font-bold text-foreground">
                                    {product.hsn_code || '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-border/40 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                                <Percent className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">GST Rate</p>
                                <p className="text-lg font-bold text-foreground">
                                    {product.gst_rate}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* DESCRIPTION */}
            {product.description && (
                <Card className="rounded-xl border border-border/40 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground">{product.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* STOCK MOVEMENTS */}
            <Card className="rounded-xl border border-border/40 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Stock History</CardTitle>
                </CardHeader>
                <CardContent>
                    {!movements || movements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No stock movements recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {movements.map((movement) => (
                                <div
                                    key={movement.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                            movement.movement_type === 'in' ? "bg-emerald-100 dark:bg-emerald-900/30" :
                                                movement.movement_type === 'out' ? "bg-rose-100 dark:bg-rose-900/30" :
                                                    "bg-blue-100 dark:bg-blue-900/30"
                                        )}>
                                            {movement.movement_type === 'in' ? (
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            ) : movement.movement_type === 'out' ? (
                                                <TrendingDown className="h-4 w-4 text-rose-600" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium capitalize">
                                                Stock {movement.movement_type}
                                            </p>
                                            {movement.notes && (
                                                <p className="text-xs text-muted-foreground">{movement.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            movement.movement_type === 'in' ? "text-emerald-600" :
                                                movement.movement_type === 'out' ? "text-rose-600" : "text-blue-600"
                                        )}>
                                            {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : ''}
                                            {Math.abs(movement.quantity)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDate(movement.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
