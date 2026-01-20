"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Plus, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Zod Schema matching Backend
const ItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Qty must be at least 1"),
    unit_price: z.number().min(0, "Price must be positive"),
    gst_rate: z.number().min(0).max(100),
});

const InvoiceFormSchema = z.object({
    customer_name: z.string().min(1, "Customer Name is required"),
    invoice_number: z.string().min(1, "Invoice Number is required"),
    invoice_date: z.string().min(1, "Date is required"),
    items: z.array(ItemSchema).min(1, "Add at least one item"),
});

type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

export function CreateInvoiceForm({ businessId }: { businessId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(InvoiceFormSchema),
        defaultValues: {
            invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`, // Simple auto-gen
            invoice_date: new Date().toISOString().split('T')[0],
            items: [{ description: "", quantity: 1, unit_price: 0, gst_rate: 18 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Calculations for UI only (Backend does official math)
    const watchItems = form.watch("items");
    const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalGst = watchItems.reduce((sum, item) => sum + ((item.quantity * item.unit_price) * (item.gst_rate / 100)), 0);
    const total = subtotal + totalGst;

    async function onSubmit(data: InvoiceFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_id: businessId,
                    ...data,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to create invoice");
            }

            // Success
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
                        <p className="text-sm text-muted-foreground">Create a new invoice for your customer.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" type="button" asChild>
                        <Link href="/dashboard">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Issue Invoice
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-50 text-red-900 text-sm border border-red-200">
                    {error}
                </div>
            )}

            {/* Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Customer Name</Label>
                        <Input {...form.register("customer_name")} placeholder="Enter client name" />
                        {form.formState.errors.customer_name && <p className="text-xs text-red-600">{form.formState.errors.customer_name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input {...form.register("invoice_number")} />
                            {form.formState.errors.invoice_number && <p className="text-xs text-red-600">{form.formState.errors.invoice_number.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" {...form.register("invoice_date")} />
                            {form.formState.errors.invoice_date && <p className="text-xs text-red-600">{form.formState.errors.invoice_date.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Items</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unit_price: 0, gst_rate: 18 })}>
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid gap-4 items-end md:grid-cols-12 border-b pb-4 last:border-0 last:pb-0">
                            <div className="md:col-span-6 space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>Description</Label>
                                <Input {...form.register(`items.${index}.description`)} placeholder="Item description" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>Qty</Label>
                                <Input type="number" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>Price</Label>
                                <Input type="number" {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>GST%</Label>
                                <Input type="number" {...form.register(`items.${index}.gst_rate`, { valueAsNumber: true })} />
                            </div>
                            <div className="md:col-span-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="text-muted-foreground hover:text-red-600">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Totals Summary */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full md:w-1/3 space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>GST Total</span>
                                <span>₹{totalGst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
