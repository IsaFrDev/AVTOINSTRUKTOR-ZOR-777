import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, HelpCircle, Shield, Plus, Edit2, Trash2,
    Search, X, Check, Save, Calendar, BookOpen, Clock, AlertTriangle, ChevronRight, Filter,
    CheckCircle2, XCircle, MoreVertical, UserPlus, FileQuestion, RefreshCw, BarChart3, TrendingUp, Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const getTrans = (val, lang) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    const l = lang?.split('-')[0] || 'uz';
    return val[l] || val['uz'] || Object.values(val)[0] || '';
};

const AdminPanel = () => {
    const { t, i18n } = useTranslation();
    const getImageUrl = (url) => {
        if (!url) return null;

        // Supabase storage URL fix
        if (url.includes('supabase.co')) {
            // Agar protocol yo'q bo'lsa
            if (!url.startsWith('http')) {
                return `https://${url}`;
            }
            return url;
        }

        if (url.includes('img/') && url.includes('photo_')) {
            const clean = url.split('img/')[1];
            return `/img/${clean}`;
        }

        if (!url.startsWith('http') && !url.startsWith('/')) {
            if (url.startsWith('img/')) return `/${url}`;
            return `/img/${url}`;
        }

        return url;
    };

    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ users: [], questions: [], topics: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [successNotification, setSuccessNotification] = useState(null);
    const [editLang, setEditLang] = useState('uz'); // Modalda qaysi tilni tahrirlash
    const [copied, setCopied] = useState(false);

    // Form States
    const [userForm, setUserForm] = useState({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        limit_date: '',
        is_staff: false,
        is_active: true
    });

    const [questionForm, setQuestionForm] = useState({
        text: '',
        choices: ['', '', '', ''],
        correct_answer_index: 0,
        topic: '',
        image_url: ''
    });

    const [topicForm, setTopicForm] = useState({
        name: '',
        description: ''
    });

    // Helper: Normalize translation
    const normalizeTrans = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.uz || val.ru || val.en || Object.values(val)[0] || '';
    };

    // Helper: Normalize choices
    const normalizeChoices = (choices) => {
        if (!choices) return ['', '', '', ''];
        if (Array.isArray(choices)) return choices;
        // Search for choices in object if it comes from JSONB
        const found = choices.uz || choices.ru || choices.en || Object.values(choices)[0];
        if (Array.isArray(found)) return found;
        return ['', '', '', ''];
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, questionsRes, topicsRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('questions').select('*, topic:topics(name)'),
                supabase.from('topics').select('*, questions(count)')
            ]);

            // Transform topics to include question count if needed, 
            // though supabase select 'questions(count)' returns array of objects.
            // Better to just fetch simple and maybe map.
            // Simplified fetch:

            const { data: users, error: usersError } = await supabase.from('profiles').select('*');
            const { data: questions, error: questionsError } = await supabase.from('questions').select('*, topic:topics(name)');
            const { data: topics, error: topicsError } = await supabase.from('topics').select('*');

            if (usersError) console.error("Users fetch error:", usersError);
            if (questionsError) console.error("Questions fetch error:", questionsError);
            if (topicsError) console.error("Topics fetch error:", topicsError);

            // For topic question counts, we can do a separate query or handle it in UI.
            // Let's iterate topics to get counts.
            const topicsWithCount = topics ? await Promise.all(topics.map(async (topic) => {
                const { count } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('topic_id', topic.id);
                return { ...topic, questions: { length: count } };
            })) : [];

            setData({
                users: users || [],
                questions: questions?.map(q => ({
                    ...q,
                    topic_name: q.topic?.name // Endi q.topic?.name bu JSONB obyekt
                })) || [],
                topics: topicsWithCount || []
            });
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserStatus = (user) => {
        if (user.limit_date) {
            const limitDate = new Date(user.limit_date);
            if (limitDate < new Date()) {
                return { label: t('admin.status.expired'), color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} /> };
            }
        }
        return { label: t('admin.status.active'), color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={14} /> };
    };

    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            if (activeTab === 'users' || activeTab === 'admins') {
                setUserForm({
                    ...item,
                    password: item.password || '',
                    limit_date: item.limit_date ? item.limit_date.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });
            } else if (activeTab === 'questions') {
                setQuestionForm({
                    ...item,
                    text: normalizeTrans(item.text),
                    choices: normalizeChoices(item.choices),
                    topic: item.topic_id || data.topics[0]?.id
                });
            } else {
                setTopicForm({
                    ...item,
                    name: normalizeTrans(item.name),
                    description: normalizeTrans(item.description)
                });
            }
        } else {
            resetFormStates();
        }
        setEditLang('uz'); // Reset language to UZ when opening
        setIsModalOpen(true);
    };

    const resetFormStates = () => {
        const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setUserForm({
            username: '',
            first_name: '',
            last_name: '',
            password: '',
            limit_date: defaultDate,
            is_staff: activeTab === 'admins',
            is_active: true
        });
        setQuestionForm({
            text: '',
            choices: ['', '', '', ''],
            correct_answer_index: 0,
            topic: data.topics[0]?.id || '',
            image_url: ''
        });
        setTopicForm({
            name: '',
            description: ''
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'users' || activeTab === 'admins') {
                // Update profile only (cannot easily update auth user password via client without admin key)
                // For now, allow updating profile fields like limit_date.

                // VALIDATION: Password length
                if (userForm.password && userForm.password.length < 6) {
                    alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
                    return;
                }
                const payload = {
                    first_name: userForm.first_name,
                    last_name: userForm.last_name,
                    username: userForm.username,
                    password: userForm.password, // Maxsus Auth (Custom) uchun
                    limit_date: userForm.limit_date,
                    is_admin: userForm.is_staff
                };

                if (editingItem) {
                    await supabase.from('profiles').update(payload).eq('id', editingItem.id);
                } else {
                    // Yangi user yaratish (Profiles ga yozish)
                    // Eslatma: Bu user login qila olmaydi (Auth user yo'q), lekin ro'yxatda turadi.
                    // Login qilishi uchun Sign Up qilish kerak.
                    // Biz shunchaki "qo'lda" qo'shilgan user sifatida saqlaymiz.
                    const { error } = await supabase.from('profiles').insert([{
                        ...payload,
                        id: crypto.randomUUID(), // Fake ID generatsiya qilamiz
                        role: userForm.is_staff ? 'admin' : 'user'
                    }]);

                    if (error) throw error;

                    // Show success notification with user details
                    setSuccessNotification({
                        username: userForm.username,
                        password: userForm.password,
                        first_name: userForm.first_name,
                        last_name: userForm.last_name,
                        limit_date: userForm.limit_date,
                        is_admin: userForm.is_staff
                    });
                }
            } else if (activeTab === 'questions') {
                // Filter out empty choices as requested: "hamma javobni yozish shart emas"
                const cleanChoices = questionForm.choices.filter(c => c && c.trim() !== '');

                // Ensure at least 2 choices exist for a valid question
                if (cleanChoices.length < 2) {
                    alert('Kamida 2 ta javob varianti bo\'lishi kerak!');
                    return;
                }

                const payload = {
                    text: { uz: questionForm.text },
                    choices: { uz: cleanChoices },
                    correct_answer_index: Math.min(questionForm.correct_answer_index, cleanChoices.length - 1),
                    topic_id: questionForm.topic,
                    image_url: questionForm.image_url
                };
                if (editingItem) {
                    await supabase.from('questions').update(payload).eq('id', editingItem.id);
                } else {
                    await supabase.from('questions').insert([payload]);
                }
            } else if (activeTab === 'topics') {
                const payload = {
                    name: { uz: topicForm.name },
                    description: { uz: topicForm.description }
                };
                if (editingItem) {
                    await supabase.from('topics').update(payload).eq('id', editingItem.id);
                } else {
                    await supabase.from('topics').insert([payload]);
                }
            }
            resetFormStates();
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Save error details:', error);
            if (error.code === '23505') {
                alert('Xatolik: Bu foydalanuvchi nomi (username) allaqachon mavjud! Iltimos, boshqa nom tanlang.');
            } else {
                alert('Saqlashda xatolik yuz berdi: ' + (error.message || 'Noma\'lum xato'));
            }
        }
    };

    // Modals
    const [deleteModal, setDeleteModal] = useState({ open: false, type: null, id: null });

    const handleDeleteClick = (type, id) => {
        setDeleteModal({ open: true, type, id });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `questions/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('quiz_images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('quiz_images')
                .getPublicUrl(filePath);

            console.log('Original Public URL:', publicUrl);

            // Fix URL protocol if missing
            let finalUrl = publicUrl;
            if (!finalUrl.startsWith('http')) {
                finalUrl = `https://${finalUrl}`;
            }

            console.log('Final URL to save:', finalUrl);
            setQuestionForm({ ...questionForm, image_url: finalUrl });
        } catch (error) {
            console.error('Litsenziya rasmini yuklashda xatolik:', error);
            if (error.message?.includes('Bucket not found')) {
                alert('Xatolik: Supabase-da "quiz_images" papkasi (bucket) yaratilmagan. Iltimos, Supabase Dashboard-ga kiring va "quiz_images" nomli yangi Storage Bucket yarating (Public qilib).');
            } else {
                alert('Rasmni yuklay olmadim: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        const { type, id } = deleteModal;
        try {
            // Agar mavzu o'chirilsa, avval unga tegishli savollarni o'chiramiz (Manual Cascade Delete)
            if (type === 'topics') {
                const { error: questionsError } = await supabase
                    .from('questions')
                    .delete()
                    .eq('topic_id', id);

                if (questionsError) throw questionsError;
            }

            const table = type === 'users' ? 'profiles' : (type === 'questions' ? 'questions' : 'topics');
            const { error } = await supabase.from(table).delete().eq('id', id);

            if (error) throw error;

            fetchData();
            setDeleteModal({ open: false, type: null, id: null });
        } catch (error) {
            console.error('Delete error:', error);
            alert('Xatolik yuz berdi: ' + (error.message || 'Noma\'lum xato'));
        }
    };

    const handleCopyUserCredentials = () => {
        if (!successNotification) return;

        const text = `👤 Yangi foydalanuvchi qo'shildi!

📋 Ma'lumotlar:
• Ism: ${successNotification.first_name} ${successNotification.last_name}
• Login: ${successNotification.username}
• Parol: ${successNotification.password}
• Muddat: ${successNotification.limit_date}
• Role: ${successNotification.is_admin ? 'Admin' : 'User'}`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const filteredData = () => {
        const term = searchTerm.toLowerCase();
        if (activeTab === 'users') {
            return data.users.filter(u =>
                !u.is_admin && (u.username?.toLowerCase().includes(term) ||
                    (u.first_name + ' ' + u.last_name).toLowerCase().includes(term))
            );
        } else if (activeTab === 'admins') {
            return data.users.filter(u =>
                u.is_staff && (u.username.toLowerCase().includes(term) ||
                    (u.first_name + ' ' + u.last_name).toLowerCase().includes(term))
            );
        } else if (activeTab === 'questions') {
            return data.questions.filter(q =>
                (normalizeTrans(q.text).toLowerCase().includes(term)) ||
                (q.topic_name?.toLowerCase().includes(term))
            );
        } else if (activeTab === 'topics') {
            return data.topics.filter(topic =>
                (normalizeTrans(topic.name).toLowerCase().includes(term)) ||
                (normalizeTrans(topic.description).toLowerCase().includes(term))
            );
        }
        return [];
    };

    return (
        <div className="admin-panel fade-in responsive-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                paddingTop: 'clamp(4rem, 8vw, 6rem)',
                flexShrink: 0
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, var(--text-primary), var(--text-tertiary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.04em',
                            marginBottom: '0.5rem'
                        }}>
                            {t('admin.title')}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 500 }}>
                            {activeTab === 'users' ? t('admin.users_tab_desc') :
                                activeTab === 'questions' ? t('admin.questions_tab_desc') :
                                    activeTab === 'topics' ? t('admin.topics_tab_desc') :
                                        t('admin.admins_tab_desc')}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchData}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--surface)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary"
                            style={{
                                padding: '0.75rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                            }}
                            onClick={() => openModal()}
                        >
                            {activeTab === 'questions' ? <FileQuestion size={20} /> : activeTab === 'topics' ? <BookOpen size={20} /> : <UserPlus size={20} />}
                            <span>{activeTab === 'questions' ? t('admin.add_question') : activeTab === 'topics' ? t('admin.add_topic') : t('admin.add_user')}</span>
                        </motion.button>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-2xl)',
                    marginBottom: '2rem',
                    width: '100%',
                    maxWidth: '100%',
                    border: '1px solid var(--border-primary)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE/Edge
                }}>
                    <style>{`
                        .admin-panel div::-webkit-scrollbar { display: none; }
                    `}</style>
                    <TabButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={<Users size={18} />}
                        label={t('admin.tabs.users')}
                        count={data.users.filter(u => !u.is_staff).length}
                    />
                    <TabButton
                        active={activeTab === 'questions'}
                        onClick={() => setActiveTab('questions')}
                        icon={<HelpCircle size={18} />}
                        label={t('admin.tabs.questions')}
                        count={data.questions.length}
                    />
                    <TabButton
                        active={activeTab === 'topics'}
                        onClick={() => setActiveTab('topics')}
                        icon={<BookOpen size={18} />}
                        label={t('admin.tabs.topics')}
                        count={data.topics.length}
                    />
                    <TabButton
                        active={activeTab === 'statistics'}
                        onClick={() => setActiveTab('statistics')}
                        icon={<BarChart3 size={18} />}
                        label={t('admin.tabs.statistics')}
                    />
                    <TabButton
                        active={activeTab === 'admins'}
                        onClick={() => setActiveTab('admins')}
                        icon={<Shield size={18} />}
                        label={t('admin.tabs.admins')}
                        count={data.users.filter(u => u.is_staff).length}
                    />
                </div>

                {activeTab !== 'statistics' && (
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1rem',
                        background: 'var(--surface)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
                            <input
                                type="text"
                                placeholder={t('admin.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem 0.875rem 3.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {activeTab === 'statistics' ? (
                <div style={{ padding: '0 clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem)' }}>
                    <StatisticsView data={data} />
                </div>
            ) : (
                <div style={{
                    margin: '0 clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem)',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--border-primary)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xl)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {loading && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                        </div>
                    )}

                    <div style={{ overflow: 'auto', maxHeight: '450px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr>
                                    {(activeTab === 'users' || activeTab === 'admins') ? (
                                        <>
                                            <th style={thStyle}>{t('admin.table.profile')}</th>
                                            <th style={thStyle}>{t('admin.table.login')}</th>
                                            <th style={thStyle}>{t('admin.table.password')}</th>
                                            <th style={thStyle}>{t('admin.table.expiry')}</th>
                                            <th style={thStyle}>{t('admin.table.status')}</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>{t('admin.table.actions')}</th>
                                        </>
                                    ) : activeTab === 'questions' ? (
                                        <>
                                            <th style={thStyle}>{t('admin.table.question_text')}</th>
                                            <th style={thStyle}>{t('admin.table.topic')}</th>
                                            <th style={thStyle}>{t('admin.table.image')}</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>{t('admin.table.actions')}</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={thStyle}>{t('admin.table.topic_name')}</th>
                                            <th style={thStyle}>{t('admin.table.description')}</th>
                                            <th style={thStyle}>{t('admin.table.questions_count')}</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>{t('admin.table.actions')}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredData().map((item, idx) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ borderBottom: '1px solid var(--border-primary)' }}
                                        >
                                            {(activeTab === 'users' || activeTab === 'admins') ? (
                                                <>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '10px',
                                                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: 'white', fontWeight: 800
                                                            }}>
                                                                {item.profile_picture ? <img src={getImageUrl(item.profile_picture)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : (item.username?.[0] || 'U').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{item.first_name} {item.last_name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={tdStyle}><code>@{item.username}</code></td>
                                                    <td style={tdStyle}>
                                                        <code>{item.password || '—'}</code>
                                                    </td>
                                                    <td style={tdStyle}>{item.limit_date ? new Date(item.limit_date).toLocaleDateString() : '—'}</td>
                                                    <td style={tdStyle}>
                                                        {(() => {
                                                            const s = getUserStatus(item);
                                                            return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 800 }}>{s.label}</span>;
                                                        })()}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => openModal(item)} className="icon-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteClick('users', item.id)} className="icon-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : activeTab === 'questions' ? (
                                                <>
                                                    <td style={{ ...tdStyle, maxWidth: '300px' }}>
                                                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTrans(item.text, i18n.language)}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('dashboard.variants_count', { count: item.choices ? (Array.isArray(item.choices) ? item.choices.length : (item.choices.uz?.length || 0)) : 0 })}</div>
                                                    </td>
                                                    <td style={tdStyle}><span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.75rem' }}>{getTrans(item.topic_name, i18n.language)}</span></td>
                                                    <td style={tdStyle}>
                                                        {item.image_url ? (
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
                                                                <img src={getImageUrl(item.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        ) : 'Yo\'q'}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => openModal(item)} className="icon-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteClick('questions', item.id)} className="icon-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={tdStyle}><div style={{ fontWeight: 700 }}>{getTrans(item.name, i18n.language)}</div></td>
                                                    <td style={tdStyle}><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTrans(item.description, i18n.language) || '—'}</div></td>
                                                    <td style={tdStyle}>{item.questions?.length || 0} ta</td>
                                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => openModal(item)} className="icon-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteClick('topics', item.id)} className="icon-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--surface, #ffffff)', padding: 'clamp(1.5rem, 5vw, 2rem)', borderRadius: 'var(--radius-2xl)', width: '90%', maxWidth: '600px', maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ color: 'var(--text-primary)' }}>{editingItem ? t('admin.modal.edit') : t('admin.modal.add')}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {(activeTab === 'users' || activeTab === 'admins') ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            <FormInput label={t('admin.modal.first_name')} value={userForm.first_name} onChange={v => setUserForm({ ...userForm, first_name: v })} required />
                                            <FormInput label={t('admin.modal.last_name')} value={userForm.last_name} onChange={v => setUserForm({ ...userForm, last_name: v })} required />
                                        </div>
                                        <FormInput label={t('admin.table.login')} value={userForm.username} onChange={v => setUserForm({ ...userForm, username: v })} required />
                                        <FormInput label={t('admin.table.password')} type="text" value={userForm.password} onChange={v => setUserForm({ ...userForm, password: v })} required />
                                        <FormInput label={t('admin.table.expiry')} type="date" value={userForm.limit_date} onChange={v => setUserForm({ ...userForm, limit_date: v })} required />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={userForm.is_staff} onChange={e => setUserForm({ ...userForm, is_staff: e.target.checked })} />
                                            <span style={{ fontWeight: 600 }}>{t('admin.modal.admin_role')}</span>
                                        </label>
                                    </>
                                ) : activeTab === 'questions' ? (
                                    <>
                                        <FormTextarea label={t('admin.table.question_text')} value={questionForm.text} onChange={v => setQuestionForm({ ...questionForm, text: v })} required />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            {(questionForm.choices || []).map((c, i) => (
                                                <div key={i} style={{ position: 'relative' }}>
                                                    <FormInput
                                                        label={`${t('admin.table.topic')} ${String.fromCharCode(65 + i)}`}
                                                        value={c}
                                                        onChange={v => {
                                                            const newChoices = [...questionForm.choices];
                                                            newChoices[i] = v;
                                                            setQuestionForm({ ...questionForm, choices: newChoices });
                                                        }}
                                                        required={false} // "hamma javobni yozish shart emas"
                                                    />
                                                    {questionForm.choices.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newChoices = questionForm.choices.filter((_, idx) => idx !== i);
                                                                let newCorrect = questionForm.correct_answer_index;
                                                                if (newCorrect === i) newCorrect = 0;
                                                                else if (newCorrect > i) newCorrect--;
                                                                setQuestionForm({ ...questionForm, choices: newChoices, correct_answer_index: newCorrect });
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                right: '-8px',
                                                                top: '32px',
                                                                background: 'var(--error, #ef4444)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '24px',
                                                                height: '24px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionForm({ ...questionForm, choices: [...questionForm.choices, ''] })}
                                            style={{
                                                padding: '0.75rem',
                                                border: '2px dashed var(--border-primary)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '12px',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.75rem',
                                                cursor: 'pointer',
                                                fontWeight: 800,
                                                marginBottom: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Plus size={20} />
                                            <span>{t('admin.add_answer') || 'Yana javob qo\'shish'}</span>
                                        </button>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('admin.modal.correct_answer')}</label>
                                                <select value={questionForm.correct_answer_index} onChange={e => setQuestionForm({ ...questionForm, correct_answer_index: parseInt(e.target.value) })} style={inputStyle}>
                                                    {(questionForm.choices || []).map((_, i) => <option key={i} value={i}>{t('admin.table.topic')} {String.fromCharCode(65 + i)}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('admin.table.topic')}</label>
                                                <select value={questionForm.topic} onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })} style={inputStyle}>
                                                    {data.topics.map(topic => <option key={topic.id} value={topic.id}>{getTrans(topic.name)}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('admin.table.image')}</label>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={questionForm.image_url || ''}
                                                    onChange={e => setQuestionForm({ ...questionForm, image_url: e.target.value })}
                                                    placeholder="Rasm URL manzili"
                                                    style={{ ...inputStyle, flex: 1 }}
                                                />
                                                <label style={{
                                                    padding: '0.75rem 1rem',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    boxShadow: 'var(--shadow-md)'
                                                }}>
                                                    <Upload size={18} />
                                                    {t('profile.edit_profile') ? "Fayl" : "Yuklash"}
                                                    <input type="file" onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                                                </label>
                                            </div>
                                            {questionForm.image_url && (
                                                <div style={{ marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-primary)', width: 'fit-content' }}>
                                                    <img src={questionForm.image_url} alt="Preview" style={{ maxHeight: '100px', display: 'block' }} />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <FormInput label={t('admin.table.topic_name')} value={topicForm.name} onChange={v => setTopicForm({ ...topicForm, name: v })} required />
                                        <FormTextarea label={t('admin.table.description')} value={topicForm.description} onChange={v => setTopicForm({ ...topicForm, description: v })} />
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'none' }}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.75rem', borderRadius: '12px' }}>{t('common.save')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS NOTIFICATION MODAL */}
            <AnimatePresence>
                {successNotification && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={handleCopyUserCredentials}
                            style={{
                                background: 'var(--surface, #ffffff)',
                                padding: '2rem',
                                borderRadius: 'var(--radius-xl)',
                                width: '90%',
                                maxWidth: '450px',
                                cursor: 'pointer',
                                border: '2px solid var(--success, #10b981)',
                                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                        {t('admin.success.added')} ✅
                                    </h2>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        {t('admin.success.copy_hint')}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--bg-secondary)',
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin.modal.first_name')}:</span>
                                        <span style={{ fontWeight: 700 }}>{successNotification.first_name} {successNotification.last_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin.table.login')}:</span>
                                        <code style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>@{successNotification.username}</code>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin.table.password')}:</span>
                                        <code style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>{successNotification.password}</code>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin.table.expiry')}:</span>
                                        <span style={{ fontWeight: 700 }}>{successNotification.limit_date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Role:</span>
                                        <span style={{ fontWeight: 700, color: successNotification.is_admin ? 'var(--warning)' : 'var(--primary)' }}>
                                            {successNotification.is_admin ? `👑 ${t('profile.administrator')}` : `👤 ${t('profile.user')}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCopyUserCredentials(); }}
                                    style={{
                                        flex: 2, padding: '0.875rem', borderRadius: '12px',
                                        border: 'none',
                                        background: copied ? 'var(--success, #10b981)' : 'var(--primary)',
                                        color: 'white', cursor: 'pointer', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {copied ? <><Check size={18} /> {t('admin.success.copied')}</> : <>{t('admin.success.copy_btn')}</>}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSuccessNotification(null); setCopied(false); }}
                                    style={{
                                        flex: 1, padding: '0.875rem', borderRadius: '12px',
                                        border: '1px solid var(--border-primary)',
                                        background: 'none', cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteModal.open && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--surface, #ffffff)', padding: '2rem', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Trash2 size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{t('admin.delete.title')}</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                {t('admin.delete.msg')}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setDeleteModal({ open: false, type: null, id: null })} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('common.cancel')}</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'var(--error)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{t('stats.reset_confirm_title_short') || t('admin.table.actions')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button onClick={onClick} style={{
        padding: '0.6rem 1.125rem',
        background: active ? 'var(--surface)' : 'transparent',
        border: active ? '1px solid var(--border-primary)' : '1px solid transparent',
        borderRadius: 'var(--radius-xl)',
        color: active ? 'var(--primary)' : 'var(--text-tertiary)',
        fontWeight: 700,
        fontSize: '0.875rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        boxShadow: active ? 'var(--shadow-md)' : 'none',
        flexShrink: 0,
        whiteSpace: 'nowrap'
    }}>
        {icon}
        <span>{label}</span>
        {count !== undefined && <span style={{ background: active ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{count}</span>}
    </button>
);

const FormInput = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</label>
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} style={inputStyle} />
    </div>
);

const FormTextarea = ({ label, value, onChange, required = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</label>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} required={required} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
    </div>
);

const thStyle = { padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' };
const tdStyle = { padding: '1rem 1.5rem', fontSize: '0.9rem', borderBottom: '1px solid var(--border-primary)' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' };

const StatisticsView = ({ data }) => {
    const { t, i18n } = useTranslation();
    const userStats = useMemo(() => {
        const activeUsers = data.users.filter(u => {
            if (!u.limit_date) return true;
            return new Date(u.limit_date) >= new Date();
        }).length;
        const expiredUsers = data.users.length - activeUsers;
        return { active: activeUsers, expired: expiredUsers };
    }, [data.users]);

    const topicQuestionsData = useMemo(() => {
        return {
            labels: data.topics.map(topic => getTrans(topic.name, i18n.language)),
            datasets: [{
                label: t('admin.stats_view.questions_count'),
                data: data.topics.map(topic => topic.questions?.length || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2
            }]
        };
    }, [data.topics]);

    const userStatusData = {
        labels: [t('admin.stats_view.active_label'), t('admin.stats_view.expired_label')],
        datasets: [{
            data: [userStats.active, userStats.expired],
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)'
            ],
            borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)'
            ],
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'var(--text-primary)',
                    font: { size: 12, weight: 600 }
                }
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                ticks: { color: 'var(--text-secondary)', font: { size: 11 } },
                grid: { color: 'var(--border-primary)' }
            },
            y: {
                ticks: { color: 'var(--text-secondary)', font: { size: 11 } },
                grid: { color: 'var(--border-primary)' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'var(--text-primary)',
                    font: { size: 12, weight: 600 },
                    padding: 15
                }
            }
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--border-primary)',
                    padding: '2rem',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={24} style={{ color: 'var(--primary)' }} />
                        {t('admin.stats_view.user_status_title')}
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Doughnut data={userStatusData} options={pieOptions} />
                    </div>
                </div>

                <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--border-primary)',
                    padding: '2rem',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp size={24} style={{ color: 'var(--secondary)' }} />
                        {t('admin.stats_view.overall_title')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-primary)'
                        }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                {data.users.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin.stats_view.total_users')}</div>
                        </div>
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-primary)'
                        }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                {data.questions.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin.stats_view.total_questions')}</div>
                        </div>
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-primary)'
                        }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)', marginBottom: '0.5rem' }}>
                                {data.topics.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin.stats_view.total_topics')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--border-primary)',
                padding: '2rem',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
                    {t('admin.stats_view.chart_title')}
                </h3>
                <div style={{ height: '400px' }}>
                    <Bar data={topicQuestionsData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
