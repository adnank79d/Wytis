import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsGSTForm } from "../../../../components/settings/settings-gst-form";
import { Separator } from "@/components/ui/separator";

export default async function SettingsGSTPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id, businesses(*)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/onboarding");

    // @ts-expect-error Supabase join types inferred as array
    const business = membership.businesses as {
        id: string;
        name: string;
        gst_number?: string;
        currency?: string;
        state?: string;
    } | null;

    if (!business) redirect("/onboarding");

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">GST & Compliance</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your tax identification and compliance settings.
                </p>
            </div>
            <Separator />
            <SettingsGSTForm business={business} />
        </div>
    );
}
