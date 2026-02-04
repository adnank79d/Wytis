"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusiness, UpdateBusinessState } from "@/lib/actions/business";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Business = {
    id: string;
    name: string;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
};

const initialState: UpdateBusinessState = { message: null, errors: {} };

interface SettingsProfileFormProps {
    business: Business;
    userEmail?: string;
}

export function SettingsProfileForm({ business, userEmail }: SettingsProfileFormProps) {
    // @ts-expect-error - useActionState types
    const [state, formAction, isPending] = useActionState(updateBusiness, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.message.includes("Success")) {
                toast.success("Profile updated.");
            } else {
                toast.error(state.message);
            }
        }
    }, [state.message]);

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="business_id" value={business.id} />

            {/* Business Details Section */}
            <div className="bg-white rounded-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Core information about your organization</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Business Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={business.name}
                                className="h-10"
                                required
                            />
                            {state.errors?.name && (
                                <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="legal_name" className="text-sm font-medium text-slate-700">Legal Name</Label>
                            <Input
                                id="legal_name"
                                placeholder="Same as business name"
                                disabled
                                defaultValue={business.name}
                                className="h-10 bg-slate-50 text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Contact Email</Label>
                        <Input
                            value={userEmail || ''}
                            disabled
                            className="h-10 bg-slate-50 text-slate-500 max-w-md"
                        />
                        <p className="text-xs text-slate-500">This is your primary account email</p>
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">Business Address</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Physical location information</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="address_line1" className="text-sm font-medium text-slate-700">Street Address</Label>
                        <Input
                            id="address_line1"
                            name="address_line1"
                            defaultValue={business.address_line1 || ''}
                            className="h-10"
                            placeholder="123 Main Street"
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium text-slate-700">City</Label>
                            <Input
                                id="city"
                                name="city"
                                defaultValue={business.city || ''}
                                className="h-10"
                                placeholder="Mumbai"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium text-slate-700">State</Label>
                            <Input
                                id="state"
                                name="state"
                                defaultValue={business.state || ''}
                                className="h-10"
                                placeholder="MH"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pincode" className="text-sm font-medium text-slate-700">Pincode</Label>
                            <Input
                                id="pincode"
                                name="pincode"
                                defaultValue={business.pincode || ''}
                                className="h-10"
                                placeholder="400001"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 px-6"
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
