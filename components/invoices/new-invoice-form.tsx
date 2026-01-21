"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, ChevronsUpDown, Check, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

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
import { Card, CardContent } from "@/components/ui/card";
import { createInvoice } from "@/lib/actions/invoices";

// Schema Validation matching Server Action
const formSchema = z.object({
    customer: z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Customer name is required"),
    }),
    invoice_date: z.date(),
    items: z.array(z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Qty > 0"),
        unit_price: z.number().min(0, "Price >= 0"),
        gst_rate: z.number().min(0, "GST >= 0"),
    })).min(1, "At least one item is required"),
});

type Customer = {
    id: string;
    name: string;
    tax_id?: string | null;
};

type InventoryProduct = {
    id: string;
    name: string;
    sku: string | null;
    unit_price: number;
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
            items: [{ description: "", quantity: 1, unit_price: 0, gst_rate: 18 }],
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

    async function onSubmit(values: z.infer<typeof formSchema>, status: 'draft' | 'issued') {
        setIsSubmitting(true);
        const formData = new FormData();

        if (values.customer.id) formData.append("customer_id", values.customer.id);
        formData.append("customer_name", values.customer.name);
        formData.append("invoice_date", values.invoice_date.toISOString());
        formData.append("status", status);
        formData.append("items", JSON.stringify(values.items));

        // Call Server Action directly (no useFormState for now to keep it simple with complex nested data)
        const result = await createInvoice({} as any, formData);

        if (result?.message) {
            // Handle error toast here ideally
            alert(result.message);
            setIsSubmitting(false);
        } else {
            // Success redirect is handled in server action
        }
    }

    return (
        <Form {...form}>
            <form className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* CUSTOMER SELECTION */}
                    <FormField
                        control={form.control}
                        name="customer.name"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Customer</FormLabel>
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
                                                <CommandEmpty>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start text-sm"
                                                        onClick={() => {
                                                            // Allow custom entering
                                                            // We assume the user types in the input which acts as filter?
                                                            // Actually CommandInput is filter only. 
                                                            // Let's rely on selecting "Create new" logic or just generic input.
                                                            // Simplification: Standard shadcn combo
                                                        }}
                                                    >
                                                        No customer found.
                                                    </Button>
                                                </CommandEmpty>
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
                                                            {customer.name}
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
                                        {/* Fallback Input for manual name */}
                                        <div className="p-2 border-t">
                                            <Input
                                                placeholder="Or type manual name..."
                                                value={field.value}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                    form.setValue("customer.id", undefined); // Clear ID if manual typing
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
                                <FormLabel>Invoice Date</FormLabel>
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
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* LINE ITEMS */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Description</TableHead>
                                    <TableHead className="w-[15%]">Qty</TableHead>
                                    <TableHead className="w-[20%]">Price</TableHead>
                                    <TableHead className="w-[15%]">GST %</TableHead>
                                    <TableHead className="w-[10%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
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
                                                                        "w-full justify-between font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value || "Select product"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0">
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
                                                                                    form.setValue(`items.${index}.description`, product.name);
                                                                                    form.setValue(`items.${index}.unit_price`, product.unit_price);
                                                                                    form.setValue(`items.${index}.gst_rate`, product.gst_rate);
                                                                                    setOpenProductCombo(null);
                                                                                }}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <span>{product.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        ₹{product.unit_price} | GST: {product.gst_rate}%
                                                                                    </span>
                                                                                </div>
                                                                                <Check
                                                                                    className={cn(
                                                                                        "ml-auto h-4 w-4",
                                                                                        product.name === field.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                            {/* Manual input fallback */}
                                                            <div className="p-2 border-t">
                                                                <Input
                                                                    placeholder="Or type custom item..."
                                                                    value={field.value}
                                                                    onChange={(e) => field.onChange(e.target.value)}
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
                                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                                    </FormControl>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ description: "", quantity: 1, unit_price: 0, gst_rate: 18 })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>


                {/* SUMMARY */}
                <div className="flex justify-end">
                    <div className="w-[300px] space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST Total</span>
                            <span>{totalGst.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>{grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                    </div>
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
                        Save as Draft
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={form.handleSubmit(data => onSubmit(data, 'issued'))}
                    >
                        Issue Invoice
                    </Button>
                </div>
            </form>
        </Form>
    );
}
