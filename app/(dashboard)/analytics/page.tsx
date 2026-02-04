import { getAnalyticsOverview } from "@/lib/actions/analytics";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const data = await getAnalyticsOverview();

    if (!data) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Unable to load analytics data.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Analytics</h1>
                <p className="text-sm text-slate-500 font-medium">
                    Insights into your business performance, growth, and expenses.
                </p>
            </div>

            <AnalyticsDashboard data={data} />
        </div>
    );
}
