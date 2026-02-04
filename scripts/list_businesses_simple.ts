
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name');

    if (error) throw error;

    businesses.forEach(b => {
        console.log(`ID: ${b.id} | Name: ${b.name}`);
    });
}

main().catch(console.error);
