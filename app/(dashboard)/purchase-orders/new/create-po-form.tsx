"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { createPO, CreatePOFormState } from "@/lib/actions/purchase-orders"; // Assuming type export exists or will be added
import { Customer } from "@/lib/actions/customers";
import { InventoryProduct } from "@/lib/actions/inventory";

interface CreatePOFormProps {
    vendors: Customer[];
    products: InventoryProduct[];
}

export function CreatePOForm({ vendors, products }: CreatePOFormProps) {
    const initialState: CreatePOFormState = { message: undefined, errors: {} };
    const [state, formAction, isPending] = useActionState(createPO, initialState);

    // Items State
    const [items, setItems] = useState([
        { id: Date.now(), product_id: "", description: "", quantity: 1, unit_price: 0 }
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), product_id: "", description: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length === 1) return;
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                // Auto-fill details if product selected
                if (field === 'product_id') {
                    const product = products.find(p => p.id === value);
                    if (product) {
                        updated.description = product.name;
                        updated.unit_price = product.cost_price; // Use cost price for PO
                    }
                }
                return updated;
            }
            return item;
        }));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="items" value={JSON.stringify(items)} />

            {state?.message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
                    {state.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT: Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-xl border border-border/40 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vendor_id">Vendor *</Label>
                                    <Select name="vendor_id" required>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="po_date">PO Date *</Label>
                                    <Input
                                        type="date"
                                        name="po_date"
                                        className="h-11"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expected_date">Expected Date</Label>
                                    <Input
                                        type="date"
                                        name="expected_date"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input name="notes" placeholder="Delivery instructions..." className="h-11" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ITEMS */}
                    <Card className="rounded-xl border border-border/40 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-6 py-3 border-b border-border/40 flex justify-between items-center">
                            <h3 className="font-semibold text-sm">Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8">
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add Item
                            </Button>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/20 text-muted-foreground font-medium">
                                        <tr>
                                            <th className="px-4 py-2 w-[35%] text-left">Product / Description</th>
                                            <th className="px-4 py-2 w-[15%] text-right">Qty</th>
                                            <th className="px-4 py-2 w-[20%] text-right">Price</th>
                                            <th className="px-4 py-2 w-[20%] text-right">Total</th>
                                            <th className="px-4 py-2 w-[10%] text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="p-3">
                                                    <div className="space-y-2">
                                                        <Select
                                                            value={item.product_id}
                                                            onValueChange={(val) => updateItem(item.id, 'product_id', val)}
                                                        >
                                                            <SelectTrigger className="h-9 w-full bg-transparent border-border/60">
                                                                <SelectValue placeholder="Select Item (Optional)" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {products.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                            placeholder="Description"
                                                            className="h-9"
                                                            required
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 align-top">
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                        className="h-9 text-right"
                                                    />
                                                </td>
                                                <td className="p-3 align-top">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                                        className="h-9 text-right"
                                                    />
                                                </td>
                                                <td className="p-3 align-top text-right font-medium pt-5">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.quantity * item.unit_price)}
                                                </td>
                                                <td className="p-3 align-top text-center pt-4">
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-muted-foreground hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-muted/10 p-4 flex justify-end items-center gap-4 border-t border-border/40">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Amount</span>
                            <span className="text-xl font-bold">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: Actions */}
                <div className="space-y-6">
                    <Card className="rounded-xl border border-border/40 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-semibold text-sm">Summary</h3>
                            <div className="text-xs text-muted-foreground">
                                Purchase Order will be created as <strong>Draft</strong>. You can issue it later.
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-primary/90"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create PO
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/purchase-orders">Cancel</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
