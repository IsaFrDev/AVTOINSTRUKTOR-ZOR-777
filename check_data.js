import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { count: topicCount } = await supabase.from('topics').select('*', { count: 'exact', head: true });
    const { count: questionCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(1);

    console.log(`Topics: ${topicCount}`);
    console.log(`Questions: ${questionCount}`);
    if (profileError) {
        console.error(`Profile Fetch Error: ${profileError.message} (${profileError.code})`);
    } else {
        console.log(`Profiles: Success (got ${profiles.length} row)`);
    }
}

check();
