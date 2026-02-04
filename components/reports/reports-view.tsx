"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import {
    ArrowUpRight,
    ArrowDownRight,
    IndianRupee,
    FileText,
    TrendingUp,
    AlertTriangle,
    Download,
    Calendar as CalendarIcon,
    Filter,
    CheckCircle2,
    Wallet,
    Scale,
    Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialReport } from "@/lib/actions/reports";

interface ReportsViewProps {
    data: FinancialReport;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export function ReportsView({ data }: ReportsViewProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Financial Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Insights into revenue, profit, and tax liability.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-600 font-semibold h-10">
                        <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                        <span>Last 6 Months</span>
                    </div>
                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold shadow-sm h-10 rounded-lg">
                        <Download className="mr-2 h-4 w-4 text-slate-500 ml-0.5" /> Export PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-100/80 p-1.5 rounded-lg border border-slate-200/50 inline-flex h-auto w-auto">
                    {['overview', 'pnl', 'balance_sheet'].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all text-slate-500 hover:text-slate-800"
                        >
                            {tab === 'pnl' ? 'Profit & Loss' : tab === 'balance_sheet' ? 'Balance Sheet' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Summary Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <KpICard
                            title="Total Revenue"
                            value={formatCurrency(data.summary.totalRevenue)}
                            trend="+12% from last period"
                            trendUp={true}
                            icon={IndianRupee}
                            color="indigo"
                        />
                        <KpICard
                            title="Net Profit"
                            value={formatCurrency(data.summary.netProfit)}
                            trend={`${data.summary.profitMargin.toFixed(1)}% Margin`}
                            trendUp={data.summary.netProfit > 0}
                            icon={TrendingUp}
                            color={data.summary.netProfit >= 0 ? "emerald" : "rose"}
                        />
                        <KpICard
                            title="Total Assets"
                            value={formatCurrency(data.balanceSheet?.assets.reduce((sum, a) => sum + a.amount, 0) || 0)}
                            trend="Holdings"
                            icon={Wallet}
                            color="blue"
                        />
                        <KpICard
                            title="Total Liabilities"
                            value={formatCurrency(data.balanceSheet?.liabilities.reduce((sum, a) => sum + a.amount, 0) || 0)}
                            trend="Obligations"
                            icon={Scale}
                            color="amber"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                        <div className="lg:col-span-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-base font-bold text-slate-900">Revenue Trend</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Monthly revenue over the last 6 months</p>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.trends.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={12}
                                                fontSize={11}
                                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    if (isNaN(date.getTime())) return value.split(' ')[0].substring(0, 3);
                                                    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                                                }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                                                fontSize={11}
                                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                                tickMargin={12}
                                            />
                                            <Tooltip
                                                cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                                    <p className="text-sm font-bold text-slate-700">
                                                                        {formatCurrency(Number(payload[0].value))}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                                activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#6366f1' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-base font-bold text-slate-900">Expense Breakdown</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Top spending categories</p>
                            </div>
                            <div className="p-6 bg-white flex items-center justify-center h-[368px]"> {/* Matched height roughly */}
                                <div className="h-[300px] w-full">
                                    {data.categoryBreakdown.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.categoryBreakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    cornerRadius={6}
                                                    strokeWidth={0}
                                                >
                                                    {data.categoryBreakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any) => formatCurrency(Number(value))}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                            <div className="p-3 bg-slate-50 rounded-full">
                                                <FileText className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium">No expense data available</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* P&L TAB */}
                <TabsContent value="pnl" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="border-b border-slate-100 bg-slate-50/50 py-5 px-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h3>
                                <p className="text-sm font-medium text-slate-500 mt-0.5">Financial performance summary</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-9 bg-white text-xs font-bold shadow-sm border-slate-200 hover:bg-slate-50 text-slate-700 uppercase tracking-wide rounded-lg">
                                <Download className="w-3.5 h-3.5 mr-2" /> Download CSV
                            </Button>
                        </div>
                        <div className="bg-white">
                            <Table>
                                <TableHeader className="bg-white">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="w-[40%] pl-8 font-bold text-slate-400 text-xs uppercase tracking-widest h-12">Account Category</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-xs uppercase tracking-widest h-12">Description</TableHead>
                                        <TableHead className="text-right font-bold text-slate-400 text-xs uppercase tracking-widest pr-8 h-12">Amount (INR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* INCOME SECTION */}
                                    <TableRow className="bg-emerald-50/30 border-y border-emerald-100/40 hover:bg-emerald-50/50">
                                        <TableCell colSpan={3} className="py-3 pl-8">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-emerald-100/60 text-emerald-600"><ArrowUpRight className="w-3.5 h-3.5" /></div>
                                                <span className="font-bold text-emerald-900 text-sm">Operating Income</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {data.details.income.map((item, i) => (
                                        <TableRow key={`inc-${i}`} className="border-slate-50 hover:bg-slate-50/40 group">
                                            <TableCell className="pl-8 text-slate-500 font-medium text-xs uppercase tracking-wide group-hover:text-slate-700 transition-colors">Sales & Services</TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{item.account_name}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-700 pr-8">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50/30 border-t border-slate-100 hover:bg-slate-50/50">
                                        <TableCell colSpan={2} className="pl-8 font-bold text-slate-800 text-sm py-4 uppercase tracking-wide">Total Income</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-700 pr-8 text-sm py-4">{formatCurrency(data.summary.totalRevenue)}</TableCell>
                                    </TableRow>

                                    {/* EXPENSE SECTION */}
                                    <TableRow className="bg-rose-50/30 border-y border-rose-100/40 hover:bg-rose-50/50">
                                        <TableCell colSpan={3} className="py-3 pl-8">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-rose-100/60 text-rose-600"><ArrowDownRight className="w-3.5 h-3.5" /></div>
                                                <span className="font-bold text-rose-900 text-sm">Operating Expenses</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {data.details.expenses.map((item, i) => (
                                        <TableRow key={`exp-${i}`} className="border-slate-50 hover:bg-slate-50/40 group">
                                            <TableCell className="pl-8 text-slate-500 font-medium text-xs uppercase tracking-wide group-hover:text-slate-700 transition-colors">Operational Cost</TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{item.account_name}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-700 pr-8">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50/30 border-t border-slate-100 hover:bg-slate-50/50">
                                        <TableCell colSpan={2} className="pl-8 font-bold text-slate-800 text-sm py-4 uppercase tracking-wide">Total Expenses</TableCell>
                                        <TableCell className="text-right font-bold text-rose-600 pr-8 text-sm py-4">({formatCurrency(data.summary.totalExpenses)})</TableCell>
                                    </TableRow>

                                    {/* NET PROFIT SUMMARY */}
                                    <TableRow className={cn("border-t-2 hover:bg-transparent", data.summary.netProfit >= 0 ? "bg-emerald-50/10 border-emerald-500/20" : "bg-rose-50/10 border-rose-500/20")}>
                                        <TableCell colSpan={2} className="pl-8 py-8 align-top">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xl font-bold text-slate-900">Net Profit</span>
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    (Total Income - Total Expenses)
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("text-right py-8 pr-8 align-top")}>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={cn("text-3xl font-bold tracking-tight", data.summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                                    {formatCurrency(data.summary.netProfit)}
                                                </span>
                                                {data.summary.totalRevenue > 0 && (
                                                    <Badge variant="outline" className={cn("text-[10px] h-6 px-2.5", data.summary.netProfit >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                                                        {data.summary.profitMargin.toFixed(1)}% Margin
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* BALANCE SHEET TAB */}
                <TabsContent value="balance_sheet" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* ASSETS */}
                        <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden h-fit bg-white">
                            <div className="border-b border-emerald-100 bg-emerald-50/30 py-5 px-6">
                                <h3 className="text-lg font-bold text-emerald-900">Assets</h3>
                                <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider mt-1">What the business owns</p>
                            </div>
                            <div className="p-0 bg-white">
                                <Table>
                                    <TableBody>
                                        {data.balanceSheet?.assets.map((item, i) => (
                                            <TableRow key={i} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 font-semibold text-slate-700 py-3.5">{item.account_name}</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-slate-900 py-3.5">{formatCurrency(item.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50/50 border-t-2 border-emerald-100">
                                            <TableCell className="pl-6 font-bold text-slate-900 py-4 uppercase tracking-wide text-xs">Total Assets</TableCell>
                                            <TableCell className="text-right pr-6 font-bold text-emerald-700 text-lg py-4">
                                                {formatCurrency(data.balanceSheet?.assets.reduce((sum, a) => sum + a.amount, 0) || 0)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* LIABILITIES */}
                            <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                                <div className="border-b border-rose-100 bg-rose-50/30 py-5 px-6">
                                    <h3 className="text-lg font-bold text-rose-900">Liabilities</h3>
                                    <p className="text-xs font-semibold text-rose-600/80 uppercase tracking-wider mt-1">What the business owes</p>
                                </div>
                                <div className="p-0 bg-white">
                                    <Table>
                                        <TableBody>
                                            {data.balanceSheet?.liabilities.map((item, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50">
                                                    <TableCell className="pl-6 font-semibold text-slate-700 py-3.5">{item.account_name}</TableCell>
                                                    <TableCell className="text-right pr-6 font-bold text-slate-900 py-3.5">{formatCurrency(item.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-slate-50/50 border-t-2 border-rose-100">
                                                <TableCell className="pl-6 font-bold text-slate-900 py-4 uppercase tracking-wide text-xs">Total Liabilities</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-rose-700 text-lg py-4">
                                                    {formatCurrency(data.balanceSheet?.liabilities.reduce((sum, a) => sum + a.amount, 0) || 0)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* EQUITY */}
                            <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                                <div className="border-b border-indigo-100 bg-indigo-50/30 py-5 px-6">
                                    <h3 className="text-lg font-bold text-indigo-900">Equity</h3>
                                    <p className="text-xs font-semibold text-indigo-600/80 uppercase tracking-wider mt-1">Net value of the business</p>
                                </div>
                                <div className="p-0 bg-white">
                                    <Table>
                                        <TableBody>
                                            {data.balanceSheet?.equity.map((item, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50">
                                                    <TableCell className="pl-6 font-semibold text-slate-700 py-3.5">{item.account_name}</TableCell>
                                                    <TableCell className="text-right pr-6 font-bold text-slate-900 py-3.5">{formatCurrency(item.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-slate-50/50 border-t-2 border-indigo-100">
                                                <TableCell className="pl-6 font-bold text-slate-900 py-4 uppercase tracking-wide text-xs">Total Equity</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-indigo-700 text-lg py-4">
                                                    {formatCurrency(data.balanceSheet?.equity.reduce((sum, a) => sum + a.amount, 0) || 0)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KpICard({ title, value, trend, icon: Icon, color, trendUp }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: "bg-rose-50/50 hover:bg-rose-50", border: "border-rose-100 hover:border-rose-200", iconBg: "bg-rose-100 text-rose-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" },
        blue: { bg: "bg-blue-50/50 hover:bg-blue-50", border: "border-blue-100 hover:border-blue-200", iconBg: "bg-blue-100 text-blue-600", text: "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-5 flex flex-col justify-between min-h-[120px] transition-all duration-200 group cursor-default shadow-sm hover:shadow-md", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500/90">{title}</span>
                {Icon && (<div className={cn("p-1.5 rounded-lg transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}
            </div>
            <div>
                <div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div>
                {trend && (
                    <div className="flex items-center mt-1.5">
                        {trendUp !== undefined && (
                            trendUp ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 mr-1.5" />
                        )}
                        <p className={cn("text-xs font-bold", trendUp ? "text-emerald-700" : trendUp === false ? "text-rose-700" : "text-slate-500")}>{trend}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
