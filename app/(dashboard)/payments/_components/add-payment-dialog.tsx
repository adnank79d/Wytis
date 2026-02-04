"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Loader2,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    User,
    CreditCard,
    Calendar,
    FileText,
    Link as LinkIcon
} from "lucide-react";
import { addPayment, PaymentFormState } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";

interface Invoice {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
}

interface AddPaymentDialogProps {
    invoices: Invoice[];
}

export function AddPaymentDialog({ invoices }: AddPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [paymentType, setPaymentType] = useState<'received' | 'made'>('received');
    const [state, setState] = useState<PaymentFormState>({ message: null, errors: {} });
    const router = useRouter();

    const today = new Date().toISOString().split('T')[0];

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            const result = await addPayment({ message: null, errors: {} }, formData);
            setState(result);

            if (!result.errors && !result.message?.includes("Failed")) {
                setOpen(false);
                router.refresh();
                // Reset form state optionally here if needed, but dialog close usually handles UX
            }
        } catch (error) {
            console.error("Failed to add payment", error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-lg h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl">Record Payment</DialogTitle>
                    <DialogDescription>
                        Log a new payment transaction.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Payment Type Toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentType('received')}
                                className={cn(
                                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                    paymentType === 'received'
                                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 font-medium shadow-sm"
                                        : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <ArrowDownLeft className={cn("h-4 w-4", paymentType === 'received' ? "text-emerald-600" : "text-slate-400")} />
                                Incoming
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('made')}
                                className={cn(
                                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                    paymentType === 'made'
                                        ? "border-rose-500 bg-rose-50/50 text-rose-700 font-medium shadow-sm"
                                        : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <ArrowUpRight className={cn("h-4 w-4", paymentType === 'made' ? "text-rose-600" : "text-slate-400")} />
                                Outgoing
                            </button>
                        </div>
                        <input type="hidden" name="payment_type" value={paymentType} />
                        <input type="hidden" name="status" value="completed" />

                        {/* Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <Wallet className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Transaction Details</h4>
                            </div>

                            <div className="grid gap-4">
                                {/* Party Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="party_name" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        <User className="h-3 w-3" /> {paymentType === 'received' ? 'Received From *' : 'Paid To *'}
                                    </Label>
                                    <Input
                                        id="party_name"
                                        name="party_name"
                                        placeholder={paymentType === 'received' ? "Customer Name" : "Vendor Name"}
                                        required
                                        className="h-10 border-slate-200"
                                    />
                                    {state.errors?.party_name && (
                                        <p className="text-xs text-red-500">{state.errors.party_name[0]}</p>
                                    )}
                                </div>

                                {/* Amount & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Amount (₹) *
                                        </Label>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                            className="h-10 border-slate-200 font-medium"
                                        />
                                        {state.errors?.amount && (
                                            <p className="text-xs text-red-500">{state.errors.amount[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_date" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <Calendar className="h-3 w-3" /> Date *
                                        </Label>
                                        <Input
                                            id="payment_date"
                                            name="payment_date"
                                            type="date"
                                            defaultValue={today}
                                            required
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                </div>

                                {/* Reference & Method */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_method" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <CreditCard className="h-3 w-3" /> Method
                                        </Label>
                                        <Select name="payment_method" defaultValue="cash">
                                            <SelectTrigger className="h-10 border-slate-200">
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="reference_number" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Reference / ID
                                        </Label>
                                        <Input
                                            id="reference_number"
                                            name="reference_number"
                                            placeholder="Optional"
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Linking (Only for Received) */}
                        {paymentType === 'received' && invoices.length > 0 && (
                            <div className="space-y-3">
                                <Label htmlFor="invoice_id" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    <LinkIcon className="h-3 w-3" /> Link Invoice (Optional)
                                </Label>
                                <Select name="invoice_id">
                                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select an invoice to link..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {invoices.map((invoice) => (
                                            <SelectItem key={invoice.id} value={invoice.id}>
                                                #{invoice.invoice_number} - {invoice.customer_name} (₹{invoice.total_amount})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-3 pt-2 border-t border-border/40">
                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    <FileText className="h-3 w-3" /> Notes
                                </Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Add any notes..."
                                    rows={2}
                                    className="resize-none border-slate-200 bg-yellow-50/30"
                                />
                            </div>
                        </div>

                        {state.message && (
                            <div className={`p-3 rounded-md text-sm font-medium ${state.message.includes('success') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {state.message}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-2 border-t border-border/50 bg-slate-50/50">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className={cn(
                                "h-10 px-8 text-white transition-all",
                                paymentType === 'received'
                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                            )}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Record Payment"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
