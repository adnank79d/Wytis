'use client';

import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/actions/stripe';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Price = {
    id: string;
    unit_amount: number | null;
    currency: string | null;
    interval: string | null;
    interval_count: number | null;
    metadata: any;
};

type Product = {
    id: string;
    name: string | null;
    description: string | null;
    prices: Price[];
};

import { useSearchParams } from 'next/navigation';

export function PricingTable({ products }: { products: Product[] }) {
    const [loading, setLoading] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const promoCode = searchParams.get('promo');

    const handleCheckout = async (priceId: string) => {
        setLoading(priceId);
        try {
            await createCheckoutSession(priceId, promoCode || undefined);
        } catch (error) {
            console.error(error);
            setLoading(null);
        }
    };

    const formatPrice = (price: Price) => {
        if (!price.unit_amount) return 'Custom';

        const amount = (price.unit_amount || 0) / 100;
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: price.currency || 'INR',
                minimumFractionDigits: 0,
            }).format(amount);
        } catch {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: price.currency || 'USD',
                minimumFractionDigits: 0,
            }).format(amount);
        }
    };

    // Feature map based on plan names (normalized to lower case)
    const PLAN_FEATURES: Record<string, string[]> = {
        'starter': ['100 Invoices/month', 'Single User', 'Basic Support'],
        'growth': ['Unlimited Invoices', 'Up to 5 Users', 'Priority Email Support'],
        'business': ['Unlimited Users', 'Advanced Reporting', 'Remove Wytis Branding'],
        'enterprise': ['Dedicated Manager', 'Custom SLA', 'On-premise Deployment']
    };

    return (
        <div className="divide-y divide-border/40 rounded-lg border border-border/40 bg-card overflow-hidden">
            {products.map((product) => {
                const price = product.prices[0];
                if (!price) return null;

                const isCustom = !price.unit_amount;
                // Simple logic to highlight "Growth" or specifically marked plans
                // We could use metadata for this
                const isPopular = product.name === 'Growth';

                // Get features based on product name
                const features = PLAN_FEATURES[product.name?.toLowerCase() || ''] || ['Standard Features'];

                return (
                    <div key={product.id} className="group p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-muted/30 transition-colors relative">
                        {isPopular && (
                            <div className="absolute top-0 left-0 w-[3px] h-full bg-primary" />
                        )}

                        {/* Name & Desc */}
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg leading-none">{product.name}</h4>
                                {isPopular && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                                        Popular
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug max-w-sm">
                                {product.description}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                                {features.map((feature, i) => (
                                    <span key={i} className="flex items-center text-xs text-muted-foreground">
                                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                            <div className="text-right">
                                <div className="text-xl font-bold leading-none">
                                    {formatPrice(price)}
                                </div>
                                {!isCustom && (
                                    <span className="text-xs text-muted-foreground font-medium">/month</span>
                                )}
                            </div>

                            <Button
                                size="sm"
                                onClick={() => !isCustom && handleCheckout(price.id)}
                                disabled={isCustom || loading === price.id}
                                variant={isPopular ? "default" : "outline"}
                                className={cn("min-w-[100px]", isCustom && "opacity-80")}
                            >
                                {loading === price.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    isCustom ? 'Contact' : 'Upgrade'
                                )}
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
