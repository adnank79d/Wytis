"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusiness, UpdateBusinessState } from "@/lib/actions/business";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

type Business = {
    id: string;
    name: string;
    gst_number?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
};

const initialState: UpdateBusinessState = { message: null, errors: {} };

export function GeneralSettingsForm({ business }: { business: Business }) {
    // @ts-expect-error - useActionState types
    const [state, formAction, isPending] = useActionState(updateBusiness, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.message.includes("Success")) {
                toast.success("Settings updated successfully.");
            } else {
                toast.error(state.message);
            }
        }
    }, [state.message]);

    const initials = business.name.slice(0, 2).toUpperCase();

    return (
        <form action={formAction} className="animate-in fade-in duration-500">
            <input type="hidden" name="business_id" value={business.id} />

            <Card>
                <CardContent className="p-6 md:p-8 space-y-8 divide-y">
                    {/* SECTION 1: IDENTITY */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
                        <div className="md:col-span-1 space-y-1">
                            <h3 className="font-semibold text-foreground">Public Profile</h3>
                            <p className="text-sm text-muted-foreground">
                                This will be displayed on your public invoices and client communications.
                            </p>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            {/* AVATAR + NAME */}
                            <div className="flex items-center gap-6">
                                <Avatar className="h-16 w-16 border bg-muted">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-lg font-semibold text-muted-foreground">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">Business Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={business.name}
                                        className="max-w-sm md:max-w-md"
                                        required
                                    />
                                    {state.errors?.name && (
                                        <p className="text-xs text-red-500 font-medium">{state.errors.name[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="gst_number" className="text-sm font-medium">GST Identification Number</Label>
                                <Input
                                    id="gst_number"
                                    name="gst_number"
                                    defaultValue={business.gst_number || ''}
                                    placeholder="22AAAAA0000A1Z5"
                                    className="max-w-sm font-mono"
                                />
                                <p className="text-[13px] text-muted-foreground">Appears on tax documents.</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: LOCATION */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                        <div className="md:col-span-1 space-y-1">
                            <h3 className="font-semibold text-foreground">Business Address</h3>
                            <p className="text-sm text-muted-foreground">
                                Your primary operating location for billing and legal purposes.
                            </p>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address_line1">Street Address</Label>
                                <Input
                                    id="address_line1"
                                    name="address_line1"
                                    defaultValue={business.address_line1 || ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address_line2">Apartment, Suite, etc.</Label>
                                <Input
                                    id="address_line2"
                                    name="address_line2"
                                    defaultValue={business.address_line2 || ''}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        defaultValue={business.city || ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State / Province</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        defaultValue={business.state || ''}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">ZIP / Postal Code</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        defaultValue={business.pincode || ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                                        India
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTION */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 min-w-[120px]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
