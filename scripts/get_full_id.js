
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: b } = await supabase.from('businesses').select('id, name');
    const target = b.find(x => x.id.startsWith('3c82b7cd'));
    if (target) {
        console.log(`FULL ID: ${target.id}`);
        console.log(`NAME: ${target.name}`);
    } else {
        console.log('Not found');
    }
}

main().catch(console.error);
