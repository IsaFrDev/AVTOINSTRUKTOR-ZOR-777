
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runDiagnostics() {
    console.log('--- Supabase Diagnostics ---');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key Length:', supabaseAnonKey?.length);

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\n1. Testing ANON SELECT on topics...');
    const { data: topics, error: topicsError } = await anonClient.from('topics').select('*').limit(1);
    if (topicsError) console.error('ANON Topics Error:', topicsError);
    else console.log('ANON Topics Success:', topics.length, 'rows');

    console.log('\n2. Testing ANON SELECT on questions...');
    const { data: questions, error: questionsError } = await anonClient.from('questions').select('*').limit(1);
    if (questionsError) console.error('ANON Questions Error:', questionsError);
    else console.log('ANON Questions Success:', questions.length, 'rows');

    console.log('\n3. Testing SERVICE SELECT on profiles...');
    const { data: profiles, error: profilesError } = await serviceClient.from('profiles').select('*').limit(1);
    if (profilesError) console.error('SERVICE Profiles Error:', profilesError);
    else console.log('SERVICE Profiles Success:', profiles.length, 'rows');

    console.log('\n4. Checking RLS Policies (requires service key)...');
    const { data: policies, error: policiesError } = await serviceClient.rpc('get_policies'); // This might not work without a specific RPC

    // Alternative: raw query via postgrest (if rpc not available)
    const { data: rawPolicies, error: rawPoliciesError } = await serviceClient
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public');

    if (rawPoliciesError) {
        // pg_policies might not be accessible via postgrest directly
        console.log('Cannot check pg_policies via PostgREST, but that is expected.');
    } else {
        console.log('RLS Policies:', rawPolicies.map(p => `${p.tablename}: ${p.policyname}`).join(', '));
    }

    console.log('\n5. Testing intentional RLS violation (ANON INSERT into topics)...');
    const { error: insertError } = await anonClient.from('topics').insert({ name: 'Test' });
    if (insertError) console.log('Expected Error (RLS blocking ANON INSERT):', insertError.message);
    else console.log('CRITICAL: ANON could insert into topics!');

    console.log('\n--- Diagnostics Finished ---');
}

runDiagnostics();
