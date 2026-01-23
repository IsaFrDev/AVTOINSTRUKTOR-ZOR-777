
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function inspectUsers() {
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(users, null, 2));
}

inspectUsers();
