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
        <Card>
            <CardHeader className="py-4">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md border-t">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Date</TableHead>
                                <TableHead>Party Name</TableHead>
                                <TableHead>GSTIN</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Taxable Value</TableHead>
                                <TableHead className="text-right">Tax (GST)</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No entries found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {format(new Date(row.date), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="font-medium">{row.partyName}</TableCell>
                                        <TableCell className="text-xs">{row.gstin}</TableCell>
                                        <TableCell className="text-xs">{row.type}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.taxableValue)}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(row.taxAmount)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.totalValue)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
