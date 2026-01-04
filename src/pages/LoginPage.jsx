import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Eye, EyeOff, Loader2, ArrowRight,
    Sun, Moon, ShieldCheck, Car
} from 'lucide-react';

const LoginPage = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, signup } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (cleanUsername.length < 3) {
            setError(t('login.error_login_short'));
            setLoading(false);
            return;
        }

        if (cleanPassword.length < 6) {
            setError(t('login.error_password_short'));
            setLoading(false);
            return;
        }

        // Email formatini yasash
        const emailToUse = cleanUsername.includes('@')
            ? cleanUsername
            : `${cleanUsername.replace(/\s+/g, '')}@avto.uz`;

        try {
            const { success, message, user } = await login(emailToUse, cleanPassword);
            if (success) {
                // Check if admin
                if (user?.is_admin || user?.is_staff || user?.user_metadata?.is_admin || user?.user_metadata?.is_staff) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                setError(message || t('login.error_invalid'));
            }
        } catch (err) {
            setError(t('login.error_system'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Dynamic Background Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '40vw',
                height: '40vw',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-5%',
                width: '35vw',
                height: '35vw',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                zIndex: 0
            }} />

            {/* Theme Toggle */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </motion.button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    zIndex: 1
                }}
            >
                <div className="glass-card" style={{
                    padding: '3rem',
                    borderRadius: 'var(--radius-2xl)',
                    textAlign: 'center'
                }}>
                    {/* Logo Section */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ marginBottom: '2.5rem' }}
                    >
                        <div style={{
                            width: '90px',
                            height: '90px',
                            margin: '0 auto 1.5rem',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 15px 35px rgba(99, 102, 241, 0.3)',
                            background: 'white',
                            overflow: 'hidden'
                        }}>
                            <img src="/logo.png" alt="AVTOINSTRUKTOR ZOR 777" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2.25rem',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {t('login.welcome')}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                            {t('login.platform')}
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={20} />
                            <input
                                type="text"
                                placeholder={t('login.username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('login.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={inputStyle}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1.25rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-tertiary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        color: 'var(--error)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        textAlign: 'left',
                                        padding: '0 0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <AlertTriangle size={16} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                height: '3.5rem'
                            }}
                        >
                            {loading ? <Loader2 className="spinner" size={24} /> : (
                                <>
                                    <span>{t('login.login_btn')}</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 600 }}>
                        <ShieldCheck size={16} />
                        <span>{t('login.secure_connection')}</span>
                    </div>
                </div>

                <p style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    © 2025 AVTOINSTRUKTOR ZOR 777
                </p>
            </motion.div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '1rem 1.25rem 1rem 3.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)'
};

const AlertTriangle = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export default LoginPage;
