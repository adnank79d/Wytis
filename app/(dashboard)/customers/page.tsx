import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Users,
    UserPlus,
    TrendingUp,
    Search,
    Mail,
    Phone,
    MapPin,
    Building2,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const params = await searchParams;
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

    // Fetch customers with optional search
    let customersQuery = supabase
        .from('customers')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false });

    if (params.search) {
        customersQuery = customersQuery.or(
            `name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
        );
    }

    const { data: customers } = await customersQuery;

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

    const customerInvoiceCounts = new Map<string, { count: number; total: number }>();
    invoices?.forEach(inv => {
        const existing = customerInvoiceCounts.get(inv.customer_name) || { count: 0, total: 0 };
        customerInvoiceCounts.set(inv.customer_name, {
            count: existing.count + 1,
            total: existing.total + Number(inv.total_amount || 0)
        });
    });

    const activeCustomers = customerInvoiceCounts.size;

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
                        Customers
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground/80">
                        Manage your customer directory.
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
                            <Link href="/customers/new">
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                Add Customer
                            </Link>
                        ) : (
                            <span>
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                Add Customer
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
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Total</p>
                                <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{totalCustomers}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Active</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-600 mt-0.5">{activeCustomers}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-3 md:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">New</p>
                                <p className="text-lg md:text-2xl font-bold text-blue-600 mt-0.5">{newThisMonth}</p>
                            </div>
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
                                <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH BAR */}
            <form className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    name="search"
                    placeholder="Search by name, email, or phone..."
                    defaultValue={params.search || ''}
                    className="w-full h-10 md:h-11 pl-9 pr-4 rounded-lg md:rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
            </form>

            {/* CUSTOMERS LIST */}
            {!customers || customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] border-2 border-dashed rounded-xl md:rounded-2xl bg-muted/30">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold">No customers yet</h3>
                    <p className="text-muted-foreground text-xs md:text-sm max-w-xs text-center mt-2 mb-6">
                        {params.search ? 'No customers match your search.' : 'Add your first customer to start building relationships.'}
                    </p>
                    {canEdit && !params.search && (
                        <Button asChild className="rounded-lg">
                            <Link href="/customers/new">
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                Add Customer
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2 md:space-y-3">
                    {customers.map((customer) => {
                        const stats = customerInvoiceCounts.get(customer.name);
                        return (
                            <Link key={customer.id} href={`/customers/${customer.id}`}>
                                <Card className="rounded-xl md:rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer">
                                    <CardContent className="p-3 md:p-5">
                                        <div className="flex items-start justify-between gap-2 md:gap-4">
                                            <div className="flex items-start gap-2.5 md:gap-4 flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-sm md:text-base font-bold text-primary">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm md:text-base text-foreground truncate">
                                                            {customer.name}
                                                        </p>
                                                        {stats && (
                                                            <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 shrink-0">
                                                                {stats.count} inv
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Contact Info - Desktop */}
                                                    <div className="hidden md:flex items-center gap-3 mt-1">
                                                        {customer.email && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.email}
                                                            </span>
                                                        )}
                                                        {customer.phone && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                        {customer.gst_number && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {customer.gst_number}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Contact Info - Mobile */}
                                                    <div className="flex md:hidden flex-col gap-0.5 mt-1">
                                                        {customer.phone && (
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                        {customer.email && (
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {customer.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {stats && (
                                                    <div className="text-right hidden md:block">
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {formatCurrency(stats.total)}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Total billed
                                                        </p>
                                                    </div>
                                                )}
                                                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
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
