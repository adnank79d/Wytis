import { Construction } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
                <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">This module is coming soon.</p>
            </div>
        </div>
    );
}
