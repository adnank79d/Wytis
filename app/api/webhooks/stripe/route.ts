import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/admin';

const relevantEvents = new Set([
    'product.created',
    'product.updated',
    'product.deleted',
    'price.created',
    'price.updated',
    'price.deleted',
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
]);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('Stripe-Signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) return new Response('Webhook secret not found.', { status: 400 });
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.log(`❌ Error message: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (relevantEvents.has(event.type)) {
        const supabase = await createClient(); // Use service role if needed, but here we might need admin rights.
        // Actually, createClient() usually uses cookie auth. For webhooks, we need ADMIN access to write to these tables regardless of RLS (or specific policies).
        // HOWEVER, the standard `createClient` in `lib/supabase/server` might be using cookies.
        // We should probably use a service role client or ensure the RLS allows it?
        // Wait, the migrations set up RLS. Webhooks run server-side.
        // Best practice: Use `createClient` with SERVICE_ROLE_KEY for admin tasks, or `postgres` direct access.
        // BUT, usually in these starter kits, we might not have exposed a service role client helper yet.
        // Let's check `lib/supabase/server.ts` later. For now, assuming we might need to use `SUPABASE_SERVICE_ROLE_KEY`.

        // We'll try to use the `createAdminClient` or just `createClient` with manual env if needed.
        // For now, I'll assume we can import a service client or make one.
        // Let's implement the logic assuming `adminDb` is available.

        // TEMPORARY: I will import `createClient` from `@supabase/supabase-js` to use the Service Key directly here to bypass RLS issues for webhooks.
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const adminDb = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        try {
            switch (event.type) {
                case 'product.created':
                case 'product.updated':
                    await upsertProductRecord(event.data.object as Stripe.Product, adminDb);
                    break;
                case 'price.created':
                case 'price.updated':
                    await upsertPriceRecord(event.data.object as Stripe.Price, adminDb);
                    break;
                case 'product.deleted':
                    await deleteProductRecord(event.data.object as Stripe.Product, adminDb);
                    break;
                case 'price.deleted':
                    await deletePriceRecord(event.data.object as Stripe.Price, adminDb);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    const subscription = event.data.object as Stripe.Subscription;
                    await manageSubscriptionStatusChange(
                        subscription.id,
                        subscription.customer as string,
                        event.type === 'customer.subscription.created',
                        adminDb
                    );
                    break;
                case 'checkout.session.completed':
                    const checkoutSession = event.data.object as Stripe.Checkout.Session;
                    if (checkoutSession.mode === 'subscription') {
                        const subscriptionId = checkoutSession.subscription;
                        await manageSubscriptionStatusChange(
                            subscriptionId as string,
                            checkoutSession.customer as string,
                            true,
                            adminDb
                        );
                    }
                    break;
                default:
                    throw new Error('Unhandled relevant event!');
            }
        } catch (error) {
            console.log(error);
            return new Response('Webhook handler failed. View logs.', { status: 400 });
        }
    }

    return new Response(JSON.stringify({ received: true }));
}

async function upsertProductRecord(product: Stripe.Product, supabase: any) {
    const productData = {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? undefined,
        image: product.images?.[0] ?? null,
        metadata: product.metadata
    };

    const { error } = await supabase.from('products').upsert([productData]);
    if (error) throw error;
    console.log(`Product inserted/updated: ${product.id}`);
}

async function upsertPriceRecord(price: Stripe.Price, supabase: any) {
    const priceData = {
        id: price.id,
        product_id: typeof price.product === 'string' ? price.product : '',
        active: price.active,
        currency: price.currency,
        description: price.nickname ?? undefined,
        type: price.type,
        unit_amount: price.unit_amount ?? undefined,
        interval: price.recurring?.interval,
        interval_count: price.recurring?.interval_count,
        trial_period_days: price.recurring?.trial_period_days,
        metadata: price.metadata
    };

    const { error } = await supabase.from('prices').upsert([priceData]);
    if (error) throw error;
    console.log(`Price inserted/updated: ${price.id}`);
}

async function deleteProductRecord(product: Stripe.Product, supabase: any) {
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) throw error;
    console.log(`Product deleted: ${product.id}`);
}

async function deletePriceRecord(price: Stripe.Price, supabase: any) {
    const { error } = await supabase.from('prices').delete().eq('id', price.id);
    if (error) throw error;
    console.log(`Price deleted: ${price.id}`);
}

async function manageSubscriptionStatusChange(
    subscriptionId: string,
    customerId: string,
    createAction = false,
    supabase: any
) {
    // Get customer's UUID from mapping table.
    const { data: customerData, error: noCustomerError } = await supabase
        .from('stripe_customers')
        .select('business_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (noCustomerError) throw noCustomerError;

    const { business_id } = customerData;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    }) as unknown as Stripe.Subscription;

    // Upsert the latest status of the subscription object.
    const subscriptionData = {
        id: subscription.id,
        business_id: business_id,
        metadata: subscription.metadata,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        //TODO check quantity on subscription
        // @ts-ignore
        quantity: subscription.quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at) : null,
        canceled_at: subscription.canceled_at ? toDateTime((subscription as any).canceled_at) : null,
        current_period_start: toDateTime((subscription as any).current_period_start),
        current_period_end: toDateTime((subscription as any).current_period_end),
        created: toDateTime(subscription.created),
        ended_at: subscription.ended_at ? toDateTime((subscription as any).ended_at) : null,
        trial_start: subscription.trial_start ? toDateTime((subscription as any).trial_start) : null,
        trial_end: subscription.trial_end ? toDateTime((subscription as any).trial_end) : null
    };

    const { error } = await supabase
        .from('subscriptions')
        .upsert([subscriptionData]);
    if (error) throw error;
    console.log(`Inserted/updated subscription [${subscription.id}] for business [${business_id}]`);

    // For a new subscription copy the billing details to the customer object.
    // NOTE: This might be valuable for storing payment methods etc.
    if (createAction && subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
        // await copyBillingDetailsToCustomer(...)
    }
}

const toDateTime = (secs: number) => {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t.toISOString();
};
