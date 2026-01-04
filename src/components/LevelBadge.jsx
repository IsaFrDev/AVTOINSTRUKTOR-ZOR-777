import React from 'react';
import { motion } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { useTranslation } from 'react-i18next';
import { Target, Zap, Star } from 'lucide-react';
import './LevelBadge.css';

const LevelBadge = ({ showDetails = false, size = 'medium' }) => {
    const { t } = useTranslation();
    const { stats, getCurrentLevel, getNextLevel, getLevelProgress, getAccuracyPercent } = useProgress();

    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    const progress = getLevelProgress();

    const sizeStyles = {
        small: { badge: '40px', fontSize: '0.75rem', emoji: '1rem' },
        medium: { badge: '60px', fontSize: '0.875rem', emoji: '1.5rem' },
        large: { badge: '80px', fontSize: '1rem', emoji: '2rem' }
    };

    const s = sizeStyles[size];

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`level-badge-wrapper ${showDetails ? 'with-details' : ''}`}
            style={{
                background: showDetails ? currentLevel.bg : 'transparent',
                border: showDetails ? `2px solid ${currentLevel.color}` : 'none'
            }}
        >
            {/* Badge Icon */}
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{
                    width: s.badge,
                    height: s.badge,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: s.emoji,
                    boxShadow: `0 4px 15px ${currentLevel.color}40`,
                    flexShrink: 0
                }}
            >
                {currentLevel.emoji}
            </motion.div>

            {showDetails && (
                <div className="level-badge-info">
                    <div className="level-badge-header">
                        <span style={{ fontWeight: 800, color: currentLevel.color, fontSize: s.fontSize }}>
                            {t(`levels.${currentLevel.key}`)}
                        </span>
                        <span style={{
                            background: 'var(--bg-tertiary)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                        }}>
                            {stats.totalPoints} {t('quiz.ball')}
                        </span>
                    </div>

                    {/* Progress to next level */}
                    {nextLevel && (
                        <div className="next-level-target">
                            <div className="next-level-label-row">
                                <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    {t('quiz.next_level_label')}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {nextLevel.emoji} {t(`levels.${nextLevel.key}`)}
                                </span>
                            </div>
                            <div style={{
                                height: '8px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                margin: '0.25rem 0'
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
                                        borderRadius: '10px'
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                {t('quiz.ball_left', { points: nextLevel.minPoints - stats.totalPoints })}
                            </div>
                        </div>
                    )}

                    {/* Quick Stats Row */}
                    <div className="level-stats-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Target size={14} style={{ color: 'var(--success)' }} />
                            <span style={{ fontWeight: 700 }}>{getAccuracyPercent()}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Zap size={14} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontWeight: 700 }}>{stats.streak} {t('quiz.streak')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Star size={14} style={{ color: 'var(--secondary)' }} />
                            <span style={{ fontWeight: 700 }}>{stats.bestStreak} {t('quiz.best')}</span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default LevelBadge;
