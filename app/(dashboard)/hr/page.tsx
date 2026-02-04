import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Banknote, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { getEmployees, getPayrollHistory } from "@/lib/actions/hr";
import { EmployeesTable } from "@/components/hr/employees-table";
import { AddEmployeeDialog } from "@/components/hr/add-employee-dialog";
import { RunPayrollDialog } from "@/components/hr/run-payroll-dialog";
import { ExpensesTable } from "@/components/expenses/expenses-table";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" }
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
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Human <span className="text-slate-900">Resources</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Manage staff, roles, and automated payroll.
                    </p>
                </div>
                <div className="flex gap-2">
                    <AddEmployeeDialog />
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <KpICard
                    title="Active Stats"
                    value={activeCount}
                    subtext="Full-time & Contract"
                    icon={Users}
                    color="slate"
                />
                <KpICard
                    title="Monthly Payroll"
                    value={formatCurrency(totalPayroll)}
                    subtext="Estimated cost"
                    icon={Banknote}
                    color="emerald"
                />
                <KpICard
                    title="Departments"
                    value={departmentsCount}
                    subtext="Across organization"
                    icon={Building2}
                    color="indigo"
                />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="employees" className="space-y-6">
                <TabsList className="bg-slate-100/80 p-1 border border-slate-200/50 rounded-lg h-auto">
                    <TabsTrigger value="employees" className="rounded-md px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">Employees</TabsTrigger>
                    <TabsTrigger value="payroll" className="rounded-md px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">Payroll</TabsTrigger>
                </TabsList>

                {/* EMPLOYEES TAB */}
                <TabsContent value="employees" className="space-y-4 animate-in fade-in-50 duration-300">
                    <EmployeesTable employees={employees} />
                </TabsContent>

                {/* PAYROLL TAB */}
                <TabsContent value="payroll" className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-50/40 p-8 rounded-2xl border border-indigo-100/80 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <Banknote className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="space-y-2 mb-4 md:mb-0 relative z-10">
                            <h3 className="text-xl font-bold flex items-center gap-2.5 text-slate-900">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                                    <Banknote className="h-5 w-5 text-indigo-600" />
                                </div>
                                Run Payroll
                            </h3>
                            <p className="text-sm text-slate-500 max-w-lg font-medium leading-relaxed">
                                Automatically generate salary expenses for all active employees for the selected month.
                                This ensures your P&L reports are accurate and your financial records are up to date.
                            </p>
                        </div>
                        <div className="relative z-10">
                            <RunPayrollDialog />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recent Payouts</h3>
                        </div>
                        <ExpensesTable expenses={payrollHistory as any[]} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
