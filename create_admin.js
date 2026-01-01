import { createClient } from '@supabase/supabase-js';

// Hardcoded for reliability during recovery
const supabaseUrl = 'https://vqjcyqvzjkawhwlvtjzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamN5cXZ6amthd2h3bHZ0anpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzUwNzgsImV4cCI6MjA4Mjc1MTA3OH0.B6ssLCFu2Ty0xPQBUK0iQlhBMooLx2LRsGq7v-wJsRE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createUser = async () => {
    const email = 'admin_recovery@avto.uz';
    const password = 'password123';

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: 'admin',
                first_name: 'Admin',
                last_name: 'User',
                is_admin: true,
                limit_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
            }
        }
    });

    if (error) {
        console.log("ERR_MSG:", error.message);
        return;
    }
    console.log('NOTE: Since we are using the public SignUp API, you might need to confirm your email if "Confirm Email" is enabled in Supabase.');
    console.log('However, for local development/testing, you can likely login immediately.');
};

createUser();
