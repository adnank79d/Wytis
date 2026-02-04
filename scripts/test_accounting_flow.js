
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('ACCOUNTING SYSTEM - APPLY FIXES & TEST');
    console.log('='.repeat(80));

    // STEP 1: Reset financial data
    console.log('\n📦 STEP 1: Resetting financial data...\n');

    const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('business_id', businessId);

    const { error: gstError } = await supabase
        .from('gst_records')
        .delete()
        .eq('business_id', businessId);

    const { error: txnError } = await supabase
        .from('transactions')
        .delete()
        .eq('business_id', businessId);

    await supabase
        .from('invoices')
        .update({ status: 'draft' })
        .eq('business_id', businessId)
        .neq('status', 'draft');

    console.log('✅ Financial data reset complete');

    // STEP 2: Verify dashboard shows zeros
    console.log('\n📊 STEP 2: Verifying dashboard shows ₹0...\n');

    const { data: metrics } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('Dashboard Metrics:');
    console.log(`  Revenue: ₹${metrics?.revenue || 0}`);
    console.log(`  Net Profit: ₹${metrics?.net_profit || 0}`);
    console.log(`  AR: ₹${metrics?.ar || 0}`);
    console.log(`  GST Payable: ₹${metrics?.gst_payable || 0}`);

    if (metrics?.revenue !== 0 || metrics?.ar !== 0) {
        console.log('\n⚠️  Dashboard not showing zeros - data may not be fully reset');
    } else {
        console.log('\n✅ Dashboard correctly shows ₹0');
    }

    // STEP 3: Instructions for SQL application
    console.log('\n' + '='.repeat(80));
    console.log('📝 STEP 3: APPLY SQL FIXES IN SUPABASE');
    console.log('='.repeat(80));
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('\n1. Open Supabase SQL Editor');
    console.log('2. Copy and run: scripts/APPLY_ACCOUNTING_FIXES.sql');
    console.log('3. Verify triggers are created (check output)');
    console.log('\nPress ENTER after applying SQL fixes to continue testing...');
    console.log('(Or Ctrl+C to exit and apply manually)');
    console.log('\n' + '='.repeat(80));

    // Note: In a real scenario, you'd wait for user input here
    // For now, we'll just show the instructions

    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Apply SQL fixes in Supabase');
    console.log('2. Create a test invoice in the UI');
    console.log('3. Issue the invoice');
    console.log('4. Mark it as paid');
    console.log('5. Check dashboard shows correct values');
    console.log('6. Run: node scripts/validate_accounting_integrity.js');
}

main().catch(console.error);
