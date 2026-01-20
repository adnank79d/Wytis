import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background/50">
            <div className="w-full space-y-6">

                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your workspace preferences.
                    </p>
                </div>

                {/* Tabs */}
                <SettingsTabs />

                {/* Content */}
                <div className="pt-4 pb-16">
                    {children}
                </div>
            </div>
        </div>
    );
}


