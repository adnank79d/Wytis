import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPreferencesPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Preferences</h3>
                <p className="text-sm text-muted-foreground">
                    Customize your regional settings and notification alerts.
                </p>
            </div>
            <Separator />

            {/* Regional Settings */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Regional Settings</h4>
                <div className="grid gap-4 max-w-sm">
                    <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select defaultValue="dd/MM/yyyy">
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dd/MM/yyyy">dd/MM/yyyy (31/01/2026)</SelectItem>
                                <SelectItem value="MM/dd/yyyy">MM/dd/yyyy (01/31/2026)</SelectItem>
                                <SelectItem value="yyyy-MM-dd">yyyy-MM-dd (2026-01-31)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select defaultValue="inr" disabled>
                            <SelectTrigger className="bg-muted text-muted-foreground">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[13px] text-muted-foreground">Currency is locked to your business registration region.</p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Notifications</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Email Alerts</Label>
                            <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">In-App Notifications</Label>
                            <p className="text-sm text-muted-foreground">Show badges and popups within the dashboard.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Marketing & Updates</Label>
                            <p className="text-sm text-muted-foreground">Receive news about new features and improvements.</p>
                        </div>
                        <Switch />
                    </div>
                </div>
            </div>

            <Alert className="bg-indigo-50 border-indigo-100 text-indigo-900 mt-6">
                <AlertCircle className="h-4 w-4 stroke-indigo-600" />
                <AlertDescription className="text-xs">
                    System preferences are applied immediately across your workspace.
                </AlertDescription>
            </Alert>
        </div>
    );
}
