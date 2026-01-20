import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldCheck, User } from "lucide-react";
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
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/onboarding");

    const { data: members } = await supabase
        .from("memberships")
        .select("*, users(email)")
        .eq("business_id", membership.business_id);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">Team Members</h3>
                    <p className="text-muted-foreground">
                        Manage who has access to your business workspace.
                    </p>
                </div>
                <InviteMemberDialog />
            </div>

            <Card className="border-muted/60 shadow-sm overflow-hidden">
                <div className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[300px]">User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members?.map((member) => (
                                <TableRow key={member.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-border">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary uppercase font-bold">
                                                    {(member.users as any)?.email?.[0] || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{(member.users as any)?.email}</span>
                                                <span className="text-xs text-muted-foreground">{(member.users as any)?.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`capitalize font-medium shadow-none ${member.role === 'owner'
                                                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                                }`}
                                        >
                                            {member.role === 'owner' && <ShieldCheck className="w-3 h-3 mr-1" />}
                                            {member.role !== 'owner' && <User className="w-3 h-3 mr-1" />}
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                {member.role !== 'owner' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600">Remove User</DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Empty State / Help Text */}
            {members?.length === 1 && (
                <div className="rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No other team members</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by inviting a new team member.</p>
                </div>
            )}
        </div>
    );
}
