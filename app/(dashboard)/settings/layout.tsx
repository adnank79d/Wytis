import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background/50">
            <div className="max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6">
                {/* Header */}
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Manage your workspace and preferences.
                    </p>
                </div>

                {/* Tabs */}
                <SettingsTabs />

                {/* Content */}
                <div className="pt-2 pb-16">
                    {children}
                </div>
            </div>
        </div>
    );
}
