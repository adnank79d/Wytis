import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Info, CheckCircle2, AlertCircle } from "lucide-react";

export default async function GSTSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id, businesses(gst_number, name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/onboarding");

    const business = membership.businesses as unknown as { gst_number: string | null, name: string };
    const hasGST = !!business?.gst_number;

    // GST rate configurations
    const gstRates = [
        { rate: 0, description: "Exempt items like fresh food, healthcare" },
        { rate: 5, description: "Essential items, transport" },
        { rate: 12, description: "Processed foods, computers" },
        { rate: 18, description: "Most services, electronics" },
        { rate: 28, description: "Luxury goods, automobiles" },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="space-y-0.5">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    GST Configuration
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                    View and manage your GST settings for invoicing.
                </p>
            </div>

            {/* GST Status Card */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-semibold">
                        Registration Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${hasGST
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : "bg-amber-50 dark:bg-amber-950/30"
                            }`}>
                            {hasGST ? (
                                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm md:text-base">
                                    {hasGST ? "GST Registered" : "Not Registered"}
                                </p>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] md:text-xs ${hasGST
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {hasGST ? "Active" : "Optional"}
                                </Badge>
                            </div>
                            {hasGST ? (
                                <p className="text-sm md:text-base font-mono mt-1 text-muted-foreground">
                                    {business.gst_number}
                                </p>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    Add your GST number in General settings to enable GST on invoices.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* GST Rates Reference */}
            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-semibold">
                        Standard GST Rates
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                        {gstRates.map((item) => (
                            <div
                                key={item.rate}
                                className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="text-sm md:text-base font-medium">{item.rate}% GST</p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono shrink-0">
                                    {item.rate}%
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="rounded-xl md:rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50">
                <CardContent className="p-4 md:p-5">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                About GST in India
                            </p>
                            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mt-1">
                                GST rates are applied based on the HSN/SAC code of products and services.
                                You can set the GST rate for each product in your inventory or while creating invoices.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
