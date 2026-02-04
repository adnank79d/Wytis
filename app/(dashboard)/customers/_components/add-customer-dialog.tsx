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
import {
    Plus,
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    FileText
} from "lucide-react";
import { addCustomer, CustomerFormState } from "@/lib/actions/customers";

export function AddCustomerDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [state, setState] = useState<CustomerFormState>({ message: null, errors: {} });
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            const result = await addCustomer({ message: null, errors: {} }, formData);
            setState(result);

            if (!result.errors && !result.message?.includes("Failed")) {
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to add customer", error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-lg h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl">Add New Customer</DialogTitle>
                    <DialogDescription>
                        Create a new customer profile.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <User className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Basic Information</h4>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Acme Corporation"
                                        required
                                        className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                                    />
                                    {state.errors?.name && (
                                        <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <Mail className="h-3 w-3" /> Email
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="client@example.com"
                                            className="h-10 border-slate-200"
                                        />
                                        {state.errors?.email && (
                                            <p className="text-xs text-red-500">{state.errors.email[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <Phone className="h-3 w-3" /> Phone
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+91..."
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Billing Details</h4>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gst_number" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GST Number</Label>
                                    <Input
                                        id="gst_number"
                                        name="gst_number"
                                        placeholder="22AAAAA0000A1Z5"
                                        className="h-10 font-mono uppercase border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        <MapPin className="h-3 w-3" /> Address
                                    </Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Full billing address..."
                                        rows={3}
                                        className="resize-none border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3 pt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    <FileText className="h-3 w-3" /> Internal Notes
                                </Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Add any internal notes about this customer..."
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
                        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-8">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Customer"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
