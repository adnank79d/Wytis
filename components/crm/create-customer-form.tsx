"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof CustomerSchema>;

export function CreateCustomerForm({ businessId }: { businessId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            tax_id: "",
            address: "",
        },
    });

    async function onSubmit(data: CustomerFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_id: businessId,
                    ...data,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to create customer");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add Customer</h1>
                        <p className="text-sm text-muted-foreground">Add a new client to your database.</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-50 text-red-900 text-sm border border-red-200">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Customer Details</CardTitle>
                    <CardDescription>Enter the basic information for this customer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Customer Name <span className="text-red-500">*</span></Label>
                        <Input {...form.register("name")} placeholder="Company or Person Name" />
                        {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" {...form.register("email")} placeholder="billing@client.com" />
                            {form.formState.errors.email && <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input {...form.register("phone")} placeholder="+91..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tax ID (GSTIN)</Label>
                        <Input {...form.register("tax_id")} placeholder="22AAAAA0000A1Z5" />
                    </div>

                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input {...form.register("address")} placeholder="Full billing address" />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
                <Button variant="outline" type="button" asChild>
                    <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Customer
                </Button>
            </div>
        </form>
    );
}
