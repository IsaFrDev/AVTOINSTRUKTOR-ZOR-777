import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../context/SettingsContext';

const InstallPWA = () => {
    const { t } = useTranslation();
    const { deferredPrompt, setDeferredPrompt } = useSettings();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (deferredPrompt) {
            // Faqat bir marta ko'rsatamiz (yoki logic bo'yicha)
            const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!isDismissed) {
                const timer = setTimeout(() => setVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [deferredPrompt]);

    const onClick = (e) => {
        e.preventDefault();
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install');
                setDeferredPrompt(null);
            } else {
                console.log('User dismissed the PWA install');
            }
            setVisible(false);
        });
    };

    const onDismiss = () => {
        setVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!deferredPrompt) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        width: '90%',
                        maxWidth: '400px'
                    }}
                >
                    <div style={{
                        background: 'var(--surface)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-xl)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            flexShrink: 0
                        }}>
                            <Smartphone size={24} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('pwa.title')}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {t('pwa.msg')}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                onClick={onClick}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={onDismiss}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPWA;
