import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Lock, Search } from "lucide-react";
import { Role, can, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Get Business Context & Role
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
        console.error("InvoicesPage: Membership error or none found", membershipError);
        // Do NOT redirect. Show empty/error state.
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No business account found.</p>
                <p className="text-sm">Please contact support or create a business.</p>
                <code className="block mt-4 text-xs bg-muted p-2 rounded">{membershipError?.message || "No Data"}</code>
            </div>
        );
    }

    const membership = membershipData;
    const business = membership.businesses as unknown as { name: string; trial_ends_at: string; subscription_status: 'active' | 'expired' | 'paid' };
    const userRole = membership.role as Role;
    const isTrialExpired = business.subscription_status === 'expired';
    const canCreateInvoice = userRole === 'owner' && !isTrialExpired;

    // 2. Fetch Invoices
    const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, customer_name, invoice_date, total_amount, status")
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching invoices:", error);
    }

    // Utility for formatting
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) { // 'draft' | 'issued' | 'paid'
            case 'paid':
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>;
            case 'issued':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Issued</Badge>;
            default:
                return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">Manage and track your issued invoices.</p>
                </div>

                {/* CREATE ACTION */}
                <div className="flex flex-col items-end gap-1">
                    <Button
                        asChild={canCreateInvoice}
                        disabled={!canCreateInvoice}
                        variant={canCreateInvoice ? "default" : "secondary"}
                    >
                        {canCreateInvoice ? (
                            <Link href="/invoices/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Invoice
                            </Link>
                        ) : (
                            <span className="cursor-not-allowed opacity-70">
                                <Lock className="mr-2 h-4 w-4" />
                                Create Invoice
                            </span>
                        )}
                    </Button>
                    {!canCreateInvoice && (
                        <span className="text-[10px] text-muted-foreground">
                            {isTrialExpired ? "Trial Expired" : "Owner access required"}
                        </span>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            {!invoices || invoices.length === 0 ? (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg bg-muted/50">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No invoices yet</h3>
                    <p className="text-muted-foreground text-sm max-w-xs text-center mt-2 mb-6">
                        Create your first invoice to start tracking revenue and generating reports.
                    </p>
                    {canCreateInvoice && (
                        <Button asChild>
                            <Link href="/invoices/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Invoice
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                // LIST STATE
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[180px]">Invoice Number</TableHead>
                                <TableHead>Customer Name</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[150px] text-right">Amount</TableHead>
                                <TableHead className="w-[120px] text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow
                                    key={invoice.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                >
                                    <TableCell className="font-medium">
                                        <Link href={`/invoices/${invoice.id}`} className="block w-full h-full text-foreground group-hover:underline underline-offset-4 decoration-muted-foreground/50">
                                            {invoice.invoice_number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/invoices/${invoice.id}`} className="block w-full h-full">
                                            {invoice.customer_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/invoices/${invoice.id}`} className="block w-full h-full text-muted-foreground">
                                            {formatDate(invoice.invoice_date)}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        <Link href={`/invoices/${invoice.id}`} className="block w-full h-full">
                                            {formatCurrency(invoice.total_amount)}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/invoices/${invoice.id}`} className="block w-full h-full">
                                            {getStatusBadge(invoice.status)}
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
