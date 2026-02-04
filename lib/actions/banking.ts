'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export type BankTransaction = {
    id: string;
    date: string;
    amount: number;
    description: string;
    reference: string | null;
    status: 'unmatched' | 'matched' | 'ignored';
    match?: {
        ledger_transaction_id: string;
        matched_at: string;
    };
};

export type LedgerCandidate = {
    id: string;
    date: string;
    amount: number;
    description: string;
    type: 'debit' | 'credit';
};

// ============================================================================
// HELPER: Context
// ============================================================================

async function getBusinessContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    return membership ? { supabase, businessId: membership.business_id } : null;
}

// ============================================================================
// ACTIONS
// ============================================================================

// 1. Get Transactions
export async function getBankTransactions(status: 'all' | 'unmatched' | 'matched' = 'all') {
    const context = await getBusinessContext();
    if (!context) return [];
    const { supabase, businessId } = context;

    let query = supabase
        .from('bank_transactions')
        .select(`
            id,
            transaction_date,
            amount,
            description,
            reference_id,
            status,
            match:bank_reconciliations(ledger_transaction_id, matched_at)
        `)
        .eq('business_id', businessId)
        .order('transaction_date', { ascending: false });

    if (status !== 'all') {
        query = query.eq('status', status);
    }

    const { data } = await query;
    return (data || []).map((t: any) => ({
        id: t.id,
        date: t.transaction_date,
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference_id,
        status: t.status,
        match: t.match?.[0] || null
    }));
}

// 2. Import Mock Statement (For Testing)
export async function importMockStatement() {
    const context = await getBusinessContext();
    if (!context) return { success: false };
    const { supabase, businessId } = context;

    // Create some dummy entries that might match existing invoices/expenses
    // Ideally we'd look at real ledger entries and create matching "bank" lines
    const { data: recentLedger } = await supabase
        .from('transactions')
        .select('amount, transaction_date, description')
        .eq('business_id', businessId)
        .limit(5);

    const newTransactions = (recentLedger || []).map((l: any, i: number) => ({
        business_id: businessId,
        bank_account_name: 'HDFC Primary',
        transaction_date: l.transaction_date,
        amount: l.amount, // Exact match
        description: `BANK TFR: ${l.description}`,
        reference_id: `UTR${Date.now()}${i}`,
        status: 'unmatched'
    }));

    // Add a random unmatched one
    newTransactions.push({
        business_id: businessId,
        bank_account_name: 'HDFC Primary',
        transaction_date: new Date().toISOString().split('T')[0],
        amount: 500.00,
        description: 'Bank Charges',
        reference_id: `CHG${Date.now()}`,
        status: 'unmatched'
    });

    const { error } = await supabase.from('bank_transactions').insert(newTransactions);

    revalidatePath('/banking/reconcile');
    return { success: !error, message: error ? error.message : 'Imported mock statement.' };
}

// 3. Find Matches (Auto-Match Logic)
export async function findMatchesFor(bankTxId: string) {
    const context = await getBusinessContext();
    if (!context) return [];
    const { supabase, businessId } = context;

    // Get the bank tx details
    const { data: bankTx } = await supabase.from('bank_transactions').select('*').eq('id', bankTxId).single();
    if (!bankTx) return [];

    // Find ledger entries with same amount
    // In real world, we'd check date range +/- 3 days
    // System transactions (ledger) amount is absolute in 'transactions' table usually?
    // Let's check `transactions` table. It has `amount` and `type` (debit/credit)? 
    // Wait, transactions table usually aggregates matches.

    // We look for UNRECONCILED ledger transactions.
    // i.e. NOT IN bank_reconciliations

    const { data: ledgerEntries } = await supabase
        .from('transactions')
        .select('id, transaction_date, amount, description, source_type') // Check if 'type' exists? Schema check needed.
        .eq('business_id', businessId)
        .eq('amount', bankTx.amount) // exact match for MVP
        .order('transaction_date', { ascending: false });

    // Filter out already reconciled ones
    // We can do this via a "not in" query but doing it in JS for simplicity on small datasets
    const list = [];
    for (const entry of (ledgerEntries || [])) {
        const { count } = await supabase.from('bank_reconciliations').select('id', { count: 'exact', head: true }).eq('ledger_transaction_id', entry.id);
        if (!count) {
            list.push({
                id: entry.id,
                date: entry.transaction_date,
                amount: entry.amount,
                description: entry.description,
                type: 'debit' // Placeholder, need to infer from source_type or verify schema
            });
        }
    }

    return list;
}

// 4. Reconcile (Link)
export async function reconcile(bankTxId: string, ledgerTxId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false };
    const { supabase, businessId } = context;
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('bank_reconciliations').insert({
        business_id: businessId,
        bank_transaction_id: bankTxId,
        ledger_transaction_id: ledgerTxId,
        matched_by: user?.id
    });

    if (!error) {
        await supabase.from('bank_transactions').update({ status: 'matched' }).eq('id', bankTxId);
        revalidatePath('/banking/reconcile');
        return { success: true };
    }

    return { success: false, message: error.message };
}
