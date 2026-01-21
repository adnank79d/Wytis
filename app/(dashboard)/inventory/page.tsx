import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Package,
    AlertTriangle,
    IndianRupee,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; category?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context & Role
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
            </div>
        );
    }

    const membership = membershipData;
    const business = membership.businesses as unknown as { name: string; subscription_status: string };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canEdit = (userRole === 'owner' || userRole === 'accountant') && !isTrialExpired;

    // Fetch products
    let productsQuery = supabase
        .from('inventory_products')
        .select(`
            *,
            category:inventory_categories(id, name)
        `)
        .eq('business_id', membership.business_id)
        .eq('is_active', true)
        .order('name');

    if (params.search) {
        productsQuery = productsQuery.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    if (params.category && params.category !== 'all') {
        productsQuery = productsQuery.eq('category_id', params.category);
    }

    const { data: products } = await productsQuery;

    // Fetch categories
    const { data: categories } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('name');

    // Calculate stats
    const totalProducts = products?.length || 0;
    const lowStock = products?.filter(p => p.quantity <= p.reorder_level).length || 0;
    const totalValue = products?.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0) || 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6">
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
                            <Link href="/inventory/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Product
                            </Link>
                        ) : (
                            <span>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Product
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
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Products</p>
                                <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{totalProducts}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary/70" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group",
                    lowStock > 0 ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/40 bg-card"
                )}>
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Low Stock</p>
                                <p className={cn(
                                    "text-lg md:text-2xl font-bold mt-0.5",
                                    lowStock > 0 ? "text-amber-600" : "text-foreground"
                                )}>{lowStock}</p>
                            </div>
                            <div className={cn(
                                "h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center transition-colors",
                                lowStock > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                            )}>
                                <AlertTriangle className={cn(
                                    "h-4 w-4 md:h-5 md:w-5",
                                    lowStock > 0 ? "text-amber-600" : "text-muted-foreground"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Stock Value</p>
                                <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{formatCurrency(totalValue)}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                                <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search products..."
                            defaultValue={params.search}
                            className="pl-9 h-10 bg-background border-border/60 rounded-lg"
                        />
                    </div>
                </form>
                {categories && categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <Link
                            href="/inventory"
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                                !params.category || params.category === 'all'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                        >
                            All
                        </Link>
                        {categories.map((cat: { id: string; name: string }) => (
                            <Link
                                key={cat.id}
                                href={`/inventory?category=${cat.id}`}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                                    params.category === cat.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                )}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* PRODUCTS LIST */}
            {!products || products.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] border-2 border-dashed rounded-xl md:rounded-2xl bg-muted/30">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <Boxes className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold">No products yet</h3>
                    <p className="text-muted-foreground text-xs md:text-sm max-w-xs text-center mt-2 mb-6">
                        Add your first product to start managing your inventory.
                    </p>
                    {canEdit && (
                        <Button asChild className="rounded-lg">
                            <Link href="/inventory/new">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Product
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/inventory/${product.id}`}
                            className="block group"
                        >
                            <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 h-full">
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors truncate">
                                                {product.name}
                                            </h3>
                                            {product.sku && (
                                                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                                                    SKU: {product.sku}
                                                </p>
                                            )}
                                            {product.category && (
                                                <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 py-0">
                                                    {(product.category as { name: string }).name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm md:text-base text-foreground">
                                                {formatCurrency(product.unit_price)}
                                            </p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">
                                                per {product.unit}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium",
                                                product.quantity <= product.reorder_level
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            )}>
                                                {product.quantity <= product.reorder_level && (
                                                    <AlertTriangle className="h-3 w-3" />
                                                )}
                                                {product.quantity} in stock
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            GST: {product.gst_rate}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
