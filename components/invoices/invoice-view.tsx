"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Printer,
    Mail,
    CheckCircle,
    Send,
    Trash2,
    Copy,
    Ban,
    MoreVertical,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
    markInvoiceAsPaid,
    issueInvoice,
    deleteInvoice,
    voidInvoice,
    duplicateInvoice
} from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    gst_rate: number;
    line_total: number;
}

interface InvoiceViewProps {
    invoice: {
        id: string;
        invoice_number: string;
        invoice_date: string;
        status: string;
        subtotal: number;
        gst_amount: number;
        total_amount: number;
        customer_name: string;
        created_at: string;
        invoice_items: InvoiceItem[];
        notes?: string;
        due_date?: string;
        void_reason?: string;
    };
    business: {
        name: string;
        currency: string;
        gst_number: string | null;
        address?: string;
    };
}

export function InvoiceView({ invoice, business }: InvoiceViewProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [voidReason, setVoidReason] = useState("");

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = () => {
        const subject = `Invoice ${invoice.invoice_number} from ${business.name}`;
        const body = `Hi ${invoice.customer_name},\n\nPlease find attached invoice ${invoice.invoice_number} for amount ${formatCurrency(invoice.total_amount)}.\n\nRegards,\n${business.name}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleAction = async (action: string) => {
        setIsLoading(true);
        setLoadingAction(action);

        try {
            let result;
            switch (action) {
                case 'issue':
                    result = await issueInvoice(invoice.id);
                    break;
                case 'pay':
                    result = await markInvoiceAsPaid(invoice.id, invoice.total_amount);
                    break;
                case 'delete':
                    result = await deleteInvoice(invoice.id);
                    if (result.success) {
                        router.push('/invoices');
                        return;
                    }
                    break;
                case 'void':
                    if (!voidReason.trim()) {
                        alert("Please provide a reason for voiding this invoice");
                        return;
                    }
                    result = await voidInvoice(invoice.id, voidReason);
                    break;
                case 'duplicate':
                    result = await duplicateInvoice(invoice.id);
                    if (result.success && result.invoiceId) {
                        router.push(`/invoices/${result.invoiceId}`);
                        return;
                    }
                    break;
            }

            if (result?.success) {
                router.refresh();
            } else {
                alert(result?.message || "Action failed");
            }
        } finally {
            setIsLoading(false);
            setLoadingAction(null);
            setShowDeleteDialog(false);
            setShowVoidDialog(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: business.currency || 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            draft: { bg: "bg-slate-100", text: "text-slate-700", label: "Draft" },
            issued: { bg: "bg-blue-100", text: "text-blue-700", label: "Issued" },
            paid: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Paid" },
            cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
            voided: { bg: "bg-red-100", text: "text-red-700", label: "Voided" },
        };
        const config = configs[status] || configs.draft;
        return (
            <Badge className={cn(config.bg, config.text, "font-medium uppercase tracking-wider")}>
                {config.label}
            </Badge>
        );
    };

    const isCancelled = invoice.status === 'cancelled' || invoice.status === 'voided';
    const isDraft = invoice.status === 'draft';
    const isIssued = invoice.status === 'issued';
    const isPaid = invoice.status === 'paid';

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Action Bar - Hidden during print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/invoices">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Invoices
                    </Link>
                </Button>
                <div className="flex gap-2">
                    {/* Primary Actions based on status */}
                    {isDraft && (
                        <Button
                            onClick={() => handleAction('issue')}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loadingAction === 'issue' ? "Issuing..." : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Issue Invoice
                                </>
                            )}
                        </Button>
                    )}

                    {isIssued && (
                        <Button
                            onClick={() => handleAction('pay')}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {loadingAction === 'pay' ? "Processing..." : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                </>
                            )}
                        </Button>
                    )}

                    {/* Email & Print (always available except cancelled) */}
                    {!isCancelled && (
                        <>
                            <Button onClick={handleEmail} variant="outline">
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </Button>
                            <Button onClick={handlePrint} variant="outline">
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        </>
                    )}

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>

                            {(isDraft || isCancelled) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {isCancelled ? "Delete Invoice" : "Delete Draft"}
                                    </DropdownMenuItem>
                                </>
                            )}

                            {(isIssued || isPaid) && !isCancelled && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowVoidDialog(true)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Void Invoice
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cancelled/Voided Warning Banner */}
            {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3 print:hidden">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800">This invoice has been cancelled</p>
                        {invoice.void_reason && (
                            <p className="text-sm text-red-700 mt-1">Reason: {invoice.void_reason}</p>
                        )}
                        <p className="text-xs text-red-600 mt-2">
                            You can delete this invoice to remove it completely from your records.
                        </p>
                    </div>
                </div>
            )}

            {/* Invoice Paper */}
            <Card className={cn(
                "bg-white text-slate-900 border shadow-sm print:shadow-none print:border-none p-8 md:p-12 min-h-[297mm] mx-auto overflow-hidden print:overflow-visible",
                isCancelled && "opacity-60"
            )} id="invoice-paper">
                {/* Cancelled Watermark */}
                {isCancelled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-6xl font-bold text-red-200 transform -rotate-45 uppercase tracking-widest">
                            CANCELLED
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-12 relative">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">{business.name}</h1>
                        {business.gst_number && (
                            <p className="text-sm text-slate-500 mt-1">GSTIN: {business.gst_number}</p>
                        )}
                        <div className="text-sm text-slate-500 mt-2 space-y-0.5">
                            {business.address ? (
                                <p>{business.address}</p>
                            ) : (
                                <>
                                    <p>Registered Office Address</p>
                                    <p>City, State, Zip Code</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-slate-300 tracking-tight uppercase">Invoice</h2>
                        <div className="mt-4 space-y-1">
                            <p className="text-sm font-medium">#{invoice.invoice_number}</p>
                            <p className="text-sm text-slate-500">{formatDate(invoice.invoice_date)}</p>
                            {invoice.due_date && (
                                <p className="text-xs text-slate-400">Due: {formatDate(invoice.due_date)}</p>
                            )}
                        </div>
                        <div className="mt-4">
                            {getStatusBadge(invoice.status)}
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Bill To */}
                <div className="mb-12">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                    <h3 className="text-lg font-medium text-slate-900">{invoice.customer_name}</h3>
                    <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                        <p>Customer Address Line 1</p>
                        <p>City, State, Zip Code</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left font-medium text-slate-500 pb-3 pl-2 w-[40%]">Item Description</th>
                                <th className="text-right font-medium text-slate-500 pb-3 w-[15%]">Qty</th>
                                <th className="text-right font-medium text-slate-500 pb-3 w-[15%]">Rate</th>
                                <th className="text-right font-medium text-slate-500 pb-3 w-[15%]">GST</th>
                                <th className="text-right font-medium text-slate-500 pb-3 pr-2 w-[15%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.invoice_items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-4 pl-2 text-slate-900 font-medium">{item.description}</td>
                                    <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-4 text-right text-slate-600">{item.gst_rate}%</td>
                                    <td className="py-4 text-right text-slate-900 font-medium pr-2">
                                        {formatCurrency(item.line_total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>GST Total</span>
                            <span>{formatCurrency(invoice.gst_amount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                            <span>Total</span>
                            <span>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-8">
                        <p className="font-medium text-slate-700 mb-1">Notes</p>
                        <p>{invoice.notes}</p>
                    </div>
                )}

                {/* Footer Notes */}
                <div className="bg-slate-50 p-6 rounded-lg text-xs text-slate-500 space-y-1 print:bg-transparent print:p-0">
                    <p className="font-semibold text-slate-700">Payment Details</p>
                    <p>Bank: HDFC Bank</p>
                    <p>Account: {business.name}</p>
                    <p>IFSC: HDFC0001234</p>
                    <div className="h-4"></div>
                    <p>Note: Thank you for your business.</p>
                </div>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isCancelled ? "Delete Cancelled Invoice?" : "Delete Draft Invoice?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete invoice {invoice.invoice_number}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAction('delete')}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Void Confirmation Dialog */}
            <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Void Invoice?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>
                                This will void invoice {invoice.invoice_number} and create reversal
                                entries in your accounting ledger. The invoice will be marked as voided
                                but not deleted.
                            </p>
                            <div>
                                <label className="text-sm font-medium text-foreground">Reason for voiding</label>
                                <input
                                    type="text"
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    placeholder="e.g., Customer cancelled order"
                                    className="mt-1.5 w-full px-3 py-2 border rounded-md text-sm"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAction('void')}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!voidReason.trim()}
                        >
                            Void Invoice
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
