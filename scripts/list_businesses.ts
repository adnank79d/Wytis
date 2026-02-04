
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name, created_at');

    if (error) {
        throw error;
    }

    console.table(businesses);
}

main().catch(console.error);
