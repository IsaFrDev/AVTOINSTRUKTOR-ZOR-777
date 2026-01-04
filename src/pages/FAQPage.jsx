import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, BookOpen, Trophy, Settings, Users, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQPage = () => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState(null);
    const commonCategories = t('faq.categories', { returnObjects: true });
    const allItems = t('faq.items', { returnObjects: true });

    const faqCategories = [
        {
            title: commonCategories.basic,
            icon: HelpCircle,
            color: '#6366f1',
            items: allItems.basic || []
        },
        {
            title: commonCategories.points,
            icon: Trophy,
            color: '#f59e0b',
            items: allItems.points || []
        },
        {
            title: commonCategories.settings,
            icon: Settings,
            color: '#10b981',
            items: allItems.settings || []
        },
        {
            title: commonCategories.exam_prep,
            icon: BookOpen,
            color: '#a855f7',
            items: allItems.exam_prep || []
        }
    ];

    return (
        <div className="faq-page fade-in responsive-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem', textAlign: 'center' }}
            >
                <h1 className="text-responsive-h1" style={{
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ❓ {t('faq.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {t('faq.subtitle')}
                </p>
            </motion.div>

            {/* FAQ Categories */}
            {faqCategories.map((category, catIdx) => (
                <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.1 }}
                    style={{
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border-primary)'
                    }}
                >
                    {/* Category Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-primary)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-lg)',
                            background: `${category.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <category.icon size={20} style={{ color: category.color }} />
                        </div>
                        <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>{category.title}</h2>
                    </div>

                    {/* FAQ Items */}
                    {category.items.map((item, itemIdx) => {
                        const globalIndex = `${catIdx}-${itemIdx}`;
                        const isOpen = openIndex === globalIndex;

                        return (
                            <motion.div
                                key={itemIdx}
                                style={{
                                    marginBottom: itemIdx < category.items.length - 1 ? '0.75rem' : 0
                                }}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: isOpen ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                        border: 'none',
                                        borderRadius: isOpen ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {item.q}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{
                                                padding: '1rem',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.7,
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            ))}

            {/* Contact */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    borderRadius: 'var(--radius-2xl)',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'white'
                }}
            >
                <MessageCircle size={40} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{t('faq.contact_title')}</h3>
                <p style={{ opacity: 0.9, marginBottom: '1rem' }}>
                    {t('faq.contact_text')}
                </p>
                <a
                    href="https://t.me/Qobiljona"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid white',
                        background: 'transparent',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                    }}
                    className="hover-scale"
                >
                    {t('faq.contact_btn')}
                </a>
            </motion.div>
        </div>
    );
};

export default FAQPage;
