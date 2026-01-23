import React, { useState, useEffect } from 'react';
import {
    BookOpen, CheckCircle, HelpCircle, Trophy,
    ArrowRight, Clock, Star, TrendingUp, Award
} from 'lucide-react';
import { quizApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useProgress } from '../context/ProgressContext';
import './Dashboard.css';

const getTrans = (val, lang) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    const l = lang?.split('-')[0] || 'uz';
    return val[l] || val['uz'] || Object.values(val)[0] || '';
};

const Dashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { stats: userStats, getAverageTimeFormatted } = useProgress();
    const { i18n } = useTranslation();

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopics, setShowTopics] = useState(false);
    const [error, setError] = useState(null);

    // Statistikalarni reactive (avtomatik yangilanadigan) qilish
    const libraryStats = React.useMemo(() => {
        const totalTopics = topics.length;
        const totalQuestions = topics.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

        // completed_mavzular ichida ham string, ham number bo'lishi mumkinligini hisobga olamiz
        const completedMavzular = user?.completed_mavzular || [];
        const completedCount = topics.filter(t =>
            completedMavzular.includes(t.id) || completedMavzular.includes(t.id.toString())
        ).length;

        return {
            totalTopics,
            totalQuestions,
            completedCount
        };
    }, [topics, user]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Django API dan mavzularni olish
            const topicsData = await quizApi.getTopics();
            console.log("Topics loaded:", topicsData);

            // API dan kelgan ma'lumotlarni komponentga moslash
            const formattedTopics = topicsData.map(t => ({
                id: t.id,
                name: t.title,
                questions: { length: t.questions_count }
            }));

            // Mavzularni tabiiy tartibda saralash (1, 2, ... 10)
            formattedTopics.sort((a, b) => {
                const nameA = a.name?.uz || a.name || '';
                const nameB = b.name?.uz || b.name || '';
                // Agar name string bo'lsa
                if (typeof nameA === 'string' && typeof nameB === 'string') {
                    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                }
                return 0;
            });

            setTopics(formattedTopics);
            setError(null);
        } catch (error) {
            console.error("Dashboard error:", error);
            setError(error);
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
            <motion.div variants={itemVariants} className="dashboard-header">
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, var(--text-primary), var(--text-tertiary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.75rem'
                }}>
                    {t('dashboard.welcome', { name: user?.first_name || user?.username })}
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {showTopics ? t('dashboard.select_topic') : t('dashboard.subtitle')}
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
                        className="dashboard-modes"
                    >
                        {/* Mashq Card */}
                        <motion.div
                            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)' }}
                            whileTap={{ scale: 0.98 }}
                            className="mode-card"
                            onClick={() => setShowTopics(true)}
                        >
                            <div className="mode-icon-wrapper">
                                <BookOpen size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{t('dashboard.start_practice')}</h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                {t('dashboard.practice_desc')}
                            </p>
                        </motion.div>

                        {/* Imtihon Card */}
                        <Link to="/quiz?mode=exam" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                className="mode-card exam"
                            >
                                <div className="mode-icon-wrapper">
                                    <Award size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{t('dashboard.start_exam')}</h3>
                                <p style={{ opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    {t('dashboard.exam_desc')}
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
                            ← {t('common.back') || 'Orqaga'}
                        </button>

                        <div className="topics-grid">
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

            {error && (
                <div style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--error)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--error)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'center'
                }}>
                    <strong style={{ fontSize: '1.1rem' }}>{t('common.error_occurred') || 'Xatolik yuz berdi'}</strong>
                    <p>{error.message || 'Serverga ulanishda xatolik. Internet aloqasini tekshiring.'}</p>
                    <button
                        onClick={() => { setError(null); fetchDashboardData(); }}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.5rem', background: 'var(--error)' }}
                    >
                        {t('common.retry') || 'Qayta urinish'}
                    </button>
                </div>
            )}

            {
                !error && !loading && topics.length === 0 && !showTopics && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
                        <p>{t('dashboard.no_topics') || 'Mavzular topilmadi'}</p>
                    </div>
                )
            }

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="dashboard-stats-grid">
                <StatCard
                    icon={<BookOpen size={24} />}
                    label={t('dashboard.stat_topics')}
                    value={libraryStats.totalTopics}
                    color="var(--primary)"
                    bg="rgba(99, 102, 241, 0.1)"
                />
                <StatCard
                    icon={<HelpCircle size={24} />}
                    label={t('dashboard.stat_questions')}
                    value={libraryStats.totalQuestions}
                    color="var(--secondary)"
                    bg="rgba(168, 85, 247, 0.1)"
                />
                <StatCard
                    icon={<Award size={24} />}
                    label={t('dashboard.stat_completed')}
                    value={libraryStats.completedCount}
                    color="var(--success)"
                    bg="rgba(16, 185, 129, 0.1)"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label={t('dashboard.stat_avg_time')}
                    value={getAverageTimeFormatted()}
                    color="var(--warning)"
                    bg="rgba(245, 158, 11, 0.1)"
                />
            </motion.div>
        </motion.div >
    );
};

const StatCard = ({ icon, label, value, color, bg }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
        className="dashboard-stat-card"
    >
        <div className="stat-icon-square" style={{ background: bg, color: color }}>
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

const TopicCard = ({ topic, index, isCompleted }) => {
    const { t, i18n } = useTranslation();
    return (
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
                    border: '1px solid var(--border-primary)',
                    flexShrink: 0
                }}>
                    {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {getTrans(topic.name, i18n.language)}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {t('dashboard.questions_count', { count: topic.questions?.length || 0 })}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                    <span>{t('dashboard.start_quiz')}</span>
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
};

export default Dashboard;
