import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFinancialReports } from "@/lib/actions/reports";
import { ReportsView } from "@/components/reports/reports-view";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const reportData = await getFinancialReports();

    if (!reportData) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4">
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                        <h2 className="text-xl font-semibold mb-2">No Report Data Available</h2>
                        <p className="max-w-md mx-auto">
                            We couldn't access your financial records. Please ensure your business profile is set up correctly.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <ReportsView data={reportData} />;
}
