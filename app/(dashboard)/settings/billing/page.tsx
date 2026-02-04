import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { getStorageUsage } from "@/lib/actions/storage";

export default async function SettingsBillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Get current business context
    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/onboarding");

    // 2. Fetch Usage Stats
    // Team Members Count
    const { count: membersCount } = await supabase
        .from("memberships")
        .select("*", { count: 'exact', head: true })
        .eq("business_id", membership.business_id);

    // Invoices Count
    const { count: invoicesCount } = await supabase
        .from("invoices")
        .select("*", { count: 'exact', head: true })
        .eq("business_id", membership.business_id);

    // Storage Usage
    const { formatted: storageUsed } = await getStorageUsage(membership.business_id);

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Billing & Plan</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription and payment methods.
                </p>
            </div>
            <Separator />

            {/* Plan Summary */}
            <div className="bg-muted/30 border rounded-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                        <h4 className="text-xl font-semibold text-foreground">Pro Plan</h4>
                    </div>
                    <Badge className="bg-foreground text-background hover:bg-foreground/90">Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                    <p>Billed annually. Next invoice: <span className="text-foreground font-medium">Jan 28, 2027</span></p>
                </div>
                <div className="pt-2">
                    <Button variant="outline" size="sm">Manage Subscription</Button>
                </div>
            </div>

            {/* Usage Summary (Text Only) */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Usage Summary</h4>
                <div className="grid gap-4 border-t py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Team Members</span>
                        <div className="text-right">
                            <span className="font-medium text-foreground">{membersCount || 0}</span> / 10
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Invoices Generated</span>
                        <div className="text-right">
                            <span className="font-medium text-foreground">{invoicesCount || 0}</span> / Unlimited
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Storage</span>
                        <div className="text-right">
                            <span className="font-medium text-foreground">{storageUsed}</span> / 10 GB
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 flex gap-3 text-sm text-indigo-900">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                    <span className="font-medium">Enterprise compliance enabled.</span>
                    <p className="text-indigo-800/80 mt-0.5">Your plan includes audit logs and advanced role-based access control.</p>
                </div>
            </div>
        </div>
    );
}
