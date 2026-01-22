"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { addPayment, PaymentFormState } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Invoice {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
}

interface AddPaymentFormProps {
    invoices: Invoice[];
}

export function AddPaymentForm({ invoices }: AddPaymentFormProps) {
    const initialState: PaymentFormState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(addPayment, initialState);
    const [paymentType, setPaymentType] = useState<'received' | 'made'>('received');

    const today = new Date().toISOString().split('T')[0];

    return (
        <form action={formAction} className="space-y-6">
            {state.message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
                    {state.message}
                </div>
            )}

            {/* Payment Type Toggle */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Payment Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentType('received')}
                            className={cn(
                                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                paymentType === 'received'
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                                    : "border-border/60 hover:border-border"
                            )}
                        >
                            <ArrowDownLeft className={cn(
                                "h-5 w-5",
                                paymentType === 'received' ? "text-emerald-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                "font-medium",
                                paymentType === 'received' ? "text-emerald-700" : "text-muted-foreground"
                            )}>
                                Received
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentType('made')}
                            className={cn(
                                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                paymentType === 'made'
                                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                                    : "border-border/60 hover:border-border"
                            )}
                        >
                            <ArrowUpRight className={cn(
                                "h-5 w-5",
                                paymentType === 'made' ? "text-rose-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                "font-medium",
                                paymentType === 'made' ? "text-rose-700" : "text-muted-foreground"
                            )}>
                                Paid Out
                            </span>
                        </button>
                    </div>
                    <input type="hidden" name="payment_type" value={paymentType} />
                </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Party Name */}
                    <div className="space-y-2">
                        <Label htmlFor="party_name" className="text-sm font-medium">
                            {paymentType === 'received' ? 'Received From *' : 'Paid To *'}
                        </Label>
                        <Input
                            id="party_name"
                            name="party_name"
                            placeholder={paymentType === 'received' ? "Customer name" : "Vendor/Supplier name"}
                            required
                            className="h-11 bg-background border-border/60 rounded-lg"
                        />
                        {state.errors?.party_name && (
                            <p className="text-xs text-red-500">{state.errors.party_name[0]}</p>
                        )}
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium">Amount (₹) *</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                required
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                            {state.errors?.amount && (
                                <p className="text-xs text-red-500">{state.errors.amount[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_date" className="text-sm font-medium">Date *</Label>
                            <Input
                                id="payment_date"
                                name="payment_date"
                                type="date"
                                defaultValue={today}
                                required
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_method" className="text-sm font-medium">Payment Method</Label>
                        <Select name="payment_method" defaultValue="cash">
                            <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-2">
                        <Label htmlFor="reference_number" className="text-sm font-medium">Reference / Transaction ID</Label>
                        <Input
                            id="reference_number"
                            name="reference_number"
                            placeholder="Optional reference number"
                            className="h-11 bg-background border-border/60 rounded-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Linking (only for received) */}
            {paymentType === 'received' && invoices.length > 0 && (
                <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base md:text-lg font-semibold">Link to Invoice (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select name="invoice_id">
                            <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg">
                                <SelectValue placeholder="Select an invoice" />
                            </SelectTrigger>
                            <SelectContent>
                                {invoices.map((invoice) => (
                                    <SelectItem key={invoice.id} value={invoice.id}>
                                        #{invoice.invoice_number} - {invoice.customer_name} (₹{invoice.total_amount})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {/* Notes */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Add any additional notes..."
                        rows={3}
                        className="bg-background border-border/60 rounded-lg resize-none"
                    />
                </CardContent>
            </Card>

            {/* Hidden status field with default completed */}
            <input type="hidden" name="status" value="completed" />

            <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" asChild className="rounded-lg">
                    <Link href="/payments">Cancel</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                        "rounded-lg px-6",
                        paymentType === 'received'
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                            : "bg-gradient-to-r from-rose-600 to-rose-500"
                    )}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Record Payment
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
