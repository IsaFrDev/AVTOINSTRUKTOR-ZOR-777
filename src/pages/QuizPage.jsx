import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Timer, BookOpen, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '../supabase';
import api, { API_BASE_URL, quizApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Confetti, { SuccessCheck, WrongX, ShakeWrapper } from '../components/Confetti';
import LevelBadge from '../components/LevelBadge';

const getTrans = (val, lang) => {
    if (!val) return '';
    // Agar string bo'lsa - shundayligicha qaytarish
    if (typeof val === 'string') {
        return val;
    }
    // Agar object bo'lsa - faqat uzbekchani yoki birinchisini qaytarish
    return val['uz'] || val[Object.keys(val)[0]] || '';
};

const getChoices = (choices, lang) => {
    if (!choices) return [];
    // Agar array bo'lsa - shundayligicha qaytarish
    if (Array.isArray(choices)) {
        return choices;
    }
    // Agar object bo'lsa - faqat uzbekchani
    return choices['uz'] || choices[Object.keys(choices)[0]] || [];
};

const QuizPage = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const { addCorrectAnswer, addWrongAnswer } = useProgress();

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
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [questionTimes, setQuestionTimes] = useState({}); // { 0: 5, 1: 10, ... }
    const [imageError, setImageError] = useState(false);
    const [statsRecorded, setStatsRecorded] = useState(false);

    // Question Start Time reset on index change
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentIdx]);

    // Animation states
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSuccessCheck, setShowSuccessCheck] = useState(false);
    const [showWrongX, setShowWrongX] = useState(false);
    const [shake, setShake] = useState(false);

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Local imports inside useEffect or at top level? better to import at top level
    // But since we are editing inside the component, let's just create a loader function that uses the imported json if possible
    // Wait, we need to import the json file first. 
    // Let's modify the top of the file to import the json first. 

    // Actually, I will replace the whole useEffect to load from local json which I will assume is available or I will fetch it.
    // Better to fetch it from the public folder or import it if it's in src.
    // The previous `find_by_name` showed `savollar.json` at root. 
    // Let's assume we can fetch it via HTTP since it might be in public or just import it.
    // Wait, the file is at root `c:\Users\hp\Desktop\AVTOINSTRUKTOR ZOR 777\savollar.json`. 
    // Vite likely serves root files. Let's try fetching '/savollar.json'.

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                let data;

                if (mode === 'exam') {
                    // Ekzamen rejimi
                    const response = await quizApi.getExamQuestions();
                    data = response.questions;
                    setTimeLeft(data.length * 90); // 1.5 daqiqa har bir savolga
                } else if (topicId) {
                    // Mavzu bo'yicha
                    // getTopicQuiz (20 ta random) yoki getQuestionsByTopic (hammasi)
                    // Hozirgi mantiq bo'yicha practice mode hammasini yoki 20 tasini ko'rsatishi mumkin
                    // User interfeysida 20 ta ko'rsatilgani uchun getTopicQuiz ishlatamiz
                    const response = await quizApi.getTopicQuiz(topicId);
                    data = response.questions;
                } else {
                    // Fallback to random if nothing specified
                    const response = await quizApi.getRandomQuestions(20);
                    data = response.questions;
                }

                if (!data || data.length === 0) {
                    // Agar API bo'sh qaytarsa yoki xato bo'lsa
                    setError(t('quiz.not_found'));
                } else {
                    setQuestions(data);
                }

                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(t('quiz.error_fetch') || 'Savollarni yuklashda xatolik yuz berdi');
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [topicId, mode]);

    useEffect(() => {
        setImageError(false);
    }, [currentIdx]);

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

    // Anti-cheat & Security - TEMPORARILY DISABLED for development
    // useEffect(() => {
    //     const handleContextMenu = (e) => e.preventDefault();
    //     const handleKeyDown = (e) => {
    //         if (
    //             e.key === 'F12' ||
    //             (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
    //             (e.ctrlKey && (e.key === 'u' || e.key === 'c' || e.key === 'a')) ||
    //             e.key === 'PrintScreen'
    //         ) {
    //             e.preventDefault();
    //         }
    //     };
    //
    //     const preventSelection = (e) => e.preventDefault();
    //
    //     document.addEventListener('contextmenu', handleContextMenu);
    //     document.addEventListener('keydown', handleKeyDown);
    //     document.addEventListener('selectstart', preventSelection);
    //     document.addEventListener('copy', preventSelection);
    //     document.addEventListener('cut', preventSelection);
    //     document.addEventListener('paste', preventSelection);
    //
    //     return () => {
    //         document.removeEventListener('contextmenu', handleContextMenu);
    //         document.removeEventListener('keydown', handleKeyDown);
    //         document.removeEventListener('selectstart', preventSelection);
    //         document.removeEventListener('copy', preventSelection);
    //         document.removeEventListener('cut', preventSelection);
    //         document.removeEventListener('paste', preventSelection);
    //     };
    // }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (choiceIdx) => {
        if (showResults) return;
        if (answered) return;

        setSelectedAnswer(choiceIdx);
        setUserAnswers({ ...userAnswers, [currentIdx]: choiceIdx });
        setAnswered(true);

        const isCorrect = choiceIdx === currentQuestion.correct_answer_index;
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        setQuestionTimes(prev => ({ ...prev, [currentIdx]: (prev[currentIdx] || 0) + timeSpent }));

        // Progress tracking
        if (isCorrect) {
            addCorrectAnswer(mode === 'exam' ? currentQuestion.topic_id : topicId, timeSpent);
            setShowConfetti(true);
            setShowSuccessCheck(true);
            setTimeout(() => {
                setShowConfetti(false);
                setShowSuccessCheck(false);
            }, 1500);
        } else {
            addWrongAnswer(mode === 'exam' ? currentQuestion.topic_id : topicId, timeSpent);
            setShake(true);
            setShowWrongX(true);
            setTimeout(() => {
                setShake(false);
                setShowWrongX(false);
            }, 800);
        }

        // 1.5 soniyadan keyin keyingi savolga o'tish
        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(prev => prev + 1);
                setAnswered(false);
                setSelectedAnswer(null);
                setQuestionStartTime(Date.now());
            } else {
                setShowResults(true);
            }
        }, 1500);
    };

    const currentQuestion = questions[currentIdx];

    const getImageUrl = (url) => {
        if (!url) return null;

        // If it's already a Django media URL, return as is
        if (url.startsWith('/media/')) {
            return url;
        }

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
            if (!showResults || !pass || !topicId || !user) return;

            const currentCompleted = user.completed_mavzular || [];
            const isAlreadyCompleted = currentCompleted.some(id => id.toString() === topicId.toString());

            if (!isAlreadyCompleted) {
                try {
                    // Mavzu ID sini tegishli turga o'tkazamiz (odatda integer)
                    const topicIdToSave = isNaN(topicId) ? topicId : parseInt(topicId);
                    const newCompleted = [...currentCompleted, topicIdToSave];

                    const { data, error } = await supabase
                        .from('profiles')
                        .update({ completed_mavzular: newCompleted })
                        .eq('id', user.id)
                        .select()
                        .single();

                    if (error) throw error;
                    if (setUser) setUser(data);
                } catch (error) {
                    console.error('Failed to update progress', error);
                }
            }
        };

        updateProgress();
    }, [showResults, pass, topicId, user]);

    // Javob rangini aniqlash - ikkala rejimda ham
    const getChoiceStyle = (idx) => {
        const isSelected = selectedAnswer === idx;

        // Javob berilgandan keyin ranglarni ko'rsatish
        if (answered) {
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

    // Javob ikonkasini aniqlash - ikkala rejimda ham
    const getChoiceIcon = (idx) => {
        if (answered) {
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
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('quiz.loading')}</p>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
            <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{error}</h2>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                {t('quiz.back_dashboard')}
            </button>
        </div>
    );

    if (questions.length === 0) return (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)' }}>
            <HelpCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{t('quiz.not_found')}</h2>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                {t('quiz.select_other')}
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
                        {pass ? t('quiz.congrats') : t('quiz.failed')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '3rem' }}>
                        {pass ? t('quiz.pass_msg') : t('quiz.fail_msg')}
                    </p>

                    <div style={{
                        display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '4rem',
                        flexWrap: 'wrap'
                    }}>
                        <StatCard label={t('quiz.stat_total')} value={questions.length} />
                        <StatCard label={t('quiz.stat_correct')} value={score} color="var(--success)" />
                        <StatCard label={t('quiz.stat_wrong')} value={questions.length - score} color="var(--error)" />
                        <StatCard label={t('quiz.stat_percent')} value={`${Math.round((score / questions.length) * 100)}%`} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-xl)' }}>
                            {t('quiz.retry')}
                        </button>
                        <button onClick={() => navigate('/')} style={{
                            padding: '1rem 2.5rem', borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
                            fontWeight: 700, cursor: 'pointer'
                        }}>
                            {t('quiz.back_dashboard')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Navigation helper for exam mode
    const handleNavigate = (newIdx) => {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        setQuestionTimes(prev => ({ ...prev, [currentIdx]: (prev[currentIdx] || 0) + timeSpent }));
        setCurrentIdx(newIdx);
    };

    return (
        <div
            className="quiz-page fade-in responsive-container"
            style={{
                paddingBottom: '4rem',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Animations */}
            <Confetti active={showConfetti} />
            <AnimatePresence>
                {showSuccessCheck && <SuccessCheck show={showSuccessCheck} key="success" />}
                {showWrongX && <WrongX show={showWrongX} key="wrong" />}
            </AnimatePresence>

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
                        <h2 className="text-responsive-h1" style={{ color: 'var(--text-primary)' }}>
                            {mode === 'exam' ? t('quiz.exam') : t('quiz.practice')}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            <BookOpen size={14} />
                            <span>{currentIdx + 1} / {questions.length}</span>
                            {mode !== 'exam' && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>({t('quiz.practice')}: {t('quiz.questions_count_suffix', { count: questions.length })})</span>}
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
            <div className="quiz-grid" style={{ alignItems: 'start' }}>
                <ShakeWrapper shake={shake}>
                    <motion.div
                        key={currentIdx}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        style={{
                            background: 'var(--surface)', padding: 'clamp(1rem, 5vw, 2.5rem)',
                            borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-primary)',
                            boxShadow: 'var(--shadow-lg)'
                        }}
                    >
                        {currentQuestion.image_url && !imageError && (
                            <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
                                <img
                                    src={getImageUrl(currentQuestion.image_url)}
                                    alt="Question"
                                    onError={() => setImageError(true)}
                                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f8fafc' }}
                                />
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '2.5rem', color: 'var(--text-primary)' }}>
                            {getTrans(currentQuestion.question_text, i18n.language)}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {getChoices(currentQuestion.choices, i18n.language).map((choice, idx) => {
                                const choiceStyle = getChoiceStyle(idx);
                                const icon = getChoiceIcon(idx);
                                const isSelected = selectedAnswer === idx;

                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={!answered ? { x: 5 } : {}}
                                        whileTap={!answered ? { scale: 0.99 } : {}}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={answered}
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
                                            cursor: answered ? 'default' : 'pointer',
                                            transition: 'all 0.3s',
                                            color: 'var(--text-primary)',
                                            opacity: (answered && !icon && selectedAnswer !== idx) ? 0.6 : 1
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

                        {/* Javob holati - ikkala rejimda ham */}
                        {answered && (
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
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{t('quiz.correct_msg')}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={24} color="var(--error)" />
                                        <span style={{ fontWeight: 700, color: 'var(--error)' }}>
                                            {t('quiz.wrong_msg', { choice: String.fromCharCode(65 + currentQuestion.correct_answer_index) })}
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </ShakeWrapper>

                {/* Question Navigator */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '1.5rem'
                }}>
                    <div style={{
                        background: 'var(--surface)', padding: '1.5rem',
                        borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-md)', position: 'sticky', top: '2rem'
                    }}>
                        {/* Level Badge */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <LevelBadge showDetails={true} size="small" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t('quiz.process')}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                {t('quiz.answered', { count: Object.keys(userAnswers).length, total: questions.length })}
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
                                {t('quiz.current_question_label')}
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                                setQuestionTimes(prev => ({ ...prev, [currentIdx]: (prev[currentIdx] || 0) + timeSpent }));
                                setShowResults(true);
                            }}
                            className="btn-primary"
                            style={{
                                width: '100%', padding: '1rem', borderRadius: 'var(--radius-lg)',
                                fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                            }}
                        >
                            <Check size={18} />
                            {t('quiz.finish')}
                        </button>
                    </div>
                </div>
            </div>
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
