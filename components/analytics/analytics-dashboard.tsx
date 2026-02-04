"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsOverview } from "@/lib/actions/analytics";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ArrowUpRight, Users, DollarSign, TrendingUp, CreditCard, Wallet, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
    data: AnalyticsOverview;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#64748b"];

function KpICard({ title, value, subtext, icon: Icon, color = "slate", trendUp }: any) {
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
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default shadow-sm hover:shadow-md", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500/90">{title}</span>
                {Icon && (<div className={cn("p-1.5 rounded-md transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}
            </div>
            <div className="space-y-1">
                <div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div>
                {subtext && (
                    <div className="flex items-center gap-1.5 mt-1">
                        {trendUp !== undefined && (
                            <div className={cn("flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                                trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {trendUp ? "↑ Up" : "↓ Down"}
                            </div>
                        )}
                        <span className="text-xs text-slate-500 font-medium">{subtext}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KpICard
                    title="Total Revenue (MoM)"
                    value={formatCurrency(data.financials.currentRevenue)}
                    subtext={`${data.financials.revenueGrowth.toFixed(1)}% vs last month`}
                    trendUp={data.financials.revenueGrowth >= 0}
                    icon={DollarSign}
                    color="indigo"
                />
                <KpICard
                    title="New Customers"
                    value={`+${data.crm.newCustomersThisMonth}`}
                    subtext="Last 30 Days"
                    icon={Users}
                    color="emerald"
                />
                <KpICard
                    title="Active Lead Value"
                    value={data.crm.activeDealsValue} // Assuming this is pre-formatted or just a count? It says 'Value' so probably currency. If string, leave as is.
                    subtext="Potential opportunities"
                    icon={TrendingUp}
                    color="amber"
                />
                <KpICard
                    title="Avg Monthly Payroll"
                    value={formatCurrency(data.payroll.avgMonthlyPayroll)}
                    subtext="Based on run history"
                    icon={CreditCard}
                    color="blue"
                />
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-100/80 p-1.5 rounded-lg border border-slate-200/50 inline-flex h-auto w-auto">
                    {['overview', 'financials', 'growth'].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all text-slate-500 hover:text-slate-800"
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue Trend - Main Chart */}
                        <div className="col-span-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-base font-bold text-slate-900">Revenue Overview</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Monthly revenue performance for the last 6 months</p>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.financials.revenueHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value / 1000}k`}
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

                        {/* Top Expenses */}
                        <div className="col-span-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-base font-bold text-slate-900">Top Expenses</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Breakdown by category</p>
                            </div>
                            <div className="p-6 bg-white flex items-center justify-center h-[368px]">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.topExpenses}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                dataKey="amount"
                                                cornerRadius={6}
                                                strokeWidth={0}
                                            >
                                                {data.topExpenses.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
                                                                    <span className="text-xs font-bold text-slate-700">{data.name}</span>
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-900 pl-4">{formatCurrency(Number(payload[0].value))}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                formatter={(value) => <span className="text-xs font-semibold text-slate-600 ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-base font-bold text-slate-900">Payroll Costs</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Monthly payroll expenditure</p>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.payroll.payrollCostHistory}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                            />
                                            <YAxis
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value / 1000}k`}
                                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
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
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="growth" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                            <h3 className="text-base font-bold text-slate-900">Customer Acquisition</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">New customers added per month</p>
                        </div>
                        <div className="p-6 bg-white">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.crm.customerGrowthHistory}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#64748b', fontWeight: 600 }}
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: '#64748b', fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                <p className="text-sm font-bold text-slate-700">
                                                                    +{payload[0].value} Customers
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#10b981' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
