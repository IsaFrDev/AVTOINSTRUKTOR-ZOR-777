import React, { useState } from 'react';
import { User as UserIcon, Calendar, BookOpen, Clock, ChevronLeft, Shield, Edit3, Check, X, Save, Settings, Type, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import LevelBadge from '../components/LevelBadge';
import './ProfilePage.css';

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const { user, setUser } = useAuth();
    const { fontSize, setFontSize } = useSettings();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return t('profile.not_available') || 'Mavjud emas';
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRemainingDays = (dateString) => {
        if (!dateString) return 0;
        const diff = new Date(dateString) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const remainingDays = getRemainingDays(user?.limit_date);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (user.id === 'admin-id-777') {
                const updatedUser = { ...user, ...formData };
                const storageUser = { ...updatedUser };
                delete storageUser.profile_picture;
                localStorage.setItem('local_admin_session', JSON.stringify(storageUser));
                setUser(updatedUser);
                setIsEditing(false);
                alert(t('profile.success_update') || "Profil muvaffaqiyatli yangilandi");
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(formData)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            const localPic = localStorage.getItem(`profile_picture_${user.id}`);
            const updatedUser = { ...user, ...data };
            if (localPic) {
                updatedUser.profile_picture = localPic;
            }

            setUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert(t('profile.error_system') || 'Tizimda xatolik yuz berdi. Iltimos qaytadan urunib ko\'ring.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert(t('profile.image_too_large') || "Rasm hajmi juda katta. Iltimos 10MB dan kichik rasm yuklang.");
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;

                try {
                    localStorage.setItem(`profile_picture_${user.id}`, base64String);
                    const updatedUser = { ...user, profile_picture: base64String };
                    setUser(updatedUser);

                    if (user.id === 'admin-id-777') {
                        const storageUser = { ...updatedUser };
                        delete storageUser.profile_picture;
                        localStorage.setItem('local_admin_session', JSON.stringify(storageUser));
                    }
                } catch (storageError) {
                    if (storageError.name === 'QuotaExceededError') {
                        alert(t('profile.quota_exceeded') || "Brauzer xotirasi to'ldi. Iltimos, kichikroq rasm yuklang.");
                    } else {
                        throw storageError;
                    }
                }
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error("Local upload error:", error);
            alert(t('profile.save_error') || 'Rasm saqlashda xatolik yuz berdi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="profile-page fade-in responsive-container">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="text-responsive-h1" style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.03em'
                        }}>
                            {t('profile.title')}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t('profile.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all var(--transition-base)'
                        }}
                        className="hover-scale"
                    >
                        <ChevronLeft size={20} /> {t('common.back')}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {/* User Info Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="profile-card"
                    >
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    border: 'none',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Edit3 size={18} />
                            </button>
                        )}

                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                {user?.profile_picture ? (
                                    (() => {
                                        const imgSrc = user.profile_picture && (user.profile_picture.startsWith('http') || user.profile_picture.startsWith('data:')) ? user.profile_picture : `/img/${(user.profile_picture || '').replace('img/', '')}`;
                                        return (
                                            <img
                                                src={imgSrc}
                                                alt="Profile"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        );
                                    })()
                                ) : (
                                    user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()
                                )}
                            </div>

                            <label style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                width: '36px',
                                height: '36px',
                                zIndex: 10,
                                borderRadius: '50%',
                                background: 'var(--surface-solid)',
                                border: '1px solid var(--border-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--primary)',
                                boxShadow: 'var(--shadow-md)',
                                transition: 'all 0.2s'
                            }} className="hover-scale">
                                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                                {uploading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : <Edit3 size={16} />}
                            </label>
                        </div>

                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                                >
                                    <input
                                        type="text"
                                        placeholder={t('profile.first_name') || "Ism"}
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <input
                                        type="text"
                                        placeholder={t('profile.last_name') || "Familiya"}
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button onClick={handleSave} disabled={loading} style={saveButtonStyle}>
                                            <Save size={18} /> {t('common.save')}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} style={cancelButtonStyle}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                        {user?.first_name} {user?.last_name}
                                    </h2>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1.25rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '9999px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {user?.is_staff ? <Shield size={16} /> : <UserIcon size={16} />}
                                        {user?.is_staff ? t('profile.administrator') : t('profile.user')}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Level Badge */}
                        <div style={{ marginBottom: '2rem' }}>
                            <LevelBadge showDetails={true} size="large" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {user?.completed_mavzular?.length || 0}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profile.topics_count')}</div>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>
                                    {remainingDays}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profile.remaining_days')}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Details Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="profile-details-card"
                    >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '1rem' }}>
                            {t('profile.details_title')}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <DetailItem
                                icon={<UserIcon size={20} />}
                                label={t('profile.username')}
                                value={user?.username}
                            />
                            <DetailItem
                                icon={<Calendar size={20} />}
                                label={t('profile.registration_date')}
                                value={formatDate(user?.date_joined)}
                            />
                            <DetailItem
                                icon={<Clock size={20} />}
                                label={t('profile.expiry_date')}
                                value={formatDate(user?.limit_date)}
                                subValue={remainingDays > 0 ? `(${remainingDays} ${t('profile.remaining_days')})` : `(${t('common.offline')})`}
                                color={remainingDays > 0 ? 'var(--success)' : 'var(--error)'}
                            />
                            <DetailItem
                                icon={<BookOpen size={20} />}
                                label={t('profile.completed_topics')}
                                value={t('dashboard.questions_count', { count: user?.completed_mavzular?.length || 0 })}
                            />
                        </div>

                        <div style={{
                            marginTop: '3rem',
                            padding: '1.5rem',
                            background: 'rgba(99, 102, 241, 0.03)',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px dashed var(--primary)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem'
                        }}>
                            <Shield size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {t('profile.admin_contact')}
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value, subValue, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: color || 'var(--text-primary)', wordBreak: 'break-word' }}>
                {value} <span style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.7 }}>{subValue}</span>
            </div>
        </div>
    </div>
);

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': {
        borderColor: 'var(--primary)'
    }
};

const saveButtonStyle = {
    flex: 1,
    padding: '0.75rem',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem'
};

const cancelButtonStyle = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
};

export default ProfilePage;
