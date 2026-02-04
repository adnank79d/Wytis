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
import { Eye, Trash2, Banknote, CalendarCheck, TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { getPayrollRuns, deletePayrollRun } from "@/lib/actions/payroll";
import { RunPayrollDialog } from "@/components/payroll/run-payroll-dialog";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate" }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: "bg-rose-50/50 hover:bg-rose-50", border: "border-rose-100 hover:border-rose-200", iconBg: "bg-rose-100 text-rose-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" },
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" },
        purple: { bg: "bg-purple-50/50 hover:bg-purple-50", border: "border-purple-100 hover:border-purple-200", iconBg: "bg-purple-100 text-purple-600", text: "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default shadow-sm hover:shadow-md", s.bg, s.border)}>
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
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Payroll</h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Manage employee salaries and processing history.</p>
                </div>
                <RunPayrollDialog />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpICard
                    title="Total Paid (YTD)"
                    value={formatCurrency(totalPaid)}
                    subtext="Disbursed successfully"
                    icon={DollarSign}
                    color="emerald"
                />
                <KpICard
                    title="Last Payout"
                    value={formatCurrency(latestPayout)}
                    subtext={latestRun ? format(new Date(latestRun.year, latestRun.month - 1), 'MMMM yyyy') : "No runs yet"}
                    icon={TrendingUp}
                    color="blue"
                />
                <KpICard
                    title="Total Runs"
                    value={totalRuns}
                    subtext="Months processed"
                    icon={CalendarCheck}
                    color="indigo"
                />
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-slate-900">Run History</h2>
                </div>

                <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {runs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Banknote className="h-8 w-8 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-slate-900">No Payroll Runs Found</p>
                                    <p className="text-sm text-slate-500 mt-1">Start by clicking "Run Payroll" to generate your first batch.</p>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-slate-100">
                                        <TableHead className="w-[300px] h-12 font-bold text-slate-400 text-xs uppercase tracking-wider pl-6">Pay Period</TableHead>
                                        <TableHead className="h-12 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="h-12 font-bold text-slate-400 text-xs uppercase tracking-wider">Generated On</TableHead>
                                        <TableHead className="text-right h-12 font-bold text-slate-400 text-xs uppercase tracking-wider">Total Amount</TableHead>
                                        <TableHead className="text-right w-[100px] h-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {runs.map((run) => (
                                        <TableRow key={run.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {format(new Date(run.year, run.month - 1), 'MMMM yyyy')}
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                                        <Calendar className="h-3 w-3" /> Monthly Cycle
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn("capitalize px-2.5 py-0.5 font-semibold text-xs border bg-opacity-50",
                                                        run.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : run.status === 'locked'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    )}
                                                >
                                                    {run.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm font-medium py-4">
                                                {format(new Date(run.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-700 py-4">
                                                {formatCurrency(run.total_amount)}
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-4">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </div>
            </div>
        </div>
    );
}
