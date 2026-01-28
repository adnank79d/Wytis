import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Banknote } from "lucide-react";

import { getEmployees, getPayrollHistory } from "@/lib/actions/hr";
import { EmployeesTable } from "@/components/hr/employees-table";
import { AddEmployeeDialog } from "@/components/hr/add-employee-dialog";
import { RunPayrollDialog } from "@/components/hr/run-payroll-dialog";
import { ExpensesTable } from "@/components/expenses/expenses-table";

export const dynamic = 'force-dynamic';

export default async function HRPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch Data
    const [employees, payrollHistory] = await Promise.all([
        getEmployees(),
        getPayrollHistory()
    ]);

    const activeCount = employees.filter(e => e.status === 'active').length;
    const totalPayroll = employees.filter(e => e.status === 'active').reduce((sum, e) => sum + Number(e.salary_amount), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                    <p className="text-muted-foreground">Manage employees and automated payroll.</p>
                </div>
            </div>

            <Tabs defaultValue="employees" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>

                {/* EMPLOYEES TAB */}
                <TabsContent value="employees" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <Card className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                                    <p className="text-2xl font-bold">{activeCount}</p>
                                </div>
                            </Card>
                            <Card className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Banknote className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Monthly Payroll</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
                                </div>
                            </Card>
                        </div>
                        <AddEmployeeDialog />
                    </div>

                    <EmployeesTable employees={employees} />
                </TabsContent>

                {/* PAYROLL TAB */}
                <TabsContent value="payroll" className="space-y-4">
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                        <div>
                            <h3 className="text-lg font-medium">Payroll Automation</h3>
                            <p className="text-sm text-muted-foreground">Run payroll to automatically generate salary expenses for all active employees.</p>
                        </div>
                        <RunPayrollDialog />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll History</CardTitle>
                            <CardDescription>Recent salary payments recorded as expenses.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ExpensesTable expenses={payrollHistory as any[]} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
