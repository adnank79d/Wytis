"use client";

import { Button } from "@/components/ui/button";
import { Info, Lock } from "lucide-react";
import Link from "next/link";

interface TrialBannerProps {
    status: 'active' | 'expired' | 'paid';
    trialEndsAt: string; // ISO string
}

export function TrialBanner({ status, trialEndsAt }: TrialBannerProps) {
    if (status === 'paid') return null;

    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isExpired = status === 'expired' || diffTime <= 0;

    if (isExpired) {
        return (
            <div className="bg-amber-50 border-b border-amber-200 py-2 px-3 md:p-3 md:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-amber-100 p-1 md:p-1.5 rounded-full">
                        <Lock className="h-3 w-3 md:h-4 md:w-4 text-amber-700" />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-amber-900">Your trial has ended.</p>
                        <p className="text-[10px] md:text-xs text-amber-700 hidden sm:block">Upgrade your plan to continue creating invoices.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-950 h-7 md:h-8 text-xs md:text-sm w-full sm:w-auto" asChild>
                    <Link href="/settings/billing">Upgrade Plan</Link>
                </Button>
            </div>
        );
    }

    // Only show if ending soon (e.g. 3 days)
    if (daysLeft <= 3) {
        return (
            <div className="bg-blue-50 border-b border-blue-200 py-2 px-3 md:p-3 md:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-blue-100 p-1 md:p-1.5 rounded-full">
                        <Info className="h-3 w-3 md:h-4 md:w-4 text-blue-700" />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-blue-900">Trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.</p>
                        <p className="text-[10px] md:text-xs text-blue-700 hidden sm:block">Read-only access after expiry.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-900 hover:bg-blue-100 h-7 md:h-8 text-xs md:text-sm w-full sm:w-auto" asChild>
                    <Link href="/settings/billing">View Plans</Link>
                </Button>
            </div>
        );
    }

    return null;
}
