import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Confetti = ({ active, duration = 3000 }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (active) {
            // Generate random particles
            const newParticles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 0.5,
                color: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][Math.floor(Math.random() * 6)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360
            }));
            setParticles(newParticles);

            // Clear after duration
            const timer = setTimeout(() => setParticles([]), duration);
            return () => clearTimeout(timer);
        }
    }, [active, duration]);

    if (!active && particles.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: `${particle.x}vw`,
                            y: -20,
                            rotate: 0,
                            opacity: 1
                        }}
                        animate={{
                            y: '110vh',
                            rotate: particle.rotation + 720,
                            opacity: [1, 1, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2.5 + Math.random(),
                            delay: particle.delay,
                            ease: 'easeIn'
                        }}
                        style={{
                            position: 'absolute',
                            width: particle.size,
                            height: particle.size,
                            background: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            boxShadow: `0 0 6px ${particle.color}`
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Shake animation component
export const ShakeWrapper = ({ shake, children }) => {
    return (
        <motion.div
            animate={shake ? {
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
            } : {}}
        >
            {children}
        </motion.div>
    );
};

// Success checkmark animation
export const SuccessCheck = ({ show }) => {
    if (!show) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9998,
                pointerEvents: 'none'
            }}
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
                }}
            >
                <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        d="M20 6L9 17l-5-5"
                    />
                </motion.svg>
            </motion.div>
        </motion.div>
    );
};

// Wrong X animation
export const WrongX = ({ show }) => {
    if (!show) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9998,
                pointerEvents: 'none'
            }}
        >
            <motion.div
                animate={{ scale: [0, 1.2, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #f87171)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)'
                }}
            >
                <span style={{ fontSize: '3rem', color: 'white' }}>✕</span>
            </motion.div>
        </motion.div>
    );
};

export default Confetti;
