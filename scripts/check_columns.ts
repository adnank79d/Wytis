
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
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns...");

    // In Supabase/Postgres we can't easily query information_schema via JS client on standard RLS connection usually,
    // unless we use an RPC or just try to select and see what happens.
    // Simpler: Just try to select * limit 1 and print keys.

    const { data: items, error: iErr } = await supabase.from('invoice_items').select('*').limit(1);
    if (items && items.length > 0) {
        console.log("Invoice Items Columns:", Object.keys(items[0]));
    } else if (items) {
        console.log("Invoice Items: Empty table, checking via error/insert test or just checking known props");
        // If empty, we can't see keys from data.
    } else {
        console.error("Invoice Items Error:", iErr?.message);
    }

    const { data: prod, error: pErr } = await supabase.from('products').select('*').limit(1);
    if (prod && prod.length > 0) {
        console.log("Products Columns:", Object.keys(prod[0]));
    } else {
        console.error("Products Error:", pErr?.message);
    }
}

checkColumns();
