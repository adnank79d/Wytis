import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Banknote, CalendarCheck, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

import { getPayrollRuns, deletePayrollRun } from "@/lib/actions/payroll";
import { RunPayrollDialog } from "@/components/payroll/run-payroll-dialog";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const runs = await getPayrollRuns();

    // -- Calculate Stats --
    const totalRuns = runs.length;
    const totalPaid = runs
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

    // Last month's payout (most recent run by date)
    const latestRun = runs[0];
    const latestPayout = latestRun ? (Number(latestRun.total_amount) || 0) : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Payroll</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage employee salaries and processing history.</p>
                </div>
                <RunPayrollDialog />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid (YTD)</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Disbursed successfully</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Payout</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(latestPayout)}</div>
                        <p className="text-xs text-muted-foreground mt-1 is-truncate">
                            {latestRun ? format(new Date(latestRun.year, latestRun.month - 1), 'MMMM yyyy') : "No runs yet"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRuns}</div>
                        <p className="text-xs text-muted-foreground mt-1">Months processed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Run History</h2>
                </div>

                <Card className="border-0 shadow-sm bg-card/50">
                    <CardContent className="p-0">
                        {runs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                                    <Banknote className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-foreground">No Payroll Runs Found</p>
                                    <p className="text-sm text-muted-foreground">Start by clicking "Run Payroll" to generate your first batch.</p>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                                        <TableHead className="w-[300px]">Pay Period</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Generated On</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead className="text-right w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {runs.map((run) => (
                                        <TableRow key={run.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-base">
                                                        {format(new Date(run.year, run.month - 1), 'MMMM yyyy')}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Calendar className="h-3 w-3" /> Monthly Cycle
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`capitalize px-3 py-1 font-medium border-0 ${run.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                            : run.status === 'locked'
                                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    {run.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm font-medium">
                                                {format(new Date(run.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-base">
                                                {formatCurrency(run.total_amount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
