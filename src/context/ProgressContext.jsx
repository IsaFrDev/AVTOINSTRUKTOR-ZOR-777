import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProgressContext = createContext();

export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgress must be used within a ProgressProvider');
    }
    return context;
};

// Daraja tizimlari
const LEVELS = [
    { key: "beginner", minPoints: 0, color: '#10b981', emoji: '🌱', bg: 'rgba(16, 185, 129, 0.1)' },
    { key: "learner", minPoints: 51, color: '#3b82f6', emoji: '📚', bg: 'rgba(59, 130, 246, 0.1)' },
    { key: "intermediate", minPoints: 151, color: '#8b5cf6', emoji: '⭐', bg: 'rgba(139, 92, 246, 0.1)' },
    { key: "advanced", minPoints: 301, color: '#f59e0b', emoji: '🏆', bg: 'rgba(245, 158, 11, 0.1)' },
    { key: "expert", minPoints: 501, color: '#ef4444', emoji: '🔥', bg: 'rgba(239, 68, 68, 0.1)' },
    { key: "master", minPoints: 1001, color: '#06b6d4', emoji: '💎', bg: 'rgba(6, 182, 212, 0.1)' }
];

export const ProgressProvider = ({ children }) => {
    const { user } = useAuth();

    // Create a key prefix based on user ID
    // If no user is logged in, we use 'guest' prefix to separate from actual users
    const getStorageKey = (userId) => `quizStats_${userId || 'guest'}`;

    // Helper to get initial stats
    const getInitialStats = (userId) => {
        const key = getStorageKey(userId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {
            totalPoints: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            totalQuestions: 0,
            totalTimeSpent: 0, // seconds
            topicStats: {}, // { topicId: { correct, wrong } }
            streak: 0, // Ketma-ket to'g'ri javoblar
            bestStreak: 0,
            lastPlayDate: null
        };
    };

    // Initialize with current user or guest
    const [stats, setStats] = useState(() => getInitialStats(user?.id));

    // When user changes (login/logout), reload stats for that user
    useEffect(() => {
        setStats(getInitialStats(user?.id));
    }, [user?.id]); // Only run if ID changes

    // Update localStorage whenever stats change
    useEffect(() => {
        const key = getStorageKey(user?.id);
        localStorage.setItem(key, JSON.stringify(stats));
    }, [stats, user?.id]);

    // Joriy daraja
    const getCurrentLevel = () => {
        const points = stats.totalPoints;
        let currentLevel = LEVELS[0];

        for (const level of LEVELS) {
            if (points >= level.minPoints) {
                currentLevel = level;
            }
        }

        return currentLevel;
    };

    // Keyingi daraja
    const getNextLevel = () => {
        const points = stats.totalPoints;
        for (const level of LEVELS) {
            if (points < level.minPoints) {
                return level;
            }
        }
        return null; // Max darajaga yetgan
    };

    // Progress foizi (keyingi darajagacha)
    const getLevelProgress = () => {
        const currentLevel = getCurrentLevel();
        const nextLevel = getNextLevel();

        if (!nextLevel) return 100;

        const currentMin = currentLevel.minPoints;
        const nextMin = nextLevel.minPoints;
        const progress = ((stats.totalPoints - currentMin) / (nextMin - currentMin)) * 100;

        return Math.min(Math.max(progress, 0), 100);
    };

    // To'g'ri javob qo'shish
    const addCorrectAnswer = (topicId = null, timeSpent = 0) => {
        setStats(prev => {
            const newTopicStats = { ...prev.topicStats };
            if (topicId) {
                if (!newTopicStats[topicId]) {
                    newTopicStats[topicId] = { correct: 0, wrong: 0 };
                }
                newTopicStats[topicId].correct += 1;
            }

            const newStreak = prev.streak + 1;

            return {
                ...prev,
                totalPoints: prev.totalPoints + 5, // 5 ball
                correctAnswers: prev.correctAnswers + 1,
                totalQuestions: prev.totalQuestions + 1,
                totalTimeSpent: prev.totalTimeSpent + timeSpent,
                topicStats: newTopicStats,
                streak: newStreak,
                bestStreak: Math.max(prev.bestStreak, newStreak),
                lastPlayDate: new Date().toISOString()
            };
        });
    };

    // Noto'g'ri javob qo'shish
    const addWrongAnswer = (topicId = null, timeSpent = 0) => {
        setStats(prev => {
            const newTopicStats = { ...prev.topicStats };
            if (topicId) {
                if (!newTopicStats[topicId]) {
                    newTopicStats[topicId] = { correct: 0, wrong: 0 };
                }
                newTopicStats[topicId].wrong += 1;
            }

            return {
                ...prev,
                wrongAnswers: prev.wrongAnswers + 1,
                totalQuestions: prev.totalQuestions + 1,
                totalTimeSpent: prev.totalTimeSpent + timeSpent,
                topicStats: newTopicStats,
                streak: 0, // Streak tugaydi
                lastPlayDate: new Date().toISOString()
            };
        });
    };

    // Statistikani tozalash
    const resetStats = () => {
        const emptyStats = {
            totalPoints: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            totalQuestions: 0,
            totalTimeSpent: 0,
            topicStats: {},
            streak: 0,
            bestStreak: 0,
            lastPlayDate: null
        };
        setStats(emptyStats);
    };

    // Foiz hisoblash (To'g'ri javoblar ulushi)
    function getAccuracyPercent() {
        if (stats.totalQuestions === 0) return 0;
        return Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
    }

    // O'rtacha vaqtni hisoblash va formatlash (Masalan: "0:08")
    function getAverageTimeFormatted() {
        if (stats.totalQuestions === 0) return "0:00";
        const avgSeconds = Math.round(stats.totalTimeSpent / stats.totalQuestions);
        const m = Math.floor(avgSeconds / 60);
        const s = avgSeconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const value = {
        stats,
        levels: LEVELS,
        getCurrentLevel,
        getNextLevel,
        getLevelProgress,
        addCorrectAnswer,
        addWrongAnswer,
        resetStats,
        getAccuracyPercent,
        getAverageTimeFormatted
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
};

export default ProgressContext;
