import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--bg-primary)'
            }}>
                <div className="spinner">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!user || (user && user.limit_date && new Date() > new Date(user.limit_date))) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !user.is_staff) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
