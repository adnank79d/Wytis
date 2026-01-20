'use server'

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
    id: string;
    type: 'invoice' | 'customer';
    title: string;
    subtitle: string;
    url: string;
};

export async function searchGlobal(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get Business ID
    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .single();

    if (!membership) return [];

    const businessId = membership.business_id;
    const sanitizedQuery = query.trim();

    // Parallel Queries
    // 1. Invoices (by invoice_number or customer_name)
    // using ‘ilike’ for case-insensitive partial match
    const invoicesPromise = supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, total_amount, status')
        .eq('business_id', businessId)
        .or(`invoice_number.ilike.%${sanitizedQuery}%,customer_name.ilike.%${sanitizedQuery}%`)
        .limit(5);

    // 2. Customers (by name or email)
    const customersPromise = supabase
        .from('customers')
        .select('id, name, email')
        .eq('business_id', businessId)
        .or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
        .limit(5);

    const [invoicesRes, customersRes] = await Promise.all([invoicesPromise, customersPromise]);

    const results: SearchResult[] = [];

    // Process Invoices
    if (invoicesRes.data) {
        invoicesRes.data.forEach(inv => {
            results.push({
                id: inv.id,
                type: 'invoice',
                title: inv.invoice_number,
                subtitle: `${inv.customer_name} • $${inv.total_amount}`,
                url: `/invoices/${inv.id}`
            });
        });
    }

    // Process Customers
    if (customersRes.data) {
        customersRes.data.forEach(cust => {
            results.push({
                id: cust.id,
                type: 'customer',
                title: cust.name,
                subtitle: cust.email || 'No email',
                url: `/crm/customers/${cust.id}` // Assumption: CRM route structure
            });
        });
    }

    return results;
}
