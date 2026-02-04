import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function SettingsTeamPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");


    // 1. Get the current user's business context (assuming single business for now)
    const { data: businessMembership } = await supabase
        .from("memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!businessMembership) redirect("/onboarding");

    // 2. Fetch all members of this specific business
    const { data: memberships } = await supabase
        .from("memberships")
        .select("*, users(email)")
        .eq("business_id", businessMembership.business_id)
        .limit(20);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Users & Roles</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage access to your business workspace.
                    </p>
                </div>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Invite User
                </Button>
            </div>
            <Separator />

            <div className="border rounded-md divide-y">
                <div className="flex items-center px-6 py-3 bg-muted/40 text-xs font-medium text-muted-foreground">
                    <div className="flex-1 px-2">User</div>
                    <div className="w-32 px-2">Role</div>
                    <div className="w-24 px-2 text-right">Status</div>
                </div>
                {memberships?.map((member: any) => (
                    <div key={member.id} className="flex items-center px-6 py-3 text-sm">
                        <div className="flex-1 px-2">
                            <div className="font-medium text-foreground">{member.users?.email}</div>
                        </div>
                        <div className="w-32 px-2 capitalize text-muted-foreground">
                            {member.role}
                        </div>
                        <div className="w-24 px-2 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                    </div>
                ))}
                {/* Empty state or "More" placeholder if needed */}
                {(!memberships || memberships.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No team members found.
                    </div>
                )}
            </div>
        </div>
    );
}
