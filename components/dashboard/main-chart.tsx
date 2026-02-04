"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChartDataPoint {
    date: string;
    revenue?: number;
    expense?: number;
    cashflow?: number; // Added to support cashflow view
    [key: string]: any;
}

interface MainChartProps {
    data: ChartDataPoint[];
    className?: string;
}

export function MainChart({ data, className }: MainChartProps) {
    // Basic date formatting for X-axis
    const formattedData = data.map(d => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })
    }));

    // Determine render mode based on data keys presence
    const isCashflowMode = data.length > 0 && data[0].hasOwnProperty('cashflow') && !data[0].hasOwnProperty('revenue');

    return (
        <div className={cn("w-full transition-all duration-300 ease-in-out", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="shortDate"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} // K format for compact axis
                        dx={-5}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderColor: "#e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            padding: "8px 12px"
                        }}
                        itemStyle={{ color: "#1e293b", fontWeight: 500 }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, ""]}
                        labelStyle={{ color: "#64748b", marginBottom: "4px" }}
                        cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />

                    {isCashflowMode ? (
                        <Area
                            type="monotone"
                            dataKey="cashflow"
                            name="Cash Flow"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCashflow)"
                            activeDot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
                        />
                    ) : (
                        <>
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#4f46e5"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                activeDot={{ r: 4, strokeWidth: 0, fill: "#4f46e5" }}
                            />
                            {/* Make expense visible but subtle */}
                            <Area
                                type="monotone"
                                dataKey="expense"
                                name="Expenses"
                                stroke="#e11d48"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                activeDot={{ r: 4, strokeWidth: 0, fill: "#e11d48" }}
                            />
                        </>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
