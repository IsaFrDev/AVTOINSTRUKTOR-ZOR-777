import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node.js environmentda .env o'qish (agar bu script alohida run qilinsa)
// Lekin biz to'g'ridan to'g'ri hardcode qilib turamiz yoki argument sifatida olamiz,
// chunki .env fayli frontend papkasida va bu script ham o'sha yerda bo'ladi.
// Yaxshisi, process.env dan o'qish uchun `dotenv` kerak, lekin biz oddiy qilib client yaratamiz.

// FOYDALANUVCHI: BU YERGA O'Z KEYLARINGIZNI QO'YISHINGIZ KERAK (agar .env ishlamasa)
// Yoki scriptni `node --env-file=.env migrate_data.js` deb yuriting (Node 20+)
// Biz hozircha .env dan o'qishga harakat qilamiz.

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key to bypass RLS during migration
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamN5cXZ6amthd2h3bHZ0anpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE3NTA3OCwiZXhwIjoyMDgyNzUxMDc4fQ.H6zQlsZ5G8Pf7U6GuoxWvZ6OfhWb-da43TsURKxs2dY";

if (!supabaseUrl) {
    console.error('XATOLIK: .env faylida VITE_SUPABASE_URL topilmadi.');
   process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('Migratsiya boshlanmoqda...');

    // 1. JSON faylni o'qish
    // savollar.json desktopda turibdi, frontend papkasidan bitta tepada
    const jsonPath = path.resolve(__dirname, '../savollar.json');

    if (!fs.existsSync(jsonPath)) {
        console.error(`Fayl topilmadi: ${jsonPath}`);
        return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    // 2. Mavzular va Savollarni yuklash
    for (const [mavzuKey, savollarObj] of Object.entries(data)) {
        console.log(`\n>>> Mavzu ustida ishlanmoqda: ${mavzuKey}`);

        let topicId;
        const { data: existingTopic, error: findError } = await supabase
            .from('topics')
            .select('id')
            .eq('name', mavzuKey)
            .maybeSingle();

        if (findError) {
            console.error(`XATOLIK: Mavzuni qidirishda xato (${mavzuKey}):`, findError.message);
            continue;
        }

        if (existingTopic) {
            console.log(`Mavzu allaqachon mavjud: ${mavzuKey} (ID: ${existingTopic.id})`);
            topicId = existingTopic.id;
        } else {
            const { data: newTopic, error: createError } = await supabase
                .from('topics')
                .insert([{ name: mavzuKey, description: `${mavzuKey} bo'yicha savollar` }])
                .select()
                .single();

            if (createError) {
                console.error(`XATOLIK: Mavzu yaratishda xato (${mavzuKey}):`, createError.message);
                if (createError.message.includes('row-level security')) {
                    console.error("DIQQAT: RLS (Row Level Security) tufayli ma'lumot qo'shib bo'lmadi. Service Role Key ishlating yoki RLSni vaqtincha o'chiring.");
                    return; // Stop migration if RLS blocks us
                }
                continue;
            }
            topicId = newTopic.id;
            console.log(`Yangi mavzu yaratildi: ${mavzuKey} (ID: ${topicId})`);
        }

        const questionsToInsert = [];
        for (const [qNum, qData] of Object.entries(savollarObj)) {
            questionsToInsert.push({
                topic_id: topicId,
                text: qData.savol,
                choices: qData.javoblar,
                correct_answer_index: parseInt(qData.togri),
                image_url: qData.rasm
            });
        }

        if (questionsToInsert.length > 0) {
            console.log(`${questionsToInsert.length} ta savol yuklanmoqda...`);
            // Insert in chunks if too many? 7000 is a lot.
            // Let's do it in chunks of 100.
            const chunkSize = 100;
            for (let i = 0; i < questionsToInsert.length; i += chunkSize) {
                const chunk = questionsToInsert.slice(i, i + chunkSize);
                const { error: insertError } = await supabase
                    .from('questions')
                    .insert(chunk);

                if (insertError) {
                    console.error(`XATOLIK: Savollarni yuklashda xato (${mavzuKey}, chunk ${i / chunkSize}):`, insertError.message);
                } else {
                    process.stdout.write('.'); // Progress indicator
                }
            }
            console.log(`\n${mavzuKey} uchun barcha savollar tugadi.`);
        }
    }

    console.log('\n\nMigratsiya muvaffaqiyatli yakunlandi!');
}

migrate();
