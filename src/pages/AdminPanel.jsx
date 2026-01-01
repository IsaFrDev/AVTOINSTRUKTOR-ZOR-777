import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, HelpCircle, Shield, Plus, Edit2, Trash2,
    Search, X, Check, Save, Calendar, BookOpen, Clock, AlertTriangle, ChevronRight, Filter,
    CheckCircle2, XCircle, MoreVertical, UserPlus, FileQuestion, RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
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

const AdminPanel = () => {
    const getImageUrl = (url) => {
        if (!url) return null;

        // Agar URL "http" bilan boshlansa va bizning eski serverga (localhost:8000) yoki shunchaki absolute bo'lsa
        // Biz uni baribir local /img/ papkaga yo'naltiramiz, chunki fayllar shuyerda.
        // Faqat tashqi linklar (masalan telegram) qolsin desak:
        // Ammo userning muammosi "photo_..." fayllarida.

        // Agar URLda "img/" qatnashsa, u yog'ini olib qolamiz
        if (url.includes('img/') && url.includes('photo_')) {
            const clean = url.split('img/')[1];
            return `/img/${clean}`;
        }

        // Agar shunchaki fayl nomi bo'lsa (va http bo'lmasa)
        if (!url.startsWith('http') && !url.startsWith('/')) {
            if (url.startsWith('img/')) return `/${url}`;
            return `/img/${url}`;
        }

        // Qolgan holatlar (Telegram linklari va h.k.)
        return url;
    };

    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ users: [], questions: [], topics: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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

            const { data: users } = await supabase.from('profiles').select('*');
            const { data: questions } = await supabase.from('questions').select('*, topic:topics(name)');
            const { data: topics } = await supabase.from('topics').select('*');

            // For topic question counts, we can do a separate query or handle it in UI.
            // Let's iterate topics to get counts.
            const topicsWithCount = await Promise.all(topics.map(async (t) => {
                const { count } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('topic_id', t.id);
                return { ...t, questions: { length: count } };
            }));

            setData({
                users: users || [],
                questions: questions?.map(q => ({ ...q, topic_name: q.topic?.name })) || [],
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
                return { label: 'Muddati o\'tgan', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} /> };
            }
        }
        return { label: 'Faol', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={14} /> };
    };

    const openModal = (item = null) => {
        setEditingItem(item);
        if (activeTab === 'users' || activeTab === 'admins') {
            const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            setUserForm(item ? {
                ...item,
                password: '',
                limit_date: item.limit_date ? item.limit_date.split('T')[0] : defaultDate
            } : {
                username: '',
                first_name: '',
                last_name: '',
                password: '',
                limit_date: defaultDate,
                is_staff: activeTab === 'admins',
                is_active: true
            });
        } else if (activeTab === 'questions') {
            setQuestionForm(item ? { ...item, topic: item.topic_id || data.topics[0]?.id } : { text: '', choices: ['', '', '', ''], correct_answer_index: 0, topic: data.topics[0]?.id || '', image_url: '' });
        } else {
            setTopicForm(item ? { ...item } : { name: '', description: '' });
        }
        setIsModalOpen(true);
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
                    alert("Foydalanuvchi bazaga qo'shildi! DIQQAT: Bu foydalanuvchi tizimga kirishi uchun o'zi Sign Up qilishi kerak (yoki siz Auth yaratishingiz kerak backend orqali).");
                }
            } else if (activeTab === 'questions') {
                const payload = {
                    text: questionForm.text,
                    choices: questionForm.choices,
                    correct_answer_index: questionForm.correct_answer_index,
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
                    name: topicForm.name,
                    description: topicForm.description
                };
                if (editingItem) {
                    await supabase.from('topics').update(payload).eq('id', editingItem.id);
                } else {
                    await supabase.from('topics').insert([payload]);
                }
            }
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

    const confirmDelete = async () => {
        const { type, id } = deleteModal;
        try {
            const table = type === 'users' ? 'profiles' : (type === 'questions' ? 'questions' : 'topics');
            await supabase.from(table).delete().eq('id', id);
            fetchData();
            setDeleteModal({ open: false, type: null, id: null });
        } catch (error) {
            alert('Xatolik yuz berdi: ' + error.message);
        }
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
                q.text.toLowerCase().includes(term) ||
                q.topic_name?.toLowerCase().includes(term)
            );
        } else if (activeTab === 'topics') {
            return data.topics.filter(t =>
                t.name.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term)
            );
        }
        return [];
    };

    return (
        <div className="admin-panel fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }}>
            <div style={{
                padding: '2rem',
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
                            Boshqaruv markazi
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 500 }}>
                            {activeTab === 'users' ? 'Akkountlar va ruxsatlarni boshqarish' :
                                activeTab === 'questions' ? 'Test savollari bazasini tahrirlash' :
                                    activeTab === 'topics' ? 'Mavzular bazasini tahrirlash' :
                                        'Tizim administratorlari ro\'yxati'}
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
                            <span>{activeTab === 'questions' ? 'Yangi savol' : activeTab === 'topics' ? 'Yangi mavzu' : 'Qo\'shish'}</span>
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
                    width: 'fit-content',
                    border: '1px solid var(--border-primary)',
                    flexWrap: 'wrap'
                }}>
                    <TabButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={<Users size={18} />}
                        label="Foydalanuvchilar"
                        count={data.users.filter(u => !u.is_staff).length}
                    />
                    <TabButton
                        active={activeTab === 'questions'}
                        onClick={() => setActiveTab('questions')}
                        icon={<HelpCircle size={18} />}
                        label="Savollar"
                        count={data.questions.length}
                    />
                    <TabButton
                        active={activeTab === 'topics'}
                        onClick={() => setActiveTab('topics')}
                        icon={<BookOpen size={18} />}
                        label="Mavzular"
                        count={data.topics.length}
                    />
                    <TabButton
                        active={activeTab === 'statistics'}
                        onClick={() => setActiveTab('statistics')}
                        icon={<BarChart3 size={18} />}
                        label="Statistika"
                    />
                    <TabButton
                        active={activeTab === 'admins'}
                        onClick={() => setActiveTab('admins')}
                        icon={<Shield size={18} />}
                        label="Adminlar"
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
                                placeholder="Qidirish..."
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
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>
                    <StatisticsView data={data} />
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    margin: '0 2rem 2rem',
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

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr>
                                    {(activeTab === 'users' || activeTab === 'admins') ? (
                                        <>
                                            <th style={thStyle}>Profil</th>
                                            <th style={thStyle}>Login</th>
                                            <th style={thStyle}>Ruxsat muddati</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>Amallar</th>
                                        </>
                                    ) : activeTab === 'questions' ? (
                                        <>
                                            <th style={thStyle}>Savol matni</th>
                                            <th style={thStyle}>Mavzu</th>
                                            <th style={thStyle}>Rasm</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>Amallar</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={thStyle}>Mavzu nomi</th>
                                            <th style={thStyle}>Tavsif</th>
                                            <th style={thStyle}>Savollar</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>Amallar</th>
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
                                                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.choices.length} ta variant</div>
                                                    </td>
                                                    <td style={tdStyle}><span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.75rem' }}>{item.topic_name}</span></td>
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
                                                    <td style={tdStyle}><div style={{ fontWeight: 700 }}>{item.name}</div></td>
                                                    <td style={tdStyle}><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description || '—'}</div></td>
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--surface, #ffffff)', padding: '2rem', borderRadius: 'var(--radius-2xl)', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ color: 'var(--text-primary)' }}>{editingItem ? 'Tahrirlash' : 'Yangi qo\'shish'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {(activeTab === 'users' || activeTab === 'admins') ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <FormInput label="Ism" value={userForm.first_name} onChange={v => setUserForm({ ...userForm, first_name: v })} required />
                                            <FormInput label="Familiya" value={userForm.last_name} onChange={v => setUserForm({ ...userForm, last_name: v })} required />
                                        </div>
                                        <FormInput label="Login" value={userForm.username} onChange={v => setUserForm({ ...userForm, username: v })} required />
                                        <FormInput label="Parol" type="password" value={userForm.password} onChange={v => setUserForm({ ...userForm, password: v })} required={!editingItem} placeholder={editingItem ? "O'zgartirmaslik uchun bo'sh qoldiring" : ""} />
                                        <FormInput label="Ruxsat muddati" type="date" value={userForm.limit_date} onChange={v => setUserForm({ ...userForm, limit_date: v })} required />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={userForm.is_staff} onChange={e => setUserForm({ ...userForm, is_staff: e.target.checked })} />
                                            <span style={{ fontWeight: 600 }}>Administrator</span>
                                        </label>
                                    </>
                                ) : activeTab === 'questions' ? (
                                    <>
                                        <FormTextarea label="Savol matni" value={questionForm.text} onChange={v => setQuestionForm({ ...questionForm, text: v })} required />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {questionForm.choices.map((c, i) => (
                                                <FormInput key={i} label={`Variant ${String.fromCharCode(65 + i)}`} value={c} onChange={v => {
                                                    const newC = [...questionForm.choices];
                                                    newC[i] = v;
                                                    setQuestionForm({ ...questionForm, choices: newC });
                                                }} required />
                                            ))}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>To'g'ri javob</label>
                                                <select value={questionForm.correct_answer_index} onChange={e => setQuestionForm({ ...questionForm, correct_answer_index: parseInt(e.target.value) })} style={inputStyle}>
                                                    {questionForm.choices.map((_, i) => <option key={i} value={i}>Variant {String.fromCharCode(65 + i)}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>Mavzu</label>
                                                <select value={questionForm.topic} onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })} style={inputStyle}>
                                                    {data.topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <FormInput label="Rasm manzili" value={questionForm.image_url} onChange={v => setQuestionForm({ ...questionForm, image_url: v })} />
                                    </>
                                ) : (
                                    <>
                                        <FormInput label="Mavzu nomi" value={topicForm.name} onChange={v => setTopicForm({ ...topicForm, name: v })} required />
                                        <FormTextarea label="Tavsif" value={topicForm.description} onChange={v => setTopicForm({ ...topicForm, description: v })} />
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'none' }}>Bekor qilish</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.75rem', borderRadius: '12px' }}>Saqlash</button>
                                </div>
                            </form>
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
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>O'chirishni tasdiqlang</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                Haqiqatan ham ushbu ma'lumotni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setDeleteModal({ open: false, type: null, id: null })} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Bekor qilish</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'var(--error)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>O'chirish</button>
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
        boxShadow: active ? 'var(--shadow-md)' : 'none'
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
            labels: data.topics.map(t => t.name),
            datasets: [{
                label: 'Savollar soni',
                data: data.topics.map(t => t.questions?.length || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2
            }]
        };
    }, [data.topics]);

    const userStatusData = {
        labels: ['Faol', 'Muddati tugagan'],
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
                        Foydalanuvchilar statusi
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
                        Umumiy statistika
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
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jami foydalanuvchilar</div>
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
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jami savollar</div>
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
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jami mavzular</div>
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
                    Mavzular bo'yicha savollar taqsimoti
                </h3>
                <div style={{ height: '400px' }}>
                    <Bar data={topicQuestionsData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
