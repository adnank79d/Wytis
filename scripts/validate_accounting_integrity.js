
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('ACCOUNTING DATA INTEGRITY VALIDATION');
    console.log('='.repeat(80));
    console.log(`Business ID: ${businessId}\n`);

    let hasErrors = false;

    // CHECK 1: Duplicate Transactions
    console.log('1. Checking for duplicate transactions...');
    const { data: duplicateTxns } = await supabase.rpc('find_duplicate_transactions', {
        p_business_id: businessId
    }).catch(() => ({ data: null }));

    // Fallback manual check if RPC doesn't exist
    const { data: allTxns } = await supabase
        .from('transactions')
        .select('source_type, source_id, business_id')
        .eq('business_id', businessId);

    const txnMap = {};
    const duplicates = [];
    allTxns?.forEach(t => {
        const key = `${t.source_type}:${t.source_id}`;
        if (txnMap[key]) {
            duplicates.push(key);
        } else {
            txnMap[key] = true;
        }
    });

    if (duplicates.length > 0) {
        console.log(`   ❌ Found ${duplicates.length} duplicate transactions!`);
        duplicates.forEach(d => console.log(`      - ${d}`));
        hasErrors = true;
    } else {
        console.log('   ✅ No duplicate transactions');
    }

    // CHECK 2: Unbalanced Ledger Entries
    console.log('\n2. Checking ledger balance (debits = credits per transaction)...');
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('business_id', businessId);

    let unbalancedCount = 0;
    for (const txn of transactions || []) {
        const { data: entries } = await supabase
            .from('ledger_entries')
            .select('debit, credit')
            .eq('transaction_id', txn.id);

        const totalDebit = entries?.reduce((sum, e) => sum + Number(e.debit), 0) || 0;
        const totalCredit = entries?.reduce((sum, e) => sum + Number(e.credit), 0) || 0;

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.log(`   ❌ Transaction ${txn.id}: Dr ₹${totalDebit} ≠ Cr ₹${totalCredit}`);
            unbalancedCount++;
            hasErrors = true;
        }
    }

    if (unbalancedCount === 0) {
        console.log('   ✅ All transactions balanced');
    } else {
        console.log(`   ❌ Found ${unbalancedCount} unbalanced transactions`);
    }

    // CHECK 3: Negative Balances (AR/AP should never be negative)
    console.log('\n3. Checking for negative balances...');
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', businessId);

    const balances = {};
    ledger?.forEach(e => {
        if (!balances[e.account_name]) balances[e.account_name] = 0;
        balances[e.account_name] += Number(e.debit) - Number(e.credit);
    });

    const negativeBalances = [];
    ['Accounts Receivable', 'Inventory', 'Bank', 'Cash'].forEach(account => {
        if (balances[account] && balances[account] < -0.01) {
            negativeBalances.push({ account, balance: balances[account] });
        }
    });

    if (negativeBalances.length > 0) {
        console.log('   ❌ Found negative asset balances:');
        negativeBalances.forEach(b => {
            console.log(`      - ${b.account}: ₹${b.balance.toFixed(2)}`);
        });
        hasErrors = true;
    } else {
        console.log('   ✅ No negative asset balances');
    }

    // CHECK 4: GST in P&L
    console.log('\n4. Checking for GST leakage into P&L...');
    const gstAccounts = ['Output CGST', 'Output SGST', 'Output IGST', 'Input CGST', 'Input SGST', 'Input IGST', 'GST Payable'];

    const { data: plView } = await supabase
        .from('profit_and_loss_view')
        .select('account_name')
        .eq('business_id', businessId);

    const gstInPL = plView?.filter(row => gstAccounts.includes(row.account_name)) || [];

    if (gstInPL.length > 0) {
        console.log('   ❌ GST accounts found in P&L view:');
        gstInPL.forEach(row => console.log(`      - ${row.account_name}`));
        hasErrors = true;
    } else {
        console.log('   ✅ No GST accounts in P&L');
    }

    // CHECK 5: Orphaned Records
    console.log('\n5. Checking for orphaned records...');

    // Orphaned ledger entries (transaction doesn't exist)
    const { data: ledgerEntries } = await supabase
        .from('ledger_entries')
        .select('id, transaction_id')
        .eq('business_id', businessId);

    let orphanedLedger = 0;
    for (const entry of ledgerEntries || []) {
        const { data: txn } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', entry.transaction_id)
            .maybeSingle();

        if (!txn) orphanedLedger++;
    }

    if (orphanedLedger > 0) {
        console.log(`   ❌ Found ${orphanedLedger} orphaned ledger entries`);
        hasErrors = true;
    } else {
        console.log('   ✅ No orphaned ledger entries');
    }

    // SUMMARY
    console.log('\n' + '='.repeat(80));
    if (hasErrors) {
        console.log('❌ DATA INTEGRITY ISSUES FOUND');
        console.log('\nRecommended actions:');
        console.log('1. Run: node scripts/reset_financial_data.js');
        console.log('2. Apply SQL fixes: scripts/APPLY_ACCOUNTING_FIXES.sql');
        console.log('3. Test invoice flow: Create → Issue → Pay');
    } else {
        console.log('✅ ALL INTEGRITY CHECKS PASSED');
        console.log('\nYour accounting data is clean and audit-ready!');
    }
    console.log('='.repeat(80));
}

main().catch(console.error);
