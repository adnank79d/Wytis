"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { addCustomer, CustomerFormState } from "@/lib/actions/customers";

export function AddCustomerForm() {
    const initialState: CustomerFormState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(addCustomer, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {state.message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
                    {state.message}
                </div>
            )}

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Customer Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g., Acme Corporation"
                            required
                            className="h-11 bg-background border-border/60 rounded-lg"
                        />
                        {state.errors?.name && (
                            <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="customer@example.com"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                            {state.errors?.email && (
                                <p className="text-xs text-red-500">{state.errors.email[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* GST Number */}
                    <div className="space-y-2">
                        <Label htmlFor="gst_number" className="text-sm font-medium">GST Number</Label>
                        <Input
                            id="gst_number"
                            name="gst_number"
                            placeholder="22AAAAA0000A1Z5"
                            className="h-11 bg-background border-border/60 rounded-lg font-mono"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                        <Textarea
                            id="address"
                            name="address"
                            placeholder="Full billing address"
                            rows={3}
                            className="bg-background border-border/60 rounded-lg resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Internal notes about this customer..."
                        rows={3}
                        className="bg-background border-border/60 rounded-lg resize-none"
                    />
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" asChild className="rounded-lg">
                    <Link href="/customers">Cancel</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg px-6 bg-gradient-to-r from-primary to-primary/90"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Customer
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
