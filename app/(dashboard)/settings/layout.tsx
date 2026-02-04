import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row">

                    {/* SIDEBAR NAVIGATION */}
                    <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
                        <div className="sticky top-0 lg:h-screen overflow-y-auto">
                            {/* Header */}
                            <div className="px-6 py-8 border-b border-slate-100 lg:border-b-0">
                                <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Settings</h1>
                                <p className="text-xs text-slate-500 mt-1">Manage your workspace</p>
                            </div>

                            {/* Navigation */}
                            <div className="px-4 py-6">
                                <SettingsNav />
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
