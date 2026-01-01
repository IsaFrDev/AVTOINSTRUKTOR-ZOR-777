import React from 'react';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', transition: 'background var(--transition-base)' }}>
            <Navbar />
            <motion.main
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="container"
                style={{
                    flex: 1,
                    maxWidth: '1200px',
                    width: '100%',
                    margin: '0 auto',
                    padding: 'clamp(5rem, 10vw, 7rem) clamp(0.75rem, 3vw, 1.5rem) clamp(2rem, 5vw, 4rem)'
                }}
            >
                {children}
            </motion.main>
            <footer style={{
                padding: '4rem var(--spacing-xl)',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)'
            }}>
                © 2025 AVTOINSTRUKTOR ZOR 777. Barcha huquqlar himoyalangan.
            </footer>
        </div>
    );
};

export default Layout;
