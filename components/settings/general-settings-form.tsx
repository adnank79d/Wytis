"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBusiness, UpdateBusinessState } from "@/lib/actions/business";
import { Loader2, Building2, Save } from "lucide-react";
import { toast } from "sonner";

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
    // @ts-expect-error - useActionState types might be in flux
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

    return (
        <form action={formAction} className="space-y-4 md:space-y-6">
            <input type="hidden" name="business_id" value={business.id} />

            {/* Business Identity */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Business Identity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Business Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={business.name}
                            className="h-10 md:h-11 bg-background border-border/60 rounded-lg"
                            placeholder="Your business name"
                            required
                        />
                        {state.errors?.name && (
                            <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gst_number" className="text-sm font-medium">GST Number</Label>
                        <Input
                            id="gst_number"
                            name="gst_number"
                            defaultValue={business.gst_number || ''}
                            className="h-10 md:h-11 bg-background border-border/60 rounded-lg font-mono"
                            placeholder="22AAAAA0000A1Z5"
                        />
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                            This will appear on your invoices.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Address */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-semibold">
                        Business Address
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address_line1" className="text-sm font-medium">Address Line 1</Label>
                        <Input
                            id="address_line1"
                            name="address_line1"
                            defaultValue={business.address_line1 || ''}
                            className="h-10 md:h-11 bg-background border-border/60 rounded-lg"
                            placeholder="Street address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address_line2" className="text-sm font-medium">Address Line 2</Label>
                        <Input
                            id="address_line2"
                            name="address_line2"
                            defaultValue={business.address_line2 || ''}
                            className="h-10 md:h-11 bg-background border-border/60 rounded-lg"
                            placeholder="Apartment, suite, building..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium">City</Label>
                            <Input
                                id="city"
                                name="city"
                                defaultValue={business.city || ''}
                                className="h-10 md:h-11 bg-background border-border/60 rounded-lg"
                                placeholder="Mumbai"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium">State</Label>
                            <Input
                                id="state"
                                name="state"
                                defaultValue={business.state || ''}
                                className="h-10 md:h-11 bg-background border-border/60 rounded-lg"
                                placeholder="Maharashtra"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-medium">Postal Code</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            defaultValue={business.pincode || ''}
                            className="h-10 md:h-11 w-full md:w-1/2 bg-background border-border/60 rounded-lg"
                            placeholder="400001"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
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
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
