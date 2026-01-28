"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { ArrowUpRight, ArrowDownRight, IndianRupee, PieChart as PieChartIcon, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialReport } from "@/lib/actions/reports";

interface ReportsViewProps {
    data: FinancialReport;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ReportsView({ data }: ReportsViewProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-muted-foreground">Comprehensive overview of your business performance.</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="tax">Tax & Compliance</TabsTrigger>
                    <TabsTrigger value="receivables">Receivables</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Last 6 months cumulative
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                <TrendingUp className={cn("h-4 w-4", data.summary.netProfit >= 0 ? "text-emerald-500" : "text-rose-500")} />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", data.summary.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {formatCurrency(data.summary.netProfit)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.summary.profitMargin.toFixed(1)}% Profit Margin
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.outstandingReceivables)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Unpaid invoices
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">GST Liability</CardTitle>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.gstPayable)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total tax payable
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Monthly revenue over the last 6 months</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.trends.revenue}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value / 1000}k`}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                formatter={(value: any) => formatCurrency(Number(value))}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Expense Breakdown</CardTitle>
                                <CardDescription>Expenses by category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {data.categoryBreakdown.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.categoryBreakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {data.categoryBreakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                            No expense data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* P&L TAB */}
                <TabsContent value="pnl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profit & Loss Statement</CardTitle>
                            <CardDescription>Detailed breakdown of income and expenses.</CardDescription>
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
                                    <TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={3}>Income</TableCell></TableRow>
                                    {data.details.income.map((item, i) => (
                                        <TableRow key={`inc-${i}`}>
                                            <TableCell className="pl-6 text-muted-foreground">Operating Income</TableCell>
                                            <TableCell>{item.account_name}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold border-t bg-muted/20">
                                        <TableCell colSpan={2}>Total Income</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data.summary.totalRevenue)}</TableCell>
                                    </TableRow>

                                    <TableRow className="h-4"><TableCell colSpan={3}></TableCell></TableRow>

                                    <TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={3}>Expenses</TableCell></TableRow>
                                    {data.details.expenses.map((item, i) => (
                                        <TableRow key={`exp-${i}`}>
                                            <TableCell className="pl-6 text-muted-foreground">Operating Expense</TableCell>
                                            <TableCell>{item.account_name}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold border-t bg-muted/20">
                                        <TableCell colSpan={2}>Total Expenses</TableCell>
                                        <TableCell className="text-right text-rose-600">({formatCurrency(data.summary.totalExpenses)})</TableCell>
                                    </TableRow>

                                    <TableRow className="h-8 border-none"><TableCell colSpan={3}></TableCell></TableRow>

                                    <TableRow className="font-bold text-lg bg-primary/5 border-t-2 border-primary">
                                        <TableCell colSpan={2}>Net Profit</TableCell>
                                        <TableCell className={cn("text-right", data.summary.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {formatCurrency(data.summary.netProfit)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAX TAB */}
                <TabsContent value="tax">
                    <Card>
                        <CardHeader>
                            <CardTitle>GST Liability Report</CardTitle>
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
                                    {data.gst.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No GST records found.</TableCell>
                                        </TableRow>
                                    ) : data.gst.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{item.tax_period}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.gst_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_payable)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* RECEIVABLES TAB */}
                <TabsContent value="receivables">
                    <Card>
                        <CardHeader>
                            <CardTitle>Outstanding Receivables</CardTitle>
                            <CardDescription>Unpaid invoices and aging report.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Days Overdue</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.receivables.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No outstanding receivables.</TableCell>
                                        </TableRow>
                                    ) : data.receivables.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{item.invoice_number}</TableCell>
                                            <TableCell>{item.customer_name}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.days_overdue > 0 ? "destructive" : "secondary"}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {item.days_overdue > 0 ? `${item.days_overdue} days` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(item.outstanding_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
