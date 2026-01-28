"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Banknote } from "lucide-react";
import { runPayroll } from "@/lib/actions/hr";
import { cn } from "@/lib/utils";

export function RunPayrollDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; count?: number; totalAmount?: number } | null>(null);

    // Default to current month
    const today = new Date();
    const [month, setMonth] = useState<string>((today.getMonth() + 1).toString());
    const [year, setYear] = useState<string>(today.getFullYear().toString());

    async function handleRun() {
        setIsLoading(true);
        setResult(null);
        try {
            const res = await runPayroll(parseInt(month), parseInt(year));
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (error) {
            setResult({ success: false, message: "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) setResult(null); // Reset on close
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Banknote className="mr-2 h-4 w-4" /> Run Payroll
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Run Payroll</DialogTitle>
                    <DialogDescription>
                        Process salaries for all active employees for the selected month.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Month</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2026">2026</SelectItem>
                                        <SelectItem value="2027">2027</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                This will create expense records for all active employees who haven't been paid for this period yet.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={cn(
                        "py-6 text-center rounded-md border flex flex-col items-center justify-center gap-2",
                        result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                    )}>
                        {result.success ? <CheckCircle className="h-8 w-8 text-emerald-600" /> : <AlertCircle className="h-8 w-8 text-red-600" />}
                        <p className="font-medium">{result.message}</p>
                        {result.count !== undefined && result.count > 0 && (
                            <p className="text-sm">Total Payout: <span className="font-bold">{formatCurrency(result.totalAmount || 0)}</span></p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <Button onClick={handleRun} disabled={isLoading}>
                            {isLoading ? "Processing..." : "Confirm & Pay"}
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
