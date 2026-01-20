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
            <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-1.5 rounded-full">
                        <Lock className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-900">Your trial has ended.</p>
                        <p className="text-xs text-amber-700">Upgrade your plan to continue creating invoices and transactions.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-950 h-8" asChild>
                    <Link href="/settings/billing">Upgrade Plan</Link>
                </Button>
            </div>
        );
    }

    // Only show if ending soon (e.g. 3 days)
    if (daysLeft <= 3) {
        return (
            <div className="bg-blue-50 border-b border-blue-200 p-3 px-6 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                        <Info className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900">Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.</p>
                        <p className="text-xs text-blue-700">You will retain read-only access to your data after expiry.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-900 hover:bg-blue-100 h-8" asChild>
                    <Link href="/settings/billing">View Plans</Link>
                </Button>
            </div>
        );
    }

    return null;
}
