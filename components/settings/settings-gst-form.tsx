"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusiness, UpdateBusinessState } from "@/lib/actions/business";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Business = {
    id: string;
    gst_number?: string | null;
    state?: string | null;
};

const initialState: UpdateBusinessState = { message: null, errors: {} };

export function SettingsGSTForm({ business }: { business: Business }) {
    // @ts-expect-error - useActionState types
    const [state, formAction, isPending] = useActionState(updateBusiness, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.message.includes("Success")) {
                toast.success("Compliance settings updated.");
            } else {
                toast.error(state.message);
            }
        }
    }, [state.message]);

    return (
        <form action={formAction} className="space-y-8 max-w-2xl">
            <input type="hidden" name="business_id" value={business.id} />

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="gst_number">GST Identification Number (GSTIN)</Label>
                    <div className="flex gap-4 items-center">
                        <Input
                            id="gst_number"
                            name="gst_number"
                            defaultValue={business.gst_number || ''}
                            className="max-w-md font-mono uppercase"
                            placeholder="22AAAAA0000A1Z5"
                        />
                        {business.gst_number && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                Active
                            </Badge>
                        )}
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                        Required for tax invoices.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">Registered State</Label>
                    <Input
                        id="state"
                        name="state"
                        defaultValue={business.state || ''}
                        className="max-w-md"
                    />
                    <p className="text-[13px] text-muted-foreground">
                        The state where your business is registered for GST.
                    </p>
                </div>

                <div className="space-y-2 pt-2">
                    <Label>Compliance Status</Label>
                    <div className="max-w-md rounded-md border p-6 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Pan Application</span>
                            <Badge variant="secondary">Linked</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex pt-4">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Compliance Settings
                </Button>
            </div>
        </form>
    );
}
