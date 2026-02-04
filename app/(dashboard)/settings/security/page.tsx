import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsSecurityPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account security and authentication methods.
                </p>
            </div>
            <Separator />

            {/* Password Change */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground">Update the password associated with your account.</p>
                </div>
                <Separator />
                <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <Input id="current_password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input id="new_password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input id="confirm_password" type="password" />
                    </div>
                </div>
                <div className="pt-2">
                    <Button variant="outline">Update Password</Button>
                </div>
            </div>

            <Separator />

            {/* Sessions */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">Active Sessions</h4>
                    <p className="text-xs text-muted-foreground">Manage devices logged into your account.</p>
                </div>
                <Separator />
                <div className="border rounded-md divide-y">
                    <div className="p-6 flex items-center justify-between text-sm">
                        <div>
                            <div className="font-medium">Windows PC - Chrome</div>
                            <div className="text-muted-foreground text-xs mt-0.5">Mumbai, India • Current Session</div>
                        </div>
                        <div className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Active</div>
                    </div>
                    {/* Placeholder for other sessions */}
                </div>
                <p className="text-xs text-muted-foreground">
                    Don't recognize a device? <span className="underline cursor-pointer hover:text-foreground">Log out of all devices.</span>
                </p>
            </div>
        </div>
    );
}
