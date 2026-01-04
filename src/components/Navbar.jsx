import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Sun, Moon, LayoutDashboard, Shield, Menu, X, BarChart3, HelpCircle, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    const closeMenu = () => setMobileMenuOpen(false);

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 2rem)',
                maxWidth: '1200px',
                height: '4rem',
                backgroundColor: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                zIndex: 1000,
                boxShadow: 'var(--shadow-lg)'
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        background: 'white'
                    }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                </Link>

                <div className="desktop-nav" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <NavItem to="/" icon={<LayoutDashboard size={18} />} label={t('common.dashboard')} active={isActive('/')} />
                    <NavItem to="/stats" icon={<BarChart3 size={18} />} label={t('common.statistics')} active={isActive('/stats')} />
                    <NavItem to="/profile" icon={<User size={18} />} label={t('common.profile')} active={isActive('/profile')} />
                    <NavItem to="/settings" icon={<Settings size={18} />} label={t('common.settings')} active={isActive('/settings')} />
                    <NavItem to="/faq" icon={<HelpCircle size={18} />} label={t('common.help')} active={isActive('/faq')} />

                    {(user.is_staff || user.is_admin) && (
                        <NavItem
                            to="/admin"
                            icon={<Shield size={18} />}
                            label={t('common.admin')}
                            active={isActive('/admin')}
                            special
                        />
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--transition-base)'
                        }}
                        className="theme-btn"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        onClick={logout}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--error)',
                            background: 'transparent',
                            color: 'var(--error)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all var(--transition-base)'
                        }}
                        className="logout-btn"
                    >
                        <LogOut size={16} />
                        <span className="hide-mobile">{t('common.logout')}</span>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mobile-menu-overlay"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999
                        }}
                        onClick={closeMenu}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="mobile-menu"
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '280px',
                            background: 'var(--surface-solid)',
                            borderLeft: '1px solid var(--border-primary)',
                            padding: '2rem 1.5rem',
                            zIndex: 1001,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{t('common.menu') || 'Menyu'}</span>
                            <button onClick={closeMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <Link to="/" onClick={closeMenu} style={mobileNavItemStyle(isActive('/'))}>
                            <LayoutDashboard size={20} /> {t('common.dashboard')}
                        </Link>
                        <Link to="/stats" onClick={closeMenu} style={mobileNavItemStyle(isActive('/stats'))}>
                            <BarChart3 size={20} /> {t('common.statistics')}
                        </Link>
                        <Link to="/profile" onClick={closeMenu} style={mobileNavItemStyle(isActive('/profile'))}>
                            <User size={20} /> {t('common.profile')}
                        </Link>
                        <Link to="/settings" onClick={closeMenu} style={mobileNavItemStyle(isActive('/settings'))}>
                            <Settings size={20} /> {t('common.settings')}
                        </Link>
                        <Link to="/faq" onClick={closeMenu} style={mobileNavItemStyle(isActive('/faq'))}>
                            <HelpCircle size={20} /> {t('common.help')}
                        </Link>
                        {user && (user.is_staff || user.is_admin) && (
                            <Link to="/admin" onClick={closeMenu} style={mobileNavItemStyle(isActive('/admin'))}>
                                <Shield size={20} /> {t('common.admin')}
                            </Link>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={toggleTheme}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    fontWeight: 600
                                }}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                {theme === 'dark' ? t('common.light_mode') || 'Yorug\' rejim' : t('common.dark_mode') || 'Qorong\'u rejim'}
                            </button>

                            <button
                                onClick={() => { logout(); closeMenu(); }}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--error)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--error)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <LogOut size={20} /> {t('common.logout')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile CSS */}
            <style>{`
                @media (max-width: 768px) {
                    .desktop-nav, .desktop-actions { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                    .nav-logo-text { display: none; }
                }
                @media (min-width: 769px) {
                    .mobile-menu-btn { display: none !important; }
                    .mobile-menu, .mobile-menu-overlay { display: none !important; }
                }
                @media (max-width: 480px) {
                    .hide-mobile { display: none; }
                }
            `}</style>
        </>
    );
};

const mobileNavItemStyle = (active) => ({
    padding: '1rem',
    borderRadius: 'var(--radius-lg)',
    background: active ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
    color: active ? 'var(--primary)' : 'var(--text-primary)',
    fontWeight: active ? 700 : 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textDecoration: 'none'
});

const NavItem = ({ to, icon, label, active, special }) => (
    <Link to={to} style={{ position: 'relative' }}>
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: active ? (special ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)') : 'transparent',
                color: active ? (special ? 'var(--primary)' : 'var(--text-primary)') : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all var(--transition-base)'
            }}
        >
            {icon}
            <span>{label}</span>
            {active && (
                <motion.div
                    layoutId="nav-active"
                    style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '20%',
                        right: '20%',
                        height: '2px',
                        background: special ? 'var(--primary)' : 'var(--text-primary)',
                        borderRadius: '2px'
                    }}
                />
            )}
        </motion.div>
    </Link>
);

export default Navbar;
