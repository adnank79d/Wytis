
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), '.env.local');
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '');
            env[key] = value;
        }
    });
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const logPath = path.resolve(process.cwd(), "debug_log.txt");
fs.writeFileSync(logPath, '');

function log(msg: any) {
    console.log(msg);
    fs.appendFileSync(logPath, String(msg) + '\n');
}

async function main() {
    log("--- CHECKING INVOICES ---");
    const { data: invoices, error } = await supabase.from('invoices').select('id, invoice_number, status, total_amount');
    if (invoices) {
        log(`Count: ${invoices.length}`);
        invoices.forEach(i => log(`[${i.status}] ${i.invoice_number}: ${i.total_amount}`));
    } else {
        log(`Error: ${error?.message}`);
    }

    log("\n--- CHECKING P&L ---");
    const { data: pnl } = await supabase.from('profit_and_loss_view').select('*');
    if (pnl) {
        pnl.forEach(r => log(`${r.category} | ${r.account_name}: ${r.net_amount}`));
    }

    log("\n--- CHECKING GST PAYABLE LEDGER ---");
    const { data: ledger } = await supabase.from('ledger_entries').select('debit, credit, account_name').eq('account_name', 'GST Payable');
    if (ledger) {
        let balance = 0;
        ledger.forEach(l => {
            balance += (Number(l.credit) - Number(l.debit));
            log(`Entry: +${l.credit} -${l.debit}`);
        });
        log(`Final GST Balance: ${balance}`);
    }
}
main();
