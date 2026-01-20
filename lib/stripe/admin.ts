import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }
        stripeInstance = new Stripe(key, {
            apiVersion: '2025-12-15.clover',
            appInfo: {
                name: 'Wytis',
                version: '0.1.0'
            },
            typescript: true,
        });
    }
    return stripeInstance;
}

// Legacy export for backward compatibility - will throw if key is missing
export const stripe = {
    get webhooks() { return getStripe().webhooks; },
    get subscriptions() { return getStripe().subscriptions; },
    get customers() { return getStripe().customers; },
    get checkout() { return getStripe().checkout; },
    get products() { return getStripe().products; },
    get prices() { return getStripe().prices; },
};
