"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { GSTRRow } from "@/lib/actions/gst";

interface GSTRTableProps {
    data: GSTRRow[];
    title: string;
}

export function GSTRTable({ data, title }: GSTRTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Note: The title prop is no longer strictly needed in the UI as the TabsContent header handles it, 
                 but keeping it accessible if needed or we could just remove the CardTitle block entirely to be cleaner.
                 The plan says "Remove the wrapping Card component".
             */}
            <Table>
                <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Date</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Party Name</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">GSTIN</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Type</TableHead>
                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Taxable Value</TableHead>
                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Tax (GST)</TableHead>
                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                No entries found for this period.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => (
                            <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="text-slate-500 text-xs">
                                    {format(new Date(row.date), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">{row.partyName}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-mono">{row.gstin}</TableCell>
                                <TableCell className="text-xs text-slate-500 capitalize">{row.type.toLowerCase()}</TableCell>
                                <TableCell className="text-right text-slate-600 font-medium">{formatCurrency(row.taxableValue)}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(row.taxAmount)}</TableCell>
                                <TableCell className="text-right text-slate-900 font-bold">{formatCurrency(row.totalValue)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
