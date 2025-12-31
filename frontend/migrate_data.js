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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('XATOLIK: .env faylida VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY topilmadi.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        console.log(`Mavzu ustida ishlanmoqda: ${mavzuKey}`);

        // Mavzu nomidan raqamni ajratib olish mumkin yoki shunday qoldirish
        // "1-mavzu" -> name: "1-mavzu"

        // Mavzuni yaratish yoki borini olish
        let topicId;
        const { data: existingTopic, error: findError } = await supabase
            .from('topics')
            .select('id')
            .eq('name', mavzuKey)
            .single();

        if (existingTopic) {
            topicId = existingTopic.id;
        } else {
            const { data: newTopic, error: createError } = await supabase
                .from('topics')
                .insert([{ name: mavzuKey, description: `${mavzuKey} bo'yicha savollar` }])
                .select()
                .single();

            if (createError) {
                console.error(`Mavzu yaratishda xato (${mavzuKey}):`, createError.message);
                continue;
            }
            topicId = newTopic.id;
        }

        // Savollarni massivga aylantirish
        const questionsToInsert = [];

        // savollarObj = { "1": { savol: "...", javoblar: [], ... }, "2": ... }
        for (const [qNum, qData] of Object.entries(savollarObj)) {
            // Javoblar massivini to'g'rilash (ba'zida string bo'lishi mumkin)
            let choices = qData.javoblar;
            if (typeof choices === 'string') {
                // Agar string bo'lsa, ehtimol parse qilish kerakdir, lekin JSON da array ko'rindi.
                // Ehtiyot shart tekshiramiz.
            }

            questionsToInsert.push({
                topic_id: topicId,
                text: qData.savol,
                choices: choices,
                correct_answer_index: parseInt(qData.togri), // Index 0 dan boshlanadimi yoki 1 dan?
                // JSON da `togri` 0, 1, 2, 3 kabi indexlar ishlatilgan.
                // Supabase ga ham integer sifatida saqlaymiz.
                image_url: qData.rasm
            });
        }

        if (questionsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('questions')
                .insert(questionsToInsert);

            if (insertError) {
                console.error(`Savollarni yuklashda xato (${mavzuKey}):`, insertError.message);
            } else {
                console.log(`${questionsToInsert.length} ta savol yuklandi (${mavzuKey}).`);
            }
        }
    }

    console.log('Migratsiya tugadi!');
}

migrate();
