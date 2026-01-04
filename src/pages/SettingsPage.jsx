
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Type, Sun, Moon, Download,
    Smartphone, Bell, Shield, ChevronRight, Check,
    AlertCircle, RefreshCw, Trash2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
    const { t } = useTranslation();
    const { fontSize, setFontSize, deferredPrompt, setDeferredPrompt } = useSettings();
    const { theme, toggleTheme } = useTheme();
    const { resetStats } = useProgress();
    const navigate = useNavigate();

    const [isInstalled, setIsInstalled] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsInstalled(true);
        }

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);
    }, []);

    const handleInstall = () => {
        if (!deferredPrompt) {
            if (isIOS) {
                alert(t('settings.pwa_ios_install_hint') || "iPhone/iPad da: 'Ulashish' (Share) tugmasini bosing va 'Asosiy ekranga qo'shish' (Add to Home Screen) ni tanlang.");
            } else {
                alert(t('settings.pwa_manual_install'));
            }
            return;
        }
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true);
                setDeferredPrompt(null);
            }
        });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="settings-page fade-in responsive-container" style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '3rem' }}
            >
                <h1 className="text-responsive-h1" style={{
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ⚙️ {t('settings.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {t('settings.subtitle')}
                </p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
                {/* Visual Settings Section */}
                <section>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sun size={20} className="text-primary" />
                        {t('settings.visual_section')}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Theme Toggle Card */}
                        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 600 }}>{t('settings.dark_mode')}</div>
                                <button
                                    onClick={toggleTheme}
                                    style={{
                                        width: '56px',
                                        height: '28px',
                                        borderRadius: 'var(--radius-full)',
                                        background: theme === 'dark' ? 'var(--primary)' : 'var(--bg-tertiary)',
                                        border: 'none',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    <motion.div
                                        animate={{ x: theme === 'dark' ? 28 : 2 }}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {theme === 'dark' ? <Moon size={14} color="var(--primary)" /> : <Sun size={14} color="#f59e0b" />}
                                    </motion.div>
                                </button>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                {t('settings.theme_desc')}
                            </p>
                        </motion.div>

                        {/* Font Size Card */}
                        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <Type size={18} className="text-tertiary" />
                                <span style={{ fontWeight: 600 }}>{t('settings.font_size')}</span>
                            </div>
                            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
                                {['small', 'medium', 'large'].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setFontSize(size)}
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: 'none',
                                            background: fontSize === size ? 'var(--surface)' : 'transparent',
                                            color: fontSize === size ? 'var(--primary)' : 'var(--text-secondary)',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            boxShadow: fontSize === size ? 'var(--shadow-sm)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {size === 'small' ? 'A-' : size === 'medium' ? 'A' : 'A+'}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>


                {/* PWA Section */}
                <section>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Smartphone size={20} className="text-primary" />
                        {t('settings.pwa_section')}
                    </h2>
                    <motion.div variants={itemVariants} className="glass-card" style={{
                        padding: '2rem',
                        borderRadius: 'var(--radius-xl)',
                        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99, 102, 241, 0.05) 100%)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '2rem'
                    }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                                {isInstalled ? t('settings.pwa_installed') : t('settings.pwa_install_title')}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {isInstalled
                                    ? t('settings.pwa_installed_desc')
                                    : t('settings.pwa_install_desc')}
                            </p>
                        </div>

                        {!isInstalled ? (
                            <button
                                onClick={handleInstall}
                                className="btn-primary"
                                style={{
                                    padding: '0.875rem 2rem',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    opacity: (!deferredPrompt && !isIOS) ? 0.7 : 1
                                }}
                            >
                                <Download size={20} />
                                {t('settings.install_btn')}
                            </button>
                        ) : (
                            <div style={{
                                color: 'var(--success)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: 'var(--radius-lg)'
                            }}>
                                <Check size={20} />
                                {t('common.active')}
                            </div>
                        )}
                    </motion.div>
                </section>

                {/* Data & Security Section */}
                <section>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} className="text-primary" />
                        {t('settings.security_section')}
                    </h2>
                    <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--error)', marginBottom: '0.25rem' }}>{t('settings.reset_stats')}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('settings.reset_desc')}</div>
                            </div>
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--error)',
                                    background: 'transparent',
                                    color: 'var(--error)',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {t('settings.reset_btn')}
                            </button>
                        </div>
                    </motion.div>
                </section>
            </motion.div>

            {/* Reset Modal Overlay */}
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
                            zIndex: 2000,
                            padding: '1rem'
                        }}
                        onClick={() => setShowResetConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--surface)',
                                padding: '2.5rem',
                                borderRadius: 'var(--radius-2xl)',
                                maxWidth: '400px',
                                width: '100%',
                                textAlign: 'center',
                                border: '1px solid var(--border-primary)'
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                margin: '0 auto 1.5rem',
                                color: 'var(--error)'
                            }}>
                                <AlertCircle size={32} style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{t('settings.reset_confirm_title')}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                {t('settings.reset_confirm_desc')}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    style={{
                                        padding: '0.875rem',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-primary)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 700,
                                        cursor: 'pointer'
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
                                        padding: '0.875rem',
                                        borderRadius: 'var(--radius-lg)',
                                        border: 'none',
                                        background: 'var(--error)',
                                        color: 'white',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('settings.reset_clean_btn') || 'Tozalash'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
