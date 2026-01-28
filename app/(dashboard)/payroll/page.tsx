import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Trash2 } from "lucide-react";
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
                    <p className="text-muted-foreground mt-1">Process and manage employee salaries.</p>
                </div>
                <RunPayrollDialog />
            </div>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Payroll History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Processing Date</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                {/* <TableHead className="text-right">Actions</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {runs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No payroll runs generated yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                runs.map((run) => (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(run.year, run.month - 1), 'MMMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={run.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                                                {run.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(run.created_at), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(run.total_amount)}
                                        </TableCell>

                                        {/* Action buttons (View/Delete) could go here. 
                                            For simplicity in this step, we just show the list.
                                            Ideally we'd have a [View Payslips] button linking to a detail page.
                                        */}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
