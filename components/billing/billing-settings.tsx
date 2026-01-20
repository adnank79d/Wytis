'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createPortalSession } from '@/lib/actions/stripe';
import { useState } from 'react';

type Subscription = {
    id: string;
    status: string | null;
    cancel_at_period_end: boolean | null;
    current_period_end: string;
    prices: {
        unit_amount: number | null;
        currency: string | null;
        interval: string | null;
        products: {
            name: string | null;
        } | null;
    } | null;
};

export function BillingSettings({ subscription }: { subscription: Subscription }) {
    const [loading, setLoading] = useState(false);

    const handlePortal = async () => {
        setLoading(true);
        try {
            await createPortalSession();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const planName = subscription.prices?.products?.name || 'Unknown Plan';
    const amount = (subscription.prices?.unit_amount || 0) / 100;
    const currency = subscription.prices?.currency?.toUpperCase() || 'USD';
    const interval = subscription.prices?.interval || 'month';
    const endDate = new Date(subscription.current_period_end).toLocaleDateString();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You are currently subscribed to {planName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Status</span>
                    <span className="capitalize">{subscription.status}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Price</span>
                    <span>{amount} {currency} / {interval}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Renews On</span>
                    <span>{endDate}</span>
                </div>
                {subscription.cancel_at_period_end && (
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-sm mt-2 text-yellow-800 dark:text-yellow-100">
                        Your subscription will end on {endDate}.
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handlePortal} disabled={loading} variant="outline">
                    {loading ? 'Redirecting...' : 'Manage Subscription'}
                </Button>
            </CardFooter>
        </Card>
    );
}
