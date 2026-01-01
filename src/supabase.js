import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1:1 Debug Connection Test (User requested)
if (import.meta.env.DEV) {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/topics`, {
        headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
    })
        .then(res => res.json())
        .then(data => {
            console.log('Supabase 1:1 Connection Test Result:', data);
        })
        .catch(err => console.error('Supabase 1:1 Connection Error:', err));
}
