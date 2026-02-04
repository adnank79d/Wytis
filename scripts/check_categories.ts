
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ropeqwybizgtodkrabbp.supabase.co";
const supabaseKey = "process.env.SUPABASE_SERVICE_ROLE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    // 1. Get the first business (assuming single user context for now, or just list all)
    console.log("Checking businesses...");
    const { data: businesses } = await supabase.from('businesses').select('id, name').limit(1);

    if (!businesses || businesses.length === 0) {
        console.log("No businesses found.");
        return;
    }

    const businessId = businesses[0].id;
    console.log(`Checking categories for business: ${businesses[0].name} (${businessId})`);

    const { data: categories, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('business_id', businessId);

    if (error) {
        console.error("Error fetching categories:", error);
    } else {
        console.log(`Found ${categories.length} categories:`);
        categories.forEach(c => console.log(`- ${c.name} (${c.id})`));
    }
}

checkCategories();
