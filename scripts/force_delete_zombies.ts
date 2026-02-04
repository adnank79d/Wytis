
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

async function forceDelete() {
    const invoiceNumbers = ['INV-404824', 'INV-000001'];
    console.log(`Force deleting invoices: ${invoiceNumbers.join(', ')} ...`);

    // 1. Get IDs first to clean related data manually if cascades fail (though cascades are ON)
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .in('invoice_number', invoiceNumbers);

    if (!invoices || invoices.length === 0) {
        console.log("No zombies found. They might be gone properly.");
        return;
    }

    const ids = invoices.map(i => i.id);
    console.log(`Found IDs: ${ids.join(', ')}`);

    // 2. Delete Invoices (Cascades should handle items, transactions? Maybe not transactions due to polymorphic relation)
    // Transactions and GST records need explicit deletion usually if constraints aren't perfect cascade for polymorphic.
    // Our previous cleaning script handled orphans, so if we delete invoice, the transactions become orphans.
    // Let's delete transactions first to be clean.

    // Delete Transactions linked to these invoices
    const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('source_type', 'invoice')
        .in('source_id', ids);

    if (txError) console.error("Error deleting transactions:", txError.message);
    else console.log("Deleted associated transactions.");

    // Delete GST Records
    const { error: gstError } = await supabase
        .from('gst_records')
        .delete()
        .eq('source_type', 'invoice')
        .in('source_id', ids);

    if (gstError) console.error("Error deleting GST records:", gstError.message);
    else console.log("Deleted associated GST records.");

    // Finally delete invoices
    const { error: invError } = await supabase
        .from('invoices')
        .delete()
        .in('id', ids);

    if (invError) {
        console.error("Error deleting invoices:", invError.message);
    } else {
        console.log("SUCCESS: Invoices deleted.");
    }
}

forceDelete();
