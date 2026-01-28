import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Calculator, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

import { getGSTSummary, getGSTR1Data, getGSTR2Data } from "@/lib/actions/gst";
import { GSTRTable } from "@/components/gst/gstr-table";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";

export const dynamic = 'force-dynamic';

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
    const [summary, gstr1, gstr2] = await Promise.all([
        getGSTSummary(month, year),
        getGSTR1Data(month, year),
        getGSTR2Data(month, year),
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
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">GST Compliance</h1>
                    <p className="text-muted-foreground mt-1">Manage your tax liability and input credits.</p>
                </div>
                {/* We could add month/year selector here later */}
                <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-md text-sm border">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span>Period: <strong>{monthName} {year}</strong></span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Output Tax Liability</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.outputTax)}</div>
                        <p className="text-xs text-muted-foreground mt-1">From {summary.totalSales ? formatCurrency(summary.totalSales) : '0'} Sales</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Input Tax Credit (ITC)</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.inputTax)}</div>
                        <p className="text-xs text-muted-foreground mt-1">From {summary.totalPurchases ? formatCurrency(summary.totalPurchases) : '0'} Expenses</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-l-4 shadow-sm",
                    summary.netPayable > 0 ? "border-l-amber-500 bg-amber-50/50" : "border-l-blue-500 bg-blue-50/50"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Net GST Payable</CardTitle>
                        <FileText className="h-4 w-4 text-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(Math.max(0, summary.netPayable))}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary.netPayable < 0 ? `Credit Carry Forward: ${formatCurrency(Math.abs(summary.netPayable))}` : 'To be paid to Govt'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Reports Tabs */}
            <Tabs defaultValue="gstr1" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="gstr1" className="px-8">GSTR-1 (Sales)</TabsTrigger>
                    <TabsTrigger value="gstr2" className="px-8">GSTR-2 (Purchases)</TabsTrigger>
                </TabsList>

                <TabsContent value="gstr1" className="animate-in fade-in-50">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Outward Supplies</h3>
                                <p className="text-sm text-muted-foreground">Details of all sales invoices issued.</p>
                            </div>
                        </div>
                        <GSTRTable data={gstr1} title="GSTR-1 Data" />
                    </div>
                </TabsContent>

                <TabsContent value="gstr2" className="animate-in fade-in-50">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Inward Supplies</h3>
                                <p className="text-sm text-muted-foreground">Details of all expenses with Input Tax Credit.</p>
                            </div>
                            <AddExpenseDialog />
                        </div>
                        <GSTRTable data={gstr2} title="GSTR-2 Data" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
