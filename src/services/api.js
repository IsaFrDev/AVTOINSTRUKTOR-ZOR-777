import { supabase } from '../supabase';

// Quiz API functions using Supabase
export const quizApi = {
    // Barcha mavzularni olish
    getTopics: async () => {
        const { data, error } = await supabase
            .from('topics')
            .select('*, questions(id)')
            .order('id');

        if (error) throw error;
        // Map to match the expected format { id, title, order, questions_count }
        return data.map(t => ({
            ...t,
            title: t.name,
            questions_count: t.questions?.length || 0
        }));
    },

    // Bitta mavzu haqida ma'lumot (savollar bilan birga)
    getTopic: async (topicId) => {
        const { data, error } = await supabase
            .from('topics')
            .select('*, questions(*)')
            .eq('id', topicId)
            .single();

        if (error) throw error;
        return {
            ...data,
            title: data.name,
            questions_count: data.questions?.length || 0
        };
    },

    // Mavzu bo'yicha savollar
    getTopicQuestions: async (topicId) => {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('topic_id', topicId);

        if (error) throw error;
        return data;
    },

    // Mavzu bo'yicha quiz (20 ta aralashtrilgan savol)
    getTopicQuiz: async (topicId) => {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('topic_id', topicId);

        if (error) throw error;

        // Shuffle and limit to 20
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return {
            questions: shuffled.slice(0, 20).map(q => ({
                ...q,
                question_text: q.text // Frontend expects question_text
            }))
        };
    },

    // Barcha savollar
    getQuestions: async () => {
        const { data, error } = await supabase
            .from('questions')
            .select('*');

        if (error) throw error;
        return data.map(q => ({
            ...q,
            question_text: q.text
        }));
    },

    // Bitta savol
    getQuestion: async (questionId) => {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();

        if (error) throw error;
        return {
            ...data,
            question_text: data.text
        };
    },

    // Imtihon rejimi (barcha mavzulardan aralash 20 ta)
    getExamQuestions: async () => {
        const { data, error } = await supabase
            .from('questions')
            .select('*');

        if (error) throw error;

        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return {
            questions: shuffled.slice(0, 20).map(q => ({
                ...q,
                question_text: q.text
            }))
        };
    },

    // Random savollar
    getRandomQuestions: async (count = 10) => {
        const { data, error } = await supabase
            .from('questions')
            .select('*');

        if (error) throw error;

        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return {
            questions: shuffled.slice(0, count).map(q => ({
                ...q,
                question_text: q.text
            }))
        };
    },

    // Topic bo'yicha savollar (query params bilan)
    getQuestionsByTopic: async (topicId, limit = 20, shuffle = true) => {
        let query = supabase
            .from('questions')
            .select('*')
            .eq('topic_id', topicId);

        const { data, error } = await query;
        if (error) throw error;

        let result = data;
        if (shuffle) {
            result = [...data].sort(() => 0.5 - Math.random());
        }

        return result.slice(0, limit);
    }
};

export const API_BASE_URL = '';
const api = {
    get: () => Promise.resolve({ data: [] }),
    post: () => Promise.resolve({ data: {} }),
    put: () => Promise.resolve({ data: {} }),
    delete: () => Promise.resolve({ data: {} }),
};
export default api;