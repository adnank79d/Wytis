"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowLeft, Printer, Download, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { markInvoiceAsPaid } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
// Removed unused toast import
// We'll use simple button state loading.

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
    };
    business: {
        name: string;
        currency: string;
        gst_number: string | null;
    };
}

export function InvoiceView({ invoice, business }: InvoiceViewProps) {
    const router = useRouter();
    const [isPaying, setIsPaying] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = () => {
        const subject = `Invoice ${invoice.invoice_number} from ${business.name}`;
        const body = `Hi ${invoice.customer_name},\n\nPlease find attached invoice ${invoice.invoice_number} for amount ${formatCurrency(invoice.total_amount)}.\n\nRegards,\n${business.name}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleMarkAsPaid = async () => {
        if (!confirm("Are you sure you want to mark this invoice as paid? This will update your accounting ledger.")) return;
        setIsPaying(true);
        const result = await markInvoiceAsPaid(invoice.id, invoice.total_amount);
        setIsPaying(false);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.message || "Failed");
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
                    {invoice.status !== 'paid' && (
                        <Button onClick={handleMarkAsPaid} disabled={isPaying} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isPaying ? "Updating..." : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                </>
                            )}
                        </Button>
                    )}
                    <Button onClick={handleEmail} variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Invoice Paper */}
            <Card className="bg-white text-slate-900 border shadow-sm print:shadow-none print:border-none p-8 md:p-12 min-h-[297mm] mx-auto overflow-hidden print:overflow-visible" id="invoice-paper">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">{business.name}</h1>
                        {business.gst_number && (
                            <p className="text-sm text-slate-500 mt-1">GSTIN: {business.gst_number}</p>
                        )}
                        {/* Placeholder Address since not in schema yet */}
                        <div className="text-sm text-slate-500 mt-2 space-y-0.5">
                            <p>Registered Office Address</p>
                            <p>City, State, Zip Code</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-slate-300 tracking-tight uppercase">Invoice</h2>
                        <div className="mt-4 space-y-1">
                            <p className="text-sm font-medium">#{invoice.invoice_number}</p>
                            <p className="text-sm text-slate-500">{formatDate(invoice.invoice_date)}</p>
                        </div>
                        <div className={cn(
                            "mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border",
                            invoice.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                invoice.status === 'issued' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                            {invoice.status}
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Bill To */}
                <div className="mb-12">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                    <h3 className="text-lg font-medium text-slate-900">{invoice.customer_name}</h3>
                    {/* Placeholder Customer Address */}
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
        </div>
    );
}
