import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Timer, AlertCircle, HelpCircle, Check, BookOpen } from 'lucide-react';
import { supabase } from '../supabase';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const QuizPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const query = new URLSearchParams(location.search);
    const topicId = query.get('topicId');
    const mode = query.get('mode');

    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null); // Dinamik hisoblanadi

    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                let query = supabase
                    .from('questions')
                    .select('*, topic:topics(name)');

                if (topicId) {
                    query = query.eq('topic_id', topicId);
                }

                const { data, error } = await query;

                if (error) throw error;

                let qList = data;

                if (mode === 'exam') {
                    qList = shuffleArray(qList);
                } else if (topicId) {
                    qList = shuffleArray(qList).slice(0, 20);
                }

                setQuestions(qList);

                // Imtihon uchun dinamik vaqt - har bir savol uchun 90 soniya (1.5 minut)
                if (mode === 'exam') {
                    setTimeLeft(qList.length * 90); // 90 soniya * savollar soni
                }

                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Savollarni yuklashda xatolik yuz berdi');
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [topicId, mode]);

    useEffect(() => {
        if (timeLeft === 0) {
            setShowResults(true);
            return;
        }
        if (timeLeft === null) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (choiceIdx) => {
        if (showResults) return;

        // Imtihon rejimida oddiy tanlov
        if (mode === 'exam') {
            setUserAnswers({ ...userAnswers, [currentIdx]: choiceIdx });
            return;
        }

        // Mashq rejimida - javob ko'rsatish va keyingi savolga o'tish
        if (answered) return;

        setSelectedAnswer(choiceIdx);
        setUserAnswers({ ...userAnswers, [currentIdx]: choiceIdx });
        setAnswered(true);

        // 1.5 soniyadan keyin keyingi savolga o'tish
        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(prev => prev + 1);
                setAnswered(false);
                setSelectedAnswer(null);
            } else {
                setShowResults(true);
            }
        }, 1500);
    };

    const currentQuestion = questions[currentIdx];

    const getImageUrl = (url) => {
        if (!url) return null;

        // Force local path logic (Copied from AdminPanel fix)
        if (url.includes('img/') && url.includes('photo_')) {
            const clean = url.split('img/')[1];
            return `/img/${clean}`;
        }

        if (!url.startsWith('http') && !url.startsWith('/')) {
            if (url.startsWith('img/')) return `/${url}`;
            return `/img/${url}`;
        }

        return url;
    };

    const score = questions.reduce((acc, q, idx) => {
        return acc + (userAnswers[idx] === q.correct_answer_index ? 1 : 0);
    }, 0);
    const pass = (questions.length > 0) ? (score >= (questions.length * 0.9)) : false;

    useEffect(() => {
        const updateProgress = async () => {
            if (showResults && pass && topicId && user && !user.completed_mavzular.includes(parseInt(topicId))) {
                try {
                    const newCompleted = [...(user.completed_mavzular || []), parseInt(topicId)];
                    // completed_mavzular jsonb array, so we overwrite it
                    const { data, error } = await supabase
                        .from('profiles')
                        .update({ completed_mavzular: newCompleted })
                        .eq('id', user.id)
                        .select()
                        .single();

                    if (error) throw error;
                    if (setUser) setUser({ ...user, ...data });
                } catch (error) {
                    console.error('Failed to update progress', error);
                }
            }
        };

        updateProgress();
    }, [showResults, pass, topicId, user, setUser]);

    // Mashq rejimida javob rangini aniqlash
    const getChoiceStyle = (idx) => {
        const isSelected = mode === 'exam'
            ? userAnswers[currentIdx] === idx
            : selectedAnswer === idx;

        // Mashq rejimida javob berilgandan keyin ranglarni ko'rsatish
        if (mode !== 'exam' && answered) {
            const isCorrect = idx === currentQuestion.correct_answer_index;
            const isUserChoice = selectedAnswer === idx;

            if (isCorrect) {
                // To'g'ri javob - yashil
                return {
                    borderColor: 'var(--success)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                };
            } else if (isUserChoice && !isCorrect) {
                // Noto'g'ri tanlangan javob - qizil
                return {
                    borderColor: 'var(--error)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                };
            }
        }

        // Oddiy holat
        return {
            borderColor: isSelected ? 'var(--primary)' : 'var(--border-primary)',
            background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)'
        };
    };

    // Javob ikonkasini aniqlash
    const getChoiceIcon = (idx) => {
        if (mode !== 'exam' && answered) {
            const isCorrect = idx === currentQuestion.correct_answer_index;
            const isUserChoice = selectedAnswer === idx;

            if (isCorrect) {
                return <CheckCircle2 size={20} color="var(--success)" />;
            } else if (isUserChoice && !isCorrect) {
                return <XCircle size={20} color="var(--error)" />;
            }
        }
        return null;
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
            <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Savollar tayyorlanmoqda...</p>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
            <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{error}</h2>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                Bosh sahifaga qaytish
            </button>
        </div>
    );

    if (questions.length === 0) return (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
            <HelpCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Ushbu bo'limda savollar mavjud emas</h2>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                Boshqa bo'limni tanlash
            </button>
        </div>
    );

    if (showResults) {
        return (
            <div className="fade-in">
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: pass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2rem', color: pass ? 'var(--success)' : 'var(--error)'
                    }}>
                        {pass ? <CheckCircle2 size={56} /> : <XCircle size={56} />}
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        {pass ? 'Tabriklaymiz!' : 'Natija yetarli emas'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '3rem' }}>
                        {pass ? 'Siz imtihondan muvaffaqiyatli o\'tdingiz.' : 'Yana bir bor urinib ko\'ring.'}
                    </p>

                    <div style={{
                        display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '4rem',
                        flexWrap: 'wrap'
                    }}>
                        <StatCard label="Jami savollar" value={questions.length} />
                        <StatCard label="To'g'ri javoblar" value={score} color="var(--success)" />
                        <StatCard label="Xato javoblar" value={questions.length - score} color="var(--error)" />
                        <StatCard label="Foiz" value={`${Math.round((score / questions.length) * 100)}%`} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-xl)' }}>
                            Qayta topshirish
                        </button>
                        <button onClick={() => navigate('/')} style={{
                            padding: '1rem 2.5rem', borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
                            fontWeight: 700, cursor: 'pointer'
                        }}>
                            Dashboardga qaytish
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-page fade-in" style={{ paddingBottom: '4rem' }}>
            {/* Quiz Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="icon-btn" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                            {mode === 'exam' ? 'Imtihon' : 'Mashq'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            <BookOpen size={14} />
                            <span>{currentIdx + 1} / {questions.length}</span>
                            {mode !== 'exam' && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>(Mashq: 20 savol)</span>}
                        </div>
                    </div>
                </div>

                {mode === 'exam' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-full)',
                        background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: timeLeft < 300 ? 'var(--error)' : 'var(--primary)',
                        fontWeight: 800, border: '1px solid currentColor'
                    }}>
                        <Timer size={20} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div style={{
                width: '100%', height: '8px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-full)', marginBottom: '3rem', overflow: 'hidden',
                border: '1px solid var(--border-primary)'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
                />
            </div>

            {/* Question Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }} className="quiz-grid">
                <motion.div
                    key={currentIdx}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{
                        background: 'var(--surface)', padding: '2.5rem',
                        borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    {currentQuestion.image_url && (
                        <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
                            <img src={getImageUrl(currentQuestion.image_url)} alt="Question" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f8fafc' }} />
                        </div>
                    )}

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '2.5rem', color: 'var(--text-primary)' }}>
                        {currentQuestion.text}
                    </h3>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {currentQuestion.choices.map((choice, idx) => {
                            const choiceStyle = getChoiceStyle(idx);
                            const icon = getChoiceIcon(idx);
                            const isSelected = mode === 'exam'
                                ? userAnswers[currentIdx] === idx
                                : selectedAnswer === idx;

                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={!answered ? { x: 5 } : {}}
                                    whileTap={!answered ? { scale: 0.99 } : {}}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={mode !== 'exam' && answered}
                                    style={{
                                        padding: '1.25rem 1.5rem',
                                        borderRadius: 'var(--radius-xl)',
                                        border: '2px solid',
                                        borderColor: choiceStyle.borderColor,
                                        background: choiceStyle.background,
                                        boxShadow: choiceStyle.boxShadow || 'none',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.25rem',
                                        cursor: (mode !== 'exam' && answered) ? 'default' : 'pointer',
                                        transition: 'all 0.3s',
                                        color: 'var(--text-primary)',
                                        opacity: (mode !== 'exam' && answered && !icon && selectedAnswer !== idx) ? 0.6 : 1
                                    }}
                                >
                                    <div style={{
                                        minWidth: '32px', height: '32px', borderRadius: '10px',
                                        background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                                        color: isSelected ? 'white' : 'var(--text-tertiary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '0.875rem'
                                    }}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>{choice}</span>
                                    {icon}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Mashq rejimida javob holati */}
                    {mode !== 'exam' && answered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: '2rem',
                                padding: '1rem 1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                background: selectedAnswer === currentQuestion.correct_answer_index
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${selectedAnswer === currentQuestion.correct_answer_index ? 'var(--success)' : 'var(--error)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            {selectedAnswer === currentQuestion.correct_answer_index ? (
                                <>
                                    <CheckCircle2 size={24} color="var(--success)" />
                                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>To'g'ri javob! 🎉</span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={24} color="var(--error)" />
                                    <span style={{ fontWeight: 700, color: 'var(--error)' }}>
                                        Noto'g'ri. To'g'ri javob: {String.fromCharCode(65 + currentQuestion.correct_answer_index)}
                                    </span>
                                </>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                {/* Question Navigator */}
                <div style={{
                    background: 'var(--surface)', padding: '1.5rem',
                    borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-md)', position: 'sticky', top: '2rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Jarayon</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                            {Object.keys(userAnswers).length} / {questions.length} javob berildi
                        </span>
                    </div>

                    {/* Progress circle */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-xl)'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: `conic-gradient(var(--primary) ${(Object.keys(userAnswers).length / questions.length) * 360}deg, var(--bg-tertiary) 0deg)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'var(--surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    {currentIdx + 1}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    / {questions.length}
                                </span>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Hozirgi savol
                        </span>
                    </div>

                    <button
                        onClick={() => setShowResults(true)}
                        className="btn-primary"
                        style={{
                            width: '100%', padding: '1rem', borderRadius: 'var(--radius-lg)',
                            fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                        }}
                    >
                        <Check size={18} />
                        Testni yakunlash
                    </button>
                </div>
            </div>

            {/* Navigation Buttons Bottom - faqat imtihon rejimida */}
            {mode === 'exam' && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem',
                    gap: '1rem'
                }}>
                    <button
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        style={{
                            padding: '1rem 2rem', borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--border-primary)', background: 'var(--surface)',
                            fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            opacity: currentIdx === 0 ? 0.5 : 1
                        }}
                    >
                        <ChevronLeft size={20} /> Ortga
                    </button>

                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={() => setShowResults(true)}
                            className="btn-primary"
                            style={{ padding: '1rem 3rem', borderRadius: 'var(--radius-xl)' }}
                        >
                            Yakunlash
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="btn-primary"
                            style={{
                                padding: '1rem 3rem', borderRadius: 'var(--radius-xl)',
                                display: 'flex', alignItems: 'center', gap: '0.75rem'
                            }}
                        >
                            Keyingisi <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, color = 'var(--primary)' }) => (
    <div style={{
        background: 'var(--bg-secondary)',
        padding: '1.5rem 2rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-primary)',
        minWidth: '160px'
    }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
    </div>
);

export default QuizPage;
