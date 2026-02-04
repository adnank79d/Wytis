"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, ChevronsUpDown, Check, Trash2, Plus, Receipt, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createInvoice } from "@/lib/actions/invoices";

const formSchema = z.object({
    customer: z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Customer name is required"),
    }),
    invoice_date: z.date(),
    due_date: z.date().optional(),
    discount: z.number().min(0).default(0),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Qty > 0"),
        unit_price: z.number().min(0, "Price >= 0"),
        cost_price: z.number().min(0),
        gst_rate: z.number().min(0, "GST >= 0"),
    })).min(1, "At least one item is required"),
});

// ... (Customer and InventoryProduct types remain same)
type Customer = {
    id: string;
    name: string;
    tax_id?: string | null;
    email?: string | null;
    phone?: string | null;
};

type InventoryProduct = {
    id: string;
    name: string;
    sku: string | null;
    unit_price: number;
    cost_price?: number;
    gst_rate: number;
    quantity: number;
    prices_include_tax?: boolean;
};

interface CreateInvoiceDialogProps {
    existingCustomers: Customer[];
    inventoryProducts: InventoryProduct[];
}

export function CreateInvoiceDialog({ existingCustomers, inventoryProducts }: CreateInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openProductCombo, setOpenProductCombo] = useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            customer: { name: "", id: undefined },
            invoice_date: new Date(),
            due_date: addDays(new Date(), 30),
            discount: 0,
            notes: "",
            items: [{ product_id: undefined, description: "", quantity: 1, unit_price: 0, cost_price: 0, gst_rate: 18 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    });

    const items = form.watch("items");
    const discount = form.watch("discount") || 0;
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalGst = items.reduce((sum, item) => {
        const lineGst = item.quantity * item.unit_price * (item.gst_rate / 100);
        return sum + Math.round(lineGst * 100) / 100;
    }, 0);
    const grandTotal = Math.max(0, (Math.round((subtotal + totalGst) * 100) / 100) - discount);
    const totalCost = items.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0);
    const estimatedProfit = grandTotal - totalCost - totalGst;

    async function onSubmit(values: any, status: 'draft' | 'issued') {
        setIsSubmitting(true);
        const formData = new FormData();
        if (values.customer.id) formData.append("customer_id", values.customer.id);
        formData.append("customer_name", values.customer.name);
        formData.append("invoice_date", values.invoice_date.toISOString());
        if (values.due_date) formData.append("due_date", values.due_date.toISOString());
        formData.append("discount", values.discount.toString());
        if (values.notes) formData.append("notes", values.notes);
        formData.append("status", status);
        formData.append("items", JSON.stringify(values.items));

        const result = await createInvoice({} as any, formData);

        if (result?.message) {
            // Handle message if needed
        }

        setIsSubmitting(false);
        setOpen(false);
        router.refresh();
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-lg h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> New Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-indigo-600" />
                        Create New Invoice
                    </DialogTitle>
                    <DialogDescription>
                        Draft a new invoice for your client.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Form {...form}>
                        <form className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="customer.name"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer *</FormLabel>
                                            <Popover open={openCustomerCombo} onOpenChange={setOpenCustomerCombo}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-9 border-slate-200", !field.value && "text-muted-foreground")}>
                                                            {field.value || "Select Customer"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search..." className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>No customer found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {existingCustomers.map((customer) => (
                                                                    <CommandItem
                                                                        value={customer.name}
                                                                        key={customer.id}
                                                                        onSelect={() => {
                                                                            form.setValue("customer.name", customer.name);
                                                                            form.setValue("customer.id", customer.id);
                                                                            setOpenCustomerCombo(false);
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span>{customer.name}</span>
                                                                            {customer.email && <span className="text-xs text-muted-foreground">{customer.email}</span>}
                                                                        </div>
                                                                        <Check className={cn("ml-auto h-4 w-4", customer.name === field.value ? "opacity-100" : "opacity-0")} />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                    <div className="p-2 border-t">
                                                        <Input placeholder="Or type custom name..." value={field.value} onChange={(e) => { field.onChange(e.target.value); form.setValue("customer.id", undefined); }} className="h-8 text-sm" />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="invoice_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-9 border-slate-200", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-9 border-slate-200", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP") : <span>Net 30</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                    <div className="border-t p-2 flex gap-2">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange(addDays(new Date(), 15))}>Net 15</Button>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange(addDays(new Date(), 30))}>Net 30</Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        Line Items
                                    </h4>
                                    {inventoryProducts.length > 0 && (
                                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500 font-normal">
                                            {inventoryProducts.length} saved products
                                        </Badge>
                                    )}
                                </div>
                                <div className="border rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="w-[35%] h-9 text-xs">Description</TableHead>
                                                <TableHead className="w-[10%] h-9 text-xs">Qty</TableHead>
                                                <TableHead className="w-[15%] h-9 text-xs">Price</TableHead>
                                                <TableHead className="w-[15%] h-9 text-xs">GST %</TableHead>
                                                <TableHead className="w-[20%] h-9 text-xs text-right">Amount</TableHead>
                                                <TableHead className="w-[5%] h-9"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => {
                                                const item = items[index];
                                                const lineAmount = item ? (item.quantity * item.unit_price * (1 + item.gst_rate / 100)) : 0;
                                                return (
                                                    <TableRow key={field.id} className="hover:bg-transparent">
                                                        <TableCell className="p-2 align-top">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.description`}
                                                                render={({ field }) => (
                                                                    <Popover open={openProductCombo === index} onOpenChange={(open) => setOpenProductCombo(open ? index : null)}>
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal h-9 border-slate-200 bg-slate-50/30", !field.value && "text-muted-foreground")}>
                                                                                    <span className="truncate">{field.value || "Select item"}</span>
                                                                                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                                                                </Button>
                                                                            </FormControl>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[300px] p-0" align="start">
                                                                            <Command>
                                                                                <CommandInput placeholder="Search..." className="h-9" />
                                                                                <CommandList>
                                                                                    <CommandEmpty>No products found.</CommandEmpty>
                                                                                    <CommandGroup>
                                                                                        {inventoryProducts.map((product) => (
                                                                                            <CommandItem
                                                                                                value={product.name}
                                                                                                key={product.id}
                                                                                                onSelect={() => {
                                                                                                    form.setValue(`items.${index}.product_id`, product.id);
                                                                                                    form.setValue(`items.${index}.description`, product.name);
                                                                                                    let basePrice = product.unit_price;
                                                                                                    if (product.prices_include_tax) {
                                                                                                        basePrice = product.unit_price / (1 + product.gst_rate / 100);
                                                                                                    }
                                                                                                    form.setValue(`items.${index}.unit_price`, parseFloat(basePrice.toFixed(2)));
                                                                                                    let baseCost = product.cost_price || 0;
                                                                                                    if (product.prices_include_tax && baseCost > 0) {
                                                                                                        baseCost = baseCost / (1 + product.gst_rate / 100);
                                                                                                    }
                                                                                                    form.setValue(`items.${index}.cost_price`, parseFloat(baseCost.toFixed(2)));
                                                                                                    form.setValue(`items.${index}.gst_rate`, product.gst_rate);
                                                                                                    setOpenProductCombo(null);
                                                                                                }}
                                                                                            >
                                                                                                <div className="flex flex-col flex-1">
                                                                                                    <span className="font-medium">{product.name}</span>
                                                                                                    <span className="text-xs text-muted-foreground">₹{product.unit_price}</span>
                                                                                                </div>
                                                                                            </CommandItem>
                                                                                        ))}
                                                                                    </CommandGroup>
                                                                                </CommandList>
                                                                                <div className="p-2 border-t">
                                                                                    <Input placeholder="Custom item..." value={field.value} onChange={(e) => { field.onChange(e.target.value); form.setValue(`items.${index}.product_id`, undefined); }} className="h-8 text-sm" />
                                                                                </div>
                                                                            </Command>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 align-top">
                                                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormControl><Input type="number" className="h-9 text-center" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>)} />
                                                        </TableCell>
                                                        <TableCell className="p-2 align-top">
                                                            <FormField control={form.control} name={`items.${index}.unit_price`} render={({ field }) => (<FormControl><Input type="number" step="0.01" className="h-9 text-right" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>)} />
                                                        </TableCell>
                                                        <TableCell className="p-2 align-top">
                                                            <FormField control={form.control} name={`items.${index}.gst_rate`} render={({ field }) => (<FormControl><Input type="number" className="h-9 text-center bg-slate-50/50" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>)} />
                                                        </TableCell>
                                                        <TableCell className="p-2 align-top text-right font-medium text-sm pt-3">
                                                            {formatCurrency(lineAmount)}
                                                        </TableCell>
                                                        <TableCell className="p-2 align-top text-center">
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => remove(index)} disabled={fields.length === 1}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <div className="p-2 bg-slate-50/30 border-t">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => append({ product_id: undefined, description: "", quantity: 1, unit_price: 0, cost_price: 0, gst_rate: 18 })} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <Plus className="mr-2 h-4 w-4" /> Add Item
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</Label>
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea placeholder="Payment instructions, terms..." className="resize-none h-24 bg-yellow-50/20 border-slate-200" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total GST</span>
                                        <span className="font-medium">{formatCurrency(totalGst)}</span>
                                    </div>
                                    <Separator className="bg-slate-200" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <div className="w-24">
                                            <FormField
                                                control={form.control}
                                                name="discount"
                                                render={({ field }) => (
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-right bg-white"
                                                            placeholder="0"
                                                            value={field.value}
                                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <Separator className="bg-slate-200" />
                                    <div className="flex justify-between text-lg font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>{formatCurrency(grandTotal)}</span>
                                    </div>
                                    {estimatedProfit > 0 && (
                                        <div className="text-xs text-emerald-600 text-right pt-1 font-medium">
                                            Est. Profit: +{formatCurrency(estimatedProfit)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-6 pt-4 border-t border-border/50 bg-slate-50/50">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isSubmitting}
                            onClick={form.handleSubmit(data => onSubmit(data, 'draft'))}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Draft"}
                        </Button>
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={form.handleSubmit(data => onSubmit(data, 'issued'))}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Issue Invoice"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
