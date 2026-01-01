import React, { useState, useEffect } from 'react';
import {
    BookOpen, CheckCircle, HelpCircle, Trophy,
    ArrowRight, Clock, Star, TrendingUp, Award
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopics, setShowTopics] = useState(false);
    const [stats, setStats] = useState({
        totalTopics: 0,
        totalQuestions: 0,
        completedCount: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Djangodan emas, Supabasedan olish
            const { data: topicsData, error } = await supabase
                .from('topics')
                .select('*');

            if (error) throw error;

            // Har bir topic uchun savollar sonini alohida yoki join bilan olish kerak.
            // Oddiy 'questions(count)' ishlamaydi agar foreign key 'topic_id' bo'lsa.
            // Shuning uchun alohida so'rov yoki keyinroq optimallashtiramiz.
            // Hozirchalik oddiyroq yo'l: har bir topic uchun count olamiz yoki 
            // barcha savollarni count qilib olib kelamiz (agar ko'p bo'lmasa).
            // 7000 ta savol ko'p.

            // Yaxshisi, Supabase da view yoki function ishlatish kerak, lekin 
            // hozircha shunchaki topicsni ko'rsatamiz, savollar sonini keyin qo'shamiz
            // yoki alohida count query qilamiz.

            // Keling, questions count ni olish uchun oddiy workaround qilamiz:
            const topicsWithCount = await Promise.all(topicsData.map(async (t) => {
                const { count } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('topic_id', t.id);
                return { ...t, questions: { length: count } };
            }));

            setTopics(topicsWithCount);

            const totalQ = topicsWithCount.reduce((acc, t) => acc + (t.questions?.length || 0), 0);
            const completed = user?.completed_mavzular?.length || 0;

            setStats({
                totalTopics: topicsWithCount.length,
                totalQuestions: totalQ,
                completedCount: completed
            });
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="dashboard fade-in"
        >
            {/* Welcome Header */}
            <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, var(--text-primary), var(--text-tertiary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.75rem'
                }}>
                    Salom, {user?.first_name || user?.username}! 👋
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {showTopics ? "Mashq qilish uchun mavzuni tanlang." : "Bugun bilimingizni oshirish uchun ajoyib kun."}
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                {!showTopics ? (
                    <motion.div
                        key="modes"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        variants={itemVariants}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '2rem',
                            marginBottom: '4rem'
                        }}
                    >
                        {/* Mashq Card */}
                        <motion.div
                            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                background: 'var(--surface)',
                                padding: '2.5rem',
                                borderRadius: 'var(--radius-2xl)',
                                border: '1px solid var(--border-primary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                            onClick={() => setShowTopics(true)}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)'
                            }}>
                                <BookOpen size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Mashq boshlash</h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Mavzular bo'yicha ketma-ket o'rganish va test ishlash.
                            </p>
                        </motion.div>

                        {/* Imtihon Card */}
                        <Link to="/quiz?mode=exam" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                    padding: '2.5rem',
                                    borderRadius: 'var(--radius-2xl)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    color: 'white',
                                    height: '100%'
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Award size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Imtihon boshlash</h3>
                                <p style={{ opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    Barcha mavzulardan tasodifiy savollar. Maksimal darajada sinov!
                                </p>
                            </motion.div>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        key="topics"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setShowTopics(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                marginBottom: '2rem',
                                padding: '0.5rem 0'
                            }}
                        >
                            ← Orqaga qaytish
                        </button>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '4rem'
                        }}>
                            {topics.map((topic, index) => (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    index={index}
                                    isCompleted={user?.completed_mavzular?.includes(topic.id.toString())}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '4rem'
            }}>
                <StatCard
                    icon={<BookOpen size={24} />}
                    label="Mavzulari"
                    value={stats.totalTopics}
                    color="var(--primary)"
                    bg="rgba(99, 102, 241, 0.1)"
                />
                <StatCard
                    icon={<HelpCircle size={24} />}
                    label="Savollar"
                    value={stats.totalQuestions}
                    color="var(--secondary)"
                    bg="rgba(168, 85, 247, 0.1)"
                />
                <StatCard
                    icon={<Award size={24} />}
                    label="Tugallangan"
                    value={stats.completedCount}
                    color="var(--success)"
                    bg="rgba(16, 185, 129, 0.1)"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="O'rtacha vaqt"
                    value="2:45"
                    color="var(--warning)"
                    bg="rgba(245, 158, 11, 0.1)"
                />
            </motion.div>
        </motion.div>
    );
};

const StatCard = ({ icon, label, value, color, bg }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
        style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-primary)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-lg)'
        }}
    >
        <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: bg,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {label}
            </div>
        </div>
    </motion.div>
);

const TopicCard = ({ topic, index, isCompleted }) => (
    <div
        className="topic-card"
        style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            padding: '1.75rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        {isCompleted && (
            <div style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                color: 'var(--success)'
            }}>
                <CheckCircle size={24} fill="currentColor" fillOpacity={0.15} />
            </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: 'var(--primary)',
                border: '1px solid var(--border-primary)'
            }}>
                {index + 1}
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {topic.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {topic.questions?.length || 0} ta savol
                </span>
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <Link
                to={`/quiz?topicId=${topic.id}`}
                style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                    color: isCompleted ? 'var(--success)' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                }}
            >
                <span>Testni boshlash</span>
                <ArrowRight size={16} />
            </Link>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isCompleted ? 'var(--success)' : 'var(--border-secondary)',
                        opacity: 0.5
                    }} />
                ))}
            </div>
        </div>
    </div>
);

export default Dashboard;
