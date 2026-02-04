
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("Checking 'products' table...");
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (productsError) console.error('Error fetching products:', productsError.message);
    else console.log('Products sample:', products);

    console.log("\nChecking 'inventory_products' table...");
    const { data: invProducts, error: invError } = await supabase
        .from('inventory_products')
        .select('*')
        .limit(1);

    if (invError) console.error('Error fetching inventory_products:', invError.message);
    else console.log('Inventory Products sample:', invProducts);
}

checkTables();
