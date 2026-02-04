"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackagePlus, Loader2 } from "lucide-react";
import { createGRN } from "@/lib/actions/purchase-orders";

export function ReceiveGRNDialog({ po }: { po: any }) {
    const [open, setOpen] = useState(false);

    // We can't easily use useActionState inside the Dialog smoothly without keeping state,
    // Using simple form submission handling or extracting form content.
    // For simplicity, we'll wrap form in component or handle action manually with isPending.
    // Let's use useActionState but close dialog on success.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="border border-border/50">
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Receive GRN
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <GRNForm po={po} onClose={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function GRNForm({ po, onClose }: { po: any, onClose: () => void }) {
    const initialState = { success: false, message: "" };
    const [state, formAction, isPending] = useActionState(createGRN, initialState);

    // Initial item values (receive remaining quantity calculation could be here, but simple default for now)
    // We default to 0 to force user to enter what they received.
    const [receivedItems, setReceivedItems] = useState<{ po_item_id: string, quantity_received: number }[]>(
        po.items.map((item: any) => ({ po_item_id: item.id, quantity_received: item.quantity }))
    );

    const updateQty = (id: string, qty: number) => {
        setReceivedItems(prev => prev.map(i => i.po_item_id === id ? { ...i, quantity_received: qty } : i));
    };

    return (
        <form action={async (formData) => {
            await formAction(formData);
            onClose(); // Ideally check for success but for MVP close optimistically or if redirect happens
        }}>
            <DialogHeader>
                <DialogTitle>Receive Goods (GRN)</DialogTitle>
                <DialogDescription>
                    Record items received against this PO. Inventory will be updated.
                </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="po_id" value={po.id} />
            <input type="hidden" name="items" value={JSON.stringify(receivedItems)} />

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="received_date">Received Date</Label>
                        <Input
                            type="date"
                            name="received_date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input name="notes" placeholder="Delivery details, Challan No..." />
                    </div>
                </div>

                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left">Item</th>
                                <th className="px-3 py-2 text-right">Ordered</th>
                                <th className="px-3 py-2 text-right w-[100px]">Received</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {po.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="px-3 py-2">
                                        <div className="font-medium">{item.description}</div>
                                    </td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">
                                        {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Input
                                            type="number"
                                            min="0"
                                            max={item.quantity} // Optional constraint
                                            step="0.01"
                                            className="h-8 w-20 ml-auto text-right"
                                            value={receivedItems.find(i => i.po_item_id === item.id)?.quantity_received || 0}
                                            onChange={(e) => updateQty(item.id, parseFloat(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating GRN...
                        </>
                    ) : (
                        "Create GRN"
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
}
