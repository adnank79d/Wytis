
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ropeqwybizgtodkrabbp.supabase.co";
const supabaseKey = "process.env.SUPABASE_SERVICE_ROLE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCategories() {
    console.log("Seeding categories...");
    const { data: businesses } = await supabase.from('businesses').select('id').limit(1);

    if (!businesses || businesses.length === 0) {
        console.log("No businesses found.");
        return;
    }

    const businessId = businesses[0].id;
    const defaults = ['Electronics', 'Office Supplies', 'Furniture', 'Raw Materials', 'Services'];

    for (const name of defaults) {
        // Check if exists
        const { data } = await supabase.from('inventory_categories').select('id').eq('business_id', businessId).eq('name', name).maybeSingle();
        if (!data) {
            await supabase.from('inventory_categories').insert({ business_id: businessId, name });
            console.log(`Created: ${name}`);
        } else {
            console.log(`Exists: ${name}`);
        }
    }
    console.log("Done.");
}

seedCategories();
