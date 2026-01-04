import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Font size: 'small', 'medium', 'large'
    const [fontSize, setFontSize] = useState(() => {
        try {
            return localStorage.getItem('fontSize') || 'medium';
        } catch (e) {
            return 'medium';
        }
    });


    useEffect(() => {
        try {
            localStorage.setItem('fontSize', fontSize);

            // Apply font size to document
            const fontSizes = {
                small: '14px',
                medium: '16px',
                large: '18px'
            };
            document.documentElement.style.fontSize = fontSizes[fontSize];
        } catch (e) {
            console.error('Error setting font size:', e);
        }
    }, [fontSize]);

    // Enforce Uzbek language
    useEffect(() => {
        try {
            if (i18n.language !== 'uz') {
                i18n.changeLanguage('uz');
            }
        } catch (e) {
            console.error('Error enforcing language:', e);
        }
    }, []);

    // PWA Support
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log('PWA: beforeinstallprompt event captured');
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const value = {
        fontSize,
        setFontSize,
        deferredPrompt,
        setDeferredPrompt
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
