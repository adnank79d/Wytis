import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Send, PackagePlus, FileText } from "lucide-react";
import { getPurchaseOrder } from "@/lib/actions/purchase-orders";
import { POActions } from "./po-actions";
import { ReceiveGRNDialog } from "./receive-grn-dialog";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function PODetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const po = await getPurchaseOrder(id);

    if (!po) {
        notFound();
    }

    const { supabase } = await (async () => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect('/login');

        const { data: membership } = await supabase.from('memberships').select('role, business_id').eq('user_id', user.id).single();
        if (!membership) redirect('/onboarding');

        return { supabase, user, membership };
    })();

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

    const canEdit = po.status === 'draft';
    const canReceive = po.status === 'issued' || po.status === 'partially_received';

    return (
        <div className="max-w-5xl mx-auto py-4 md:py-8 px-3 md:px-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/purchase-orders"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to POs
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {po.po_number}
                        </h1>
                        <Badge variant="secondary" className={cn(
                            "capitalize text-sm font-normal border-0 px-3",
                            po.status === 'issued' ? "bg-blue-100 text-blue-700" :
                                po.status === 'draft' ? "bg-muted text-muted-foreground" :
                                    po.status === 'partially_received' ? "bg-amber-100 text-amber-700" :
                                        po.status === 'closed' ? "bg-emerald-100 text-emerald-700" : ""
                        )}>
                            {po.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Actions Component for Issue/Delete/Void */}
                    <POActions po={po} />

                    {canReceive && (
                        <ReceiveGRNDialog po={po} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT: Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-xl border border-border/40 shadow-sm bg-card">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
                                    <h3 className="font-bold text-lg">My Busines</h3> {/* Placeholder, should come from business context */}
                                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                                        {/* Business Address */}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vendor</p>
                                    <h3 className="font-bold text-lg text-primary">{po.vendor?.name}</h3>
                                    {po.vendor?.email && <p className="text-sm text-muted-foreground">{po.vendor.email}</p>}
                                    {po.vendor?.phone && <p className="text-sm text-muted-foreground">{po.vendor.phone}</p>}
                                    {po.vendor?.gst_number && <p className="text-xs mt-1 text-muted-foreground">GST: {po.vendor.gst_number}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">PO Date</p>
                                    <p className="font-medium">{formatDate(po.po_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expected Delivery</p>
                                    <p className="font-medium">{po.expected_date ? formatDate(po.expected_date) : '-'}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border rounded-lg overflow-hidden mb-8">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left font-medium">Item</th>
                                            <th className="px-4 py-3 text-right font-medium">Qty</th>
                                            <th className="px-4 py-3 text-right font-medium">Rate</th>
                                            <th className="px-4 py-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {po.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{item.description}</p>
                                                    {item.product?.sku && <p className="text-xs text-muted-foreground">{item.product.sku}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.line_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end">
                                <div className="w-full max-w-xs space-y-3">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(po.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {po.notes && (
                                <div className="mt-8 pt-6 border-t border-dashed">
                                    <p className="text-sm font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-muted-foreground">{po.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* GRN History */}
                    {po.grns && po.grns.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Goods Receipts (GRNs)</h3>
                            {po.grns.map((grn: any) => (
                                <Card key={grn.id} className="rounded-xl border border-border/40 shadow-sm">
                                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {grn.grn_number}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">{formatDate(grn.received_date)}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            {/* Link to GRN details if implemented */}
                                            <span>View</span>
                                        </Button>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar */}
                <div className="space-y-6">
                    {/* Could act as timeline or helper actions */}
                    <Card className="rounded-xl border border-border/40 shadow-sm p-4 bg-muted/20">
                        <h4 className="font-medium text-sm mb-2">Help</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            After issuing the PO, you can create Goods Receipt Notes (GRN) to track received inventory.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Inventory quantities are updated automatically when you create a GRN.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
