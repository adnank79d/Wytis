"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, ChevronsUpDown, Check, Trash2, Plus, Package } from "lucide-react";
import { format, addDays } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createInvoice } from "@/lib/actions/invoices";

// Production-Ready Schema with cost_price, due_date, notes
const formSchema = z.object({
    customer: z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Customer name is required"),
    }),
    invoice_date: z.date(),
    due_date: z.date().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Qty > 0"),
        unit_price: z.number().min(0, "Price >= 0"),
        cost_price: z.coerce.number().min(0),
        gst_rate: z.number().min(0, "GST >= 0"),
    })).min(1, "At least one item is required"),
});

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
};

interface NewInvoiceFormProps {
    existingCustomers: Customer[];
    inventoryProducts?: InventoryProduct[];
}

export function NewInvoiceForm({ existingCustomers, inventoryProducts = [] }: NewInvoiceFormProps) {
    const router = useRouter();
    const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openProductCombo, setOpenProductCombo] = useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customer: { name: "", id: undefined },
            invoice_date: new Date(),
            due_date: addDays(new Date(), 30), // Default: Net 30
            notes: "",
            items: [{ product_id: undefined, description: "", quantity: 1, unit_price: 0, cost_price: 0, gst_rate: 18 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    });

    // Calculations
    const items = form.watch("items");
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalGst = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.gst_rate / 100)), 0);
    const grandTotal = subtotal + totalGst;
    const totalCost = items.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0);
    const estimatedProfit = subtotal - totalCost;

    async function onSubmit(values: z.infer<typeof formSchema>, status: 'draft' | 'issued') {
        setIsSubmitting(true);
        const formData = new FormData();

        if (values.customer.id) formData.append("customer_id", values.customer.id);
        formData.append("customer_name", values.customer.name);
        formData.append("invoice_date", values.invoice_date.toISOString());
        if (values.due_date) formData.append("due_date", values.due_date.toISOString());
        if (values.notes) formData.append("notes", values.notes);
        formData.append("status", status);
        formData.append("items", JSON.stringify(values.items));

        const result = await createInvoice({} as any, formData);

        if (result?.message) {
            alert(result.message);
            setIsSubmitting(false);
        }
        // Success redirect is handled in server action
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    };

    return (
        <Form {...form}>
            <form className="space-y-6">
                {/* CUSTOMER & DATES SECTION */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* CUSTOMER SELECTION */}
                            <FormField
                                control={form.control}
                                name="customer.name"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Customer *</FormLabel>
                                        <Popover open={openCustomerCombo} onOpenChange={setOpenCustomerCombo}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value || "Select or enter customer"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search customer..." className="h-9" />
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
                                                                        {customer.email && (
                                                                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                                                                        )}
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto h-4 w-4",
                                                                            customer.name === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                                <div className="p-2 border-t">
                                                    <Input
                                                        placeholder="Or type manually..."
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value);
                                                            form.setValue("customer.id", undefined);
                                                        }}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* INVOICE DATE */}
                            <FormField
                                control={form.control}
                                name="invoice_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Invoice Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* DUE DATE */}
                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>No due date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                                {/* Quick select buttons */}
                                                <div className="border-t p-2 flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => field.onChange(addDays(new Date(), 15))}
                                                    >
                                                        Net 15
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => field.onChange(addDays(new Date(), 30))}
                                                    >
                                                        Net 30
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => field.onChange(addDays(new Date(), 60))}
                                                    >
                                                        Net 60
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>Payment terms</FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* LINE ITEMS */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Line Items</CardTitle>
                            {inventoryProducts.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    <Package className="w-3 h-3 mr-1" />
                                    {inventoryProducts.length} products available
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[30%]">Description</TableHead>
                                        <TableHead className="w-[10%]">Qty</TableHead>
                                        <TableHead className="w-[15%]">Unit Price</TableHead>
                                        <TableHead className="w-[15%]">Cost Price</TableHead>
                                        <TableHead className="w-[10%]">GST %</TableHead>
                                        <TableHead className="w-[15%] text-right">Amount</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => {
                                        const item = items[index];
                                        const lineAmount = item ? (item.quantity * item.unit_price * (1 + item.gst_rate / 100)) : 0;
                                        const lineProfit = item ? (item.quantity * (item.unit_price - (item.cost_price || 0))) : 0;

                                        return (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.description`}
                                                        render={({ field }) => (
                                                            <Popover
                                                                open={openProductCombo === index}
                                                                onOpenChange={(open) => setOpenProductCombo(open ? index : null)}
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className={cn(
                                                                                "w-full justify-between font-normal h-9",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            <span className="truncate">{field.value || "Select product"}</span>
                                                                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[320px] p-0">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search products..." className="h-9" />
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
                                                                                            form.setValue(`items.${index}.unit_price`, product.unit_price);
                                                                                            form.setValue(`items.${index}.cost_price`, product.cost_price || 0);
                                                                                            form.setValue(`items.${index}.gst_rate`, product.gst_rate);
                                                                                            setOpenProductCombo(null);
                                                                                        }}
                                                                                    >
                                                                                        <div className="flex flex-col flex-1">
                                                                                            <span className="font-medium">{product.name}</span>
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                ₹{product.unit_price} | Cost: ₹{product.cost_price || 0} | GST: {product.gst_rate}% | Stock: {product.quantity}
                                                                                            </span>
                                                                                        </div>
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "ml-auto h-4 w-4",
                                                                                                product.name === field.value ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                    <div className="p-2 border-t">
                                                                        <Input
                                                                            placeholder="Or type custom item..."
                                                                            value={field.value}
                                                                            onChange={(e) => {
                                                                                field.onChange(e.target.value);
                                                                                form.setValue(`items.${index}.product_id`, undefined);
                                                                            }}
                                                                            className="h-8 text-sm"
                                                                        />
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.quantity`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.unit_price`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.cost_price`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9 bg-muted/50"
                                                                    placeholder="0"
                                                                    {...field}
                                                                    value={field.value || ''}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.gst_rate`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(lineAmount)}
                                                    {item?.cost_price > 0 && (
                                                        <div className={cn(
                                                            "text-xs",
                                                            lineProfit >= 0 ? "text-emerald-600" : "text-red-600"
                                                        )}>
                                                            {lineProfit >= 0 ? '+' : ''}{formatCurrency(lineProfit)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ product_id: undefined, description: "", quantity: 1, unit_price: 0, cost_price: 0, gst_rate: 18 })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* NOTES & SUMMARY */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* NOTES */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any notes or payment instructions..."
                                                className="min-h-[100px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This will appear on the invoice
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* SUMMARY */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GST Total</span>
                                <span>{formatCurrency(totalGst)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                            {totalCost > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Cost</span>
                                        <span>{formatCurrency(totalCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-muted-foreground">Est. Profit</span>
                                        <span className={cn(estimatedProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                                            {formatCurrency(estimatedProfit)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isSubmitting}
                        onClick={form.handleSubmit(data => onSubmit(data, 'draft'))}
                    >
                        {isSubmitting ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={form.handleSubmit(data => onSubmit(data, 'issued'))}
                    >
                        {isSubmitting ? "Creating..." : "Issue Invoice"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
