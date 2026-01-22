import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    User,
    Calculator,
    MoreHorizontal,
    Users,
    UserPlus,
    Mail
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function TeamSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/onboarding");

    const isOwner = membership.role === 'owner';

    const { data: members } = await supabase
        .from("memberships")
        .select("*, users(email)")
        .eq("business_id", membership.business_id);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <ShieldCheck className="h-3 w-3" />;
            case 'accountant': return <Calculator className="h-3 w-3" />;
            default: return <User className="h-3 w-3" />;
        }
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'owner':
                return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400";
            case 'accountant':
                return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div className="space-y-0.5">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Team Members
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Manage who has access to your workspace.
                    </p>
                </div>
                {isOwner && <InviteMemberDialog />}
            </div>

            {/* Members List */}
            <div className="space-y-2 md:space-y-3">
                {members?.map((member) => {
                    const email = (member.users as any)?.email || 'Unknown';
                    const initial = email.charAt(0).toUpperCase();

                    return (
                        <Card
                            key={member.id}
                            className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <CardContent className="p-3 md:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-border/50">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm md:text-base">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-sm md:text-base text-foreground truncate">
                                                    {email}
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className={`capitalize text-[10px] md:text-xs font-medium shrink-0 ${getRoleBadgeStyle(member.role)}`}
                                                >
                                                    {getRoleIcon(member.role)}
                                                    <span className="ml-1">{member.role}</span>
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                Joined {new Date(member.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {isOwner && member.role !== 'owner' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                    Remove Member
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {(!members || members.length <= 1) && (
                <Card className="rounded-xl md:rounded-2xl border-2 border-dashed border-border/40">
                    <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <UserPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm md:text-base font-semibold">No other team members</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-xs">
                            Invite team members to collaborate on your workspace.
                        </p>
                        {isOwner && (
                            <div className="mt-4">
                                <InviteMemberDialog />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
