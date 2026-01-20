"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBusiness, UpdateBusinessState } from "@/lib/actions/business";
import { Loader2, Upload, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { FieldGroup, FieldRow } from "@/components/settings/field-row";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


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
    // @ts-expect-error - useActionState types might be in flux in RC/Beta versions
    const [state, formAction, isPending] = useActionState(updateBusiness, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.message.includes("Success")) {
                toast.success("Settings updated.");
            } else {
                toast.error(state.message);
            }
        }
    }, [state.message]);

    return (
        <form action={formAction} className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <input type="hidden" name="business_id" value={business.id} />

            {/* Identity Group */}
            <FieldGroup title="Identity">
                {/* Logo Row */}
                <FieldRow label="Workspace Icon" description="Used on invoices and sidebar.">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border/50 rounded-lg">
                            <AvatarImage src="" />
                            <AvatarFallback className="rounded-lg bg-orange-100 text-orange-700 font-bold">
                                <Building2 className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm" type="button" className="h-8 text-xs bg-transparent border-dashed text-muted-foreground hover:text-foreground" disabled>
                            Upload
                        </Button>
                    </div>
                </FieldRow>

                {/* Name Row */}
                <FieldRow label="Workspace Name">
                    <Input
                        name="name"
                        defaultValue={business.name}
                        className="h-8 w-[240px] text-right border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 transition-colors rounded-sm px-2 font-medium"
                        placeholder="Enter name..."
                    />
                </FieldRow>
            </FieldGroup>


            {/* Billing Group */}
            <FieldGroup title="Billing Information">
                {/* Tax ID */}
                <FieldRow label="GST / VAT Number">
                    <Input
                        name="gst_number"
                        defaultValue={business.gst_number || ''}
                        className="h-8 w-[240px] text-right border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 transition-colors rounded-sm px-2 font-mono text-sm"
                        placeholder="Optional"
                    />
                </FieldRow>

                {/* Address */}
                <FieldRow label="Address Line 1">
                    <Input
                        name="address_line1"
                        defaultValue={business.address_line1 || ''}
                        className="h-8 w-[300px] text-right border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 transition-colors rounded-sm px-2"
                        placeholder="Street address..."
                    />
                </FieldRow>

                <FieldRow label="Address Line 2">
                    <Input
                        name="address_line2"
                        defaultValue={business.address_line2 || ''}
                        className="h-8 w-[300px] text-right border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 transition-colors rounded-sm px-2"
                        placeholder="Apt, Suite..."
                    />
                </FieldRow>

                <div className="grid grid-cols-2 divide-x divide-border/40 border-t border-border/40">
                    <div className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</span>
                        <Input
                            name="city"
                            defaultValue={business.city || ''}
                            className="h-7 px-0 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium"
                            placeholder="New Delhi"
                        />
                    </div>
                    <div className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">State / Region</span>
                        <Input
                            name="state"
                            defaultValue={business.state || ''}
                            className="h-7 px-0 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium"
                            placeholder="Delhi"
                        />
                    </div>
                </div>
                {/* Pincode Row (Full Width Bottom) */}
                <div className="p-4 flex items-center justify-between border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <span className="text-sm font-medium">Postal Code</span>
                    <Input
                        name="pincode"
                        defaultValue={business.pincode || ''}
                        className="h-8 w-[120px] text-right border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 px-2"
                        placeholder="110001"
                    />
                </div>
            </FieldGroup>

            {/* Save Area */}
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
