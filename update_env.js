import fs from 'fs';
const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamN5cXZ6amthd2h3bHZ0anpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzUwNzgsImV4cCI6MjA4Mjc1MTA3OH0.B6ssLCFu2Ty0xPQBUK0iQlhBMooLx2LRsGq7v-wJsRE";

if (content.includes('VITE_SUPABASE_ANON_KEY')) {
    content = content.replace(/VITE_SUPABASE_ANON_KEY=.*/, `VITE_SUPABASE_ANON_KEY=${newKey}`);
} else {
    content += `\nVITE_SUPABASE_ANON_KEY=${newKey}`;
}

fs.writeFileSync(envPath, content);
console.log('Successfully updated VITE_SUPABASE_ANON_KEY');
