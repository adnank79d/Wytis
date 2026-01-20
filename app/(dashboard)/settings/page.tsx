import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export default async function SettingsPage() {
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
    const business = membership.businesses as { id: string; name: string; gst_number?: string; currency?: string } | null;

    if (!business) redirect("/onboarding");

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">General</h3>
                <p className="text-sm text-muted-foreground">
                    Update the general profile of your business.
                </p>
            </div>
            <GeneralSettingsForm business={business} />
        </div>
    );
}
