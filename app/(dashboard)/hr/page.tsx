import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Banknote, Building2 } from "lucide-react";

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
    const departmentsCount = new Set(employees.map(e => e.department).filter(Boolean)).size;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                    <p className="text-muted-foreground mt-1">Manage staff, roles, and automated payroll.</p>
                </div>
                <div className="flex gap-2">
                    <AddEmployeeDialog />
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-row items-center p-4 gap-4 shadow-sm border-l-4 border-l-primary/80">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                        <p className="text-3xl font-bold">{activeCount}</p>
                    </div>
                </Card>

                <Card className="flex flex-row items-center p-4 gap-4 shadow-sm border-l-4 border-l-emerald-500/80">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                        <Banknote className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payroll Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
                    </div>
                </Card>

                <Card className="flex flex-row items-center p-4 gap-4 shadow-sm border-l-4 border-l-blue-500/80">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Departments</p>
                        <p className="text-3xl font-bold">{departmentsCount}</p>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="employees" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="employees" className="px-6">Employees</TabsTrigger>
                    <TabsTrigger value="payroll" className="px-6">Payroll</TabsTrigger>
                </TabsList>

                {/* EMPLOYEES TAB */}
                <TabsContent value="employees" className="space-y-4 animate-in fade-in-50 duration-300">
                    <EmployeesTable employees={employees} />
                </TabsContent>

                {/* PAYROLL TAB */}
                <TabsContent value="payroll" className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-muted/50 to-muted/10 p-6 rounded-xl border border-muted-foreground/10">
                        <div className="space-y-1 mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-emerald-600" />
                                Run Payroll
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-lg">
                                Automatically generate salary expenses for all active employees for the selected month.
                                This ensures your P&L reports are accurate.
                            </p>
                        </div>
                        <RunPayrollDialog />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Recent Payouts</h3>
                        <ExpensesTable expenses={payrollHistory as any[]} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
