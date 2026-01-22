import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    FileText,
    Receipt,
    Edit,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
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
        .select(`
            role,
            business_id,
            businesses (subscription_status)
        `)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membershipData) {
        redirect("/onboarding");
    }

    const business = membershipData.businesses as unknown as { subscription_status: string };
    const userRole = membershipData.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canEdit = (userRole === 'owner' || userRole === 'accountant') && !isTrialExpired;

    // Fetch customer
    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('business_id', membershipData.business_id)
        .single();

    if (!customer) {
        notFound();
    }

    // Fetch invoices for this customer
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, status, created_at')
        .eq('business_id', membershipData.business_id)
        .eq('customer_name', customer.name)
        .order('created_at', { ascending: false })
        .limit(10);

    const totalInvoices = invoices?.length || 0;
    const totalBilled = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
    const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-600 text-[10px] md:text-xs">Paid</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="text-[10px] md:text-xs">Sent</Badge>;
            case 'overdue':
                return <Badge variant="destructive" className="text-[10px] md:text-xs">Overdue</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] md:text-xs">{status}</Badge>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6">
            {/* HEADER */}
            <div>
                <Link
                    href="/customers"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Customers
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xl md:text-2xl font-bold text-primary">
                                {customer.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                {customer.name}
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Added {formatDate(customer.created_at)}
                            </p>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-lg">
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                    <CardContent className="p-3 md:p-5 text-center">
                        <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoices</p>
                        <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{totalInvoices}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                    <CardContent className="p-3 md:p-5 text-center">
                        <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Billed</p>
                        <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{formatCurrency(totalBilled)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                    <CardContent className="p-3 md:p-5 text-center">
                        <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid</p>
                        <p className="text-lg md:text-2xl font-bold text-emerald-600 mt-0.5">{paidInvoices}</p>
                    </CardContent>
                </Card>
            </div>

            {/* CONTACT INFO */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-semibold">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                    {customer.email && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                                <p className="text-sm md:text-base font-medium">{customer.email}</p>
                            </div>
                        </div>
                    )}
                    {customer.phone && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                                <p className="text-sm md:text-base font-medium">{customer.phone}</p>
                            </div>
                        </div>
                    )}
                    {customer.gst_number && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">GST Number</p>
                                <p className="text-sm md:text-base font-medium font-mono">{customer.gst_number}</p>
                            </div>
                        </div>
                    )}
                    {customer.address && (
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                                <p className="text-sm md:text-base font-medium whitespace-pre-line">{customer.address}</p>
                            </div>
                        </div>
                    )}
                    {!customer.email && !customer.phone && !customer.gst_number && !customer.address && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No contact information added yet.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* NOTES */}
            {customer.notes && (
                <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base md:text-lg font-semibold">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{customer.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* RECENT INVOICES */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base md:text-lg font-semibold">Recent Invoices</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs">
                        <Link href={`/invoices?customer=${encodeURIComponent(customer.name)}`}>
                            View All
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {!invoices || invoices.length === 0 ? (
                        <div className="text-center py-6">
                            <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No invoices yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {invoices.map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    href={`/invoices/${invoice.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">#{invoice.invoice_number}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">
                                                {formatDate(invoice.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">
                                            {formatCurrency(invoice.total_amount)}
                                        </span>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
