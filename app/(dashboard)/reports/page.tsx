import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Helper for currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) redirect("/");

    // Fetch Data
    const [pnl, gst, receivables] = await Promise.all([
        supabase.from('profit_and_loss_view').select('*').eq('business_id', membership.business_id),
        supabase.from('gst_summary_view').select('*').eq('business_id', membership.business_id),
        supabase.from('customer_receivables_view').select('*').eq('business_id', membership.business_id)
    ]);

    // PREPARE DATA
    const income = pnl.data?.filter(r => r.category === 'Income') || [];
    const expenses = pnl.data?.filter(r => r.category === 'Expense') || [];
    const totalIncome = income.reduce((sum, r) => sum + Number(r.net_amount), 0);
    const totalExpense = expenses.reduce((sum, r) => sum + Number(r.net_amount), 0);
    const netProfit = totalIncome - totalExpense;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-muted-foreground">Read-only financial records for your business.</p>
            </div>

            <Tabs defaultValue="pnl" className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-[250px] shrink-0">
                    <TabsList className="flex flex-col h-auto w-full justify-start items-start gap-2 bg-transparent p-0 text-foreground">
                        <TabsTrigger
                            value="pnl"
                            className="w-full justify-start px-4 py-3 data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 text-muted-foreground transition-all"
                        >
                            Profit & Loss
                        </TabsTrigger>
                        <TabsTrigger
                            value="gst"
                            className="w-full justify-start px-4 py-3 data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 text-muted-foreground transition-all"
                        >
                            GST Summary
                        </TabsTrigger>
                        <TabsTrigger
                            value="receivables"
                            className="w-full justify-start px-4 py-3 data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 text-muted-foreground transition-all"
                        >
                            Outstanding Receivables
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 space-y-4">
                    {/* PROFIT & LOSS */}
                    <TabsContent value="pnl" className="m-0 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="shadow-none border bg-card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Revenue</CardDescription>
                                    <CardTitle className="text-xl">{formatCurrency(totalIncome)}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="shadow-none border bg-card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Expenses</CardDescription>
                                    <CardTitle className="text-xl">{formatCurrency(totalExpense)}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="shadow-none border bg-card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Net Profit</CardDescription>
                                    <CardTitle className={cn(
                                        "text-xl",
                                        netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {formatCurrency(netProfit)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Detailed Table */}
                        <Card className="shadow-none border bg-card">
                            <CardHeader>
                                <CardTitle>Detailed Statement</CardTitle>
                                <CardDescription>Breakdown by account category.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="bg-muted/30 font-medium"><TableCell colSpan={3}>Income</TableCell></TableRow>
                                        {income.map((item) => (
                                            <TableRow key={item.account_name}>
                                                <TableCell className="pl-8 text-muted-foreground">Income</TableCell>
                                                <TableCell>{item.account_name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(item.net_amount))}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/30 font-medium"><TableCell colSpan={3}>Expenses</TableCell></TableRow>
                                        {expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No expenses recorded.</TableCell>
                                            </TableRow>
                                        ) : expenses.map((item) => (
                                            <TableRow key={item.account_name}>
                                                <TableCell className="pl-8 text-muted-foreground">Expense</TableCell>
                                                <TableCell>{item.account_name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(item.net_amount))}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="border-t-2 font-bold bg-muted/10">
                                            <TableCell colSpan={2}>Net Profit</TableCell>
                                            <TableCell className="text-right">{formatCurrency(netProfit)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* GST SUMMARY */}
                    <TabsContent value="gst" className="m-0">
                        <Card className="shadow-none border bg-card">
                            <CardHeader>
                                <CardTitle>GST Liability Summary</CardTitle>
                                <CardDescription>Tax liabilities calculated from issued invoices.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tax Period</TableHead>
                                            <TableHead>GST Type</TableHead>
                                            <TableHead className="text-right">Payable Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gst.data?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                    No GST records found.
                                                </TableCell>
                                            </TableRow>
                                        ) : gst.data?.map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{item.tax_period}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                                        {item.gst_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(item.total_payable))}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* OUTSTANDING RECEIVABLES */}
                    <TabsContent value="receivables" className="m-0">
                        <Card className="shadow-none border bg-card">
                            <CardHeader>
                                <CardTitle>Outstanding Receivables</CardTitle>
                                <CardDescription>Unpaid amounts by customer.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Outstanding Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receivables.data?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                    No outstanding revenue.
                                                </TableCell>
                                            </TableRow>
                                        ) : receivables.data?.map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono text-xs">{item.invoice_number || 'N/A'}</TableCell>
                                                <TableCell className="font-medium">{item.customer_name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(item.outstanding_amount))}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
