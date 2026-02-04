import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight, Calculator, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

import { getGSTSummary, getGSTR1Data, getGSTR2Data, getGSTR3BData } from "@/lib/actions/gst";
import { GSTRTable } from "@/components/gst/gstr-table";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { GSTR3BView } from "@/components/gst/gstr-3b-view";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" }
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500/90">{title}</span>
                {Icon && (<div className={cn("p-1.5 rounded-md transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}
            </div>
            <div className="space-y-1">
                <div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div>
                {subtext && (<span className="text-xs text-slate-500 font-medium">{subtext}</span>)}
            </div>
        </div>
    );
}

export default async function GSTPage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const today = new Date();
    const month = searchParams.month ? parseInt(searchParams.month as string) : today.getMonth() + 1;
    const year = searchParams.year ? parseInt(searchParams.year as string) : today.getFullYear();

    // Fetch Data
    const [summary, gstr1, gstr2, gstr3b] = await Promise.all([
        getGSTSummary(month, year),
        getGSTR1Data(month, year),
        getGSTR2Data(month, year),
        getGSTR3BData(month, year),
    ]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        GST <span className="text-slate-900">Compliance</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Manage your tax liability and input credits.
                    </p>
                </div>
                {/* We could add month/year selector here later */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                    <Calculator className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">Period: <strong className="font-semibold text-slate-900">{monthName} {year}</strong></span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpICard
                    title="Output Tax Liability"
                    value={formatCurrency(summary.outputTax)}
                    subtext={`From ${summary.totalSales ? formatCurrency(summary.totalSales) : '0'} Sales`}
                    icon={ArrowUpRight}
                    color="rose"
                />
                <KpICard
                    title="Input Tax Credit (ITC)"
                    value={formatCurrency(summary.inputTax)}
                    subtext={`From ${summary.totalPurchases ? formatCurrency(summary.totalPurchases) : '0'} Expenses`}
                    icon={ArrowDownRight}
                    color="emerald"
                />
                <KpICard
                    title="Net GST Payable"
                    value={formatCurrency(Math.max(0, summary.netPayable))}
                    subtext={summary.netPayable < 0 ? `Credit Carry Forward: ${formatCurrency(Math.abs(summary.netPayable))}` : 'To be paid to Govt'}
                    icon={FileText}
                    color={summary.netPayable > 0 ? "amber" : "blue"}
                />
            </div>

            {/* Reports Tabs */}
            <Tabs defaultValue="gstr3b" className="space-y-6">
                <TabsList className="bg-slate-100/80 p-1 border border-slate-200/50 rounded-lg h-auto inline-flex">
                    <TabsTrigger value="gstr3b" className="rounded-md px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                        GSTR-3B
                    </TabsTrigger>
                    <TabsTrigger value="gstr1" className="rounded-md px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                        GSTR-1 (Sales)
                    </TabsTrigger>
                    <TabsTrigger value="gstr2" className="rounded-md px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                        GSTR-2 (Purchases)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="gstr3b" className="animate-in fade-in-50 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">GSTR-3B Summary</h3>
                            <p className="text-sm text-slate-500">Auto-filled based on your sales and expenses.</p>
                        </div>
                    </div>
                    <GSTR3BView data={gstr3b} />
                </TabsContent>

                <TabsContent value="gstr1" className="animate-in fade-in-50 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Outward Supplies</h3>
                            <p className="text-sm text-slate-500">Details of all sales invoices issued.</p>
                        </div>
                    </div>
                    <GSTRTable data={gstr1} title="GSTR-1 Data" />
                </TabsContent>

                <TabsContent value="gstr2" className="animate-in fade-in-50 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Inward Supplies</h3>
                            <p className="text-sm text-slate-500">Details of all expenses with Input Tax Credit.</p>
                        </div>
                        <AddExpenseDialog />
                    </div>
                    <GSTRTable data={gstr2} title="GSTR-2 Data" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
