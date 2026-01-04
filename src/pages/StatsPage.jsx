import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { useTranslation } from 'react-i18next';
import LevelBadge from '../components/LevelBadge';
import {
    BarChart3, Target, Clock, Zap, Trophy,
    TrendingUp, Award, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';
import './StatsPage.css';

const StatsPage = () => {
    const { t } = useTranslation();
    const {
        stats,
        levels,
        getCurrentLevel,
        getAccuracyPercent,
        resetStats
    } = useProgress();

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const currentLevel = getCurrentLevel();

    // Stats kartochkalar
    const statCards = [
        {
            title: t('stats.total_questions'),
            value: stats.totalQuestions,
            icon: BarChart3,
            color: '#6366f1',
            bg: 'rgba(99, 102, 241, 0.1)'
        },
        {
            title: t('stats.correct_answers'),
            value: stats.correctAnswers,
            icon: CheckCircle2,
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.1)'
        },
        {
            title: t('stats.wrong_answers'),
            value: stats.wrongAnswers,
            icon: XCircle,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)'
        },
        {
            title: t('stats.accuracy'),
            value: `${getAccuracyPercent()}%`,
            icon: Target,
            color: '#a855f7',
            bg: 'rgba(168, 85, 247, 0.1)'
        },
        {
            title: t('stats.current_streak'),
            value: stats.streak,
            icon: Zap,
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)'
        },
        {
            title: t('stats.best_streak'),
            value: stats.bestStreak,
            icon: Trophy,
            color: '#06b6d4',
            bg: 'rgba(6, 182, 212, 0.1)'
        }
    ];

    // Vaqt formatlash
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs} ${t('stats.seconds')}`;
        return `${mins} ${t('stats.minutes')} ${secs} ${t('stats.seconds')}`;
    };

    return (
        <div className="stats-page fade-in responsive-container">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="stats-header"
            >
                <h1 className="text-responsive-h1" style={{
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    📊 {t('stats.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {t('stats.subtitle')}
                </p>
            </motion.div>

            {/* Level Badge - Katta */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="level-badge-container"
            >
                <LevelBadge showDetails={true} size="large" />
            </motion.div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="stat-card"
                    >
                        <div className="stat-icon-wrapper" style={{ background: card.bg }}>
                            <card.icon size={22} style={{ color: card.color }} />
                        </div>
                        <div className="stat-value" style={{ color: card.color }}>
                            {card.value}
                        </div>
                        <div className="stat-title">
                            {card.title}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Progress Chart (Simple) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="progress-section"
            >
                <h3 style={{ fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                    {t('stats.results')}
                </h3>

                <div className="progress-layout">
                    {/* Accuracy circle */}
                    <div className="accuracy-circle-container">
                        <div style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            background: `conic-gradient(
                                var(--success) ${getAccuracyPercent() * 3.6}deg,
                                var(--bg-tertiary) 0deg
                            )`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                        }}>
                            <div style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                background: 'var(--surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                border: '4px solid var(--bg-primary)'
                            }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{getAccuracyPercent()}%</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{t('stats.accuracy')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Time spent & Level */}
                    <div className="time-spent-container">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Clock size={18} style={{ color: 'var(--text-tertiary)' }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t('stats.total_time')}</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                {formatTime(stats.totalTimeSpent || 0)}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Award size={18} style={{ color: 'var(--text-tertiary)' }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t('stats.current_level')}</span>
                            </div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: currentLevel.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {currentLevel.emoji} {t(`levels.${currentLevel.key}`)}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Levels Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="levels-section"
            >
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🎯 {t('stats.levels')}</h3>
                <div className="levels-grid">
                    {levels.map((level, idx) => {
                        const isUnlocked = stats.totalPoints >= level.minPoints;
                        const isCurrent = getCurrentLevel().key === level.key;

                        return (
                            <motion.div
                                key={level.key}
                                whileHover={{ scale: 1.02 }}
                                className="level-card"
                                style={{
                                    background: isCurrent ? level.bg : (isUnlocked ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'),
                                    border: isCurrent ? `2px solid ${level.color}` : (isUnlocked ? `1px solid ${level.color}40` : '1px solid transparent'),
                                    opacity: isUnlocked ? 1 : 0.6,
                                }}
                            >
                                <span style={{ fontSize: '1.75rem' }}>{level.emoji}</span>
                                <div>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        color: isUnlocked ? (isCurrent ? level.color : 'var(--text-primary)') : 'var(--text-tertiary)'
                                    }}>
                                        {t(`levels.${level.key}`)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                        {level.minPoints}+ {t('stats.points')}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Reset Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ textAlign: 'center', paddingBottom: '2rem' }}
            >
                <button
                    onClick={() => setShowResetConfirm(true)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--error)',
                        background: 'transparent',
                        color: 'var(--error)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto',
                        transition: 'all 0.2s'
                    }}
                    className="hover-scale"
                >
                    <RefreshCw size={16} />
                    {t('stats.reset_stats')}
                </button>
            </motion.div>

            {/* Reset Confirm Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowResetConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--surface)',
                                padding: '2.5rem',
                                borderRadius: 'var(--radius-3xl)',
                                maxWidth: '400px',
                                width: '90%',
                                textAlign: 'center',
                                border: '1px solid var(--border-primary)',
                                boxShadow: 'var(--shadow-xl)'
                            }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>⚠️</div>
                            <h3 style={{ marginBottom: '0.75rem', fontWeight: 800, fontSize: '1.5rem' }}>{t('stats.reset_confirm_title')}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.6 }}>
                                {t('stats.reset_confirm_msg')}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        borderRadius: 'var(--radius-xl)',
                                        border: '1px solid var(--border-primary)',
                                        background: 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        resetStats();
                                        setShowResetConfirm(false);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        borderRadius: 'var(--radius-xl)',
                                        border: 'none',
                                        background: 'var(--error)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t('common.reset')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StatsPage;

