"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { GSTR3BData } from "@/lib/actions/gst";

interface GSTR3BViewProps {
    data: GSTR3BData;
}

export function GSTR3BView({ data }: GSTR3BViewProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            {/* Table 3.1 */}
            <div className="space-y-4">
                <div className="px-1">
                    <h3 className="text-base font-semibold text-slate-900">3.1 Details of Outward Supplies and Inward Supplies liable to Reverse Charge</h3>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                <TableHead className="w-[40%] font-semibold text-xs uppercase tracking-wider text-slate-500">Nature of Supplies</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Total Taxable Value</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Integrated Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Central Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">State/UT Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Cess</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="font-medium text-slate-700">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</TableCell>
                                <TableCell className="text-right font-medium text-slate-900">{formatCurrency(data.outwardSupplies.taxableValue)}</TableCell>
                                <TableCell className="text-right text-slate-600">{formatCurrency(data.outwardSupplies.integratedTax)}</TableCell>
                                <TableCell className="text-right text-slate-600">{formatCurrency(data.outwardSupplies.centralTax)}</TableCell>
                                <TableCell className="text-right text-slate-600">{formatCurrency(data.outwardSupplies.stateTax)}</TableCell>
                                <TableCell className="text-right text-slate-600">{formatCurrency(data.outwardSupplies.cess)}</TableCell>
                            </TableRow>
                            {/* Placeholders for other rows generally zero for now */}
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="font-medium text-slate-700">(b) Outward taxable supplies (zero rated)</TableCell>
                                <TableCell className="text-right font-medium text-slate-400">₹0.00</TableCell>
                                <TableCell className="text-right text-slate-400">₹0.00</TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                                <TableCell className="text-right text-slate-400">₹0.00</TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 bg-slate-50/50 font-semibold">
                                <TableCell className="text-slate-900">Total</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(data.outwardSupplies.taxableValue)}</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(data.outwardSupplies.integratedTax)}</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(data.outwardSupplies.centralTax)}</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(data.outwardSupplies.stateTax)}</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(data.outwardSupplies.cess)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Table 4 */}
            <div className="space-y-4">
                <div className="px-1">
                    <h3 className="text-base font-semibold text-slate-900">4. Eligible ITC</h3>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                <TableHead className="w-[40%] font-semibold text-xs uppercase tracking-wider text-slate-500">Details</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Integrated Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Central Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">State/UT Tax</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Cess</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="font-medium text-slate-700">(A) ITC Available (whether in full or part)</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(data.eligibleITC.integratedTax)}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(data.eligibleITC.centralTax)}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(data.eligibleITC.stateTax)}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(data.eligibleITC.cess)}</TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="font-medium text-slate-700">(B) ITC Reversed</TableCell>
                                <TableCell className="text-right text-amber-600 font-medium">₹0.00</TableCell>
                                <TableCell className="text-right text-amber-600 font-medium">₹0.00</TableCell>
                                <TableCell className="text-right text-amber-600 font-medium">₹0.00</TableCell>
                                <TableCell className="text-right text-amber-600 font-medium">₹0.00</TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 bg-emerald-50/30 font-semibold text-emerald-800">
                                <TableCell>(C) Net ITC Available (A) - (B)</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.eligibleITC.integratedTax)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.eligibleITC.centralTax)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.eligibleITC.stateTax)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.eligibleITC.cess)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
