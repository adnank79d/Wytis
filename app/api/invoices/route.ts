
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema Validation
const ItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    gst_rate: z.number().nonnegative().max(100), // Percentage usually
});

const InvoiceSchema = z.object({
    business_id: z.string().uuid(),
    customer_id: z.string().uuid().optional(), // NEW: Link to Customer
    invoice_number: z.string().min(1),
    customer_name: z.string().min(1),
    invoice_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    items: z.array(ItemSchema).min(1),
});

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Parse & Validate Input
        const body = await request.json();
        const result = InvoiceSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid Input', details: result.error.issues },
                { status: 400 }
            );
        }

        const { business_id, customer_id, invoice_number, customer_name, invoice_date, items } = result.data;

        // 3. Verify Business Membership
        const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .select('role')
            .eq('business_id', business_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json(
                { error: 'Forbidden: You do not have access to this business.' },
                { status: 403 }
            );
        }

        // 3.5. Enforce Trial / Subscription Status
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('trial_ends_at, subscription_status')
            .eq('id', business_id)
            .single();

        if (businessError || !business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const isPaid = business.subscription_status === 'paid';
        const isTrialActive = business.subscription_status === 'active' &&
            new Date(business.trial_ends_at) > new Date();

        if (!isPaid && !isTrialActive) {
            return NextResponse.json(
                { error: 'Trial expired. Please upgrade to continue creating invoices.' },
                { status: 403 }
            );
        }

        // 3.6 Verify Customer Ownership (if provided)
        if (customer_id) {
            const { count } = await supabase
                .from('customers')
                .select('id', { count: 'exact', head: true })
                .eq('id', customer_id)
                .eq('business_id', business_id);

            if (count === 0) {
                return NextResponse.json(
                    { error: 'Invalid Customer ID. Customer does not belong to this business.' },
                    { status: 400 }
                );
            }
        }

        // 4. Server-Side Calculations
        let subtotal = 0;
        let totalGst = 0;
        const processedItems = items.map((item) => {
            // Logic: line_total = qty * price
            // This is the taxable value. GST is on top? Or inclusive?
            // Standard B2B accounting usually implies exclusive unit_price, tax added on top.
            // Let's assume Unit Price is Exclusive of Tax for this calculation.

            const lineAmount = item.quantity * item.unit_price;
            const gstAmount = lineAmount * (item.gst_rate / 100);

            subtotal += lineAmount;
            totalGst += gstAmount;

            return {
                ...item,
                line_total: lineAmount, // Store the taxable value
                calculated_gst: gstAmount
            };
        });

        const totalAmount = subtotal + totalGst;

        // 5. Database Operations
        // Step A: Insert Invoice as DRAFT (Safety Lock)
        // If we crash after this, no ledger entries are created because status is 'draft'.

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                business_id,
                customer_id: customer_id || null, // Optional Link
                invoice_number,
                customer_name,
                invoice_date,
                subtotal: subtotal,
                gst_amount: totalGst,
                total_amount: totalAmount,
                status: 'draft', // Important!
            })
            .select('id')
            .single();

        if (invoiceError) {
            console.error('Invoice Creation Error:', invoiceError);
            return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
        }

        // Step B: Insert Invoice Items
        const itemsToInsert = processedItems.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            gst_rate: item.gst_rate,
            line_total: item.line_total,
        }));

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Invoice Items Error:', itemsError);
            // Optional: We could try to delete the draft invoice here to clean up.
            // But 'Draft' state is a valid "failed/incomplete" state for user to resume. 
            // So we leave it as draft.
            return NextResponse.json(
                { error: 'Failed to save items. Invoice saved as draft.', invoice_id: invoice.id },
                { status: 500 }
            );
        }

        // Step C: Mark as ISSUED (Trigger Automation)
        // This is the "Commit" phase for accounting.
        const { error: statusError } = await supabase
            .from('invoices')
            .update({ status: 'issued' })
            .eq('id', invoice.id);

        if (statusError) {
            console.error('Status Update Error:', statusError);
            return NextResponse.json(
                { error: 'Failed to issue invoice. Saved as draft.', invoice_id: invoice.id },
                { status: 500 }
            );
        }

        // 6. Success Response
        return NextResponse.json({
            invoice_id: invoice.id,
            invoice_number,
            total_amount: totalAmount,
            status: 'issued',
        });

    } catch (err) {
        console.error('Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
