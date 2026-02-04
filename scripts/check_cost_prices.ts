
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ropeqwybizgtodkrabbp.supabase.co";
const supabaseKey = "process.env.SUPABASE_SERVICE_ROLE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCostPrices() {
    console.log("Checking inventory product cost prices...");

    const { data: products, error } = await supabase
        .from('inventory_products')
        .select('id, name, cost_price, unit_price');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    if (!products || products.length === 0) {
        console.log("No products found.");
        return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
        console.log(`- [${p.name}] Cost: ${p.cost_price}, Sell: ${p.unit_price} (ID: ${p.id})`);
    });
}

checkCostPrices();
