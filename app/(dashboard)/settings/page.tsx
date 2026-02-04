import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsProfileForm } from "../../../components/settings/settings-profile-form";
import { Separator } from "@/components/ui/separator";

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
    const business = membership.businesses as {
        id: string;
        name: string;
        gst_number?: string;
        currency?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
    } | null;

    if (!business) redirect("/onboarding");

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Business Profile</h2>
                <p className="text-sm text-slate-600">
                    Manage your business information and contact details.
                </p>
            </div>

            {/* Form */}
            <SettingsProfileForm business={business} userEmail={user.email} />
        </div>
    );
}
