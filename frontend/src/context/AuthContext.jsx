import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for Local Admin (Hardcoded)
        const localAdmin = localStorage.getItem('local_admin_session');
        if (localAdmin) {
            setUser(JSON.parse(localAdmin));
            setLoading(false);
            return;
        }

        // 2. Check Supabase Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Auth o'zgarishlarini tinglash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                // Only clear if not local admin (prevent conflict if supabase emits event)
                if (!localStorage.getItem('local_admin_session')) {
                    setUser(null);
                }
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUser(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Profil topilmasa ham auth userdan ma'lumot olish mumkin, 
            // lekin bizga limit_date kerak
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // --- AUTO-BOOTSTRAP ADMIN CHECK ---
        // Foydalanuvchi "admin"/"admin123" bilan kirganda, biz haqiqiy DB userini tekshiramiz.
        // Agar yo'q bo'lsa, uni yaratamiz. Shunda CRUD amallari ishlaydi.
        if (email === 'admin@avto.uz' && password === 'admin123') {
            // 1. Try to login normally
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!error && data.session) {
                // Success!
                return { success: true };
            }

            // 2. If login failed (likely user doesn't exist), try to create it
            // Note: This only works if 'admin@avto.uz' isn't already taken with a different password.
            // If it is taken, we can't do much without correct password.
            if (error && error.message.includes('Invalid login credentials')) {
                // Might be wrong password OR user doesn't exist (Supabase is vague).
                // We can try to SignUp. If user exists, SignUp returns error.
                const { data: upData, error: upError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: 'admin',
                            first_name: 'Super',
                            last_name: 'Admin',
                            is_staff: true,
                            limit_date: '2099-12-31'
                        }
                    }
                });

                if (!upError && upData.session) {
                    return { success: true, message: "Admin user yaratildi va tizimga kirdi!" };
                }

                // Fallback to "Fake" local admin if all else fails (DB connection issue?)
                // But better to return the real error so user knows DB is reachable.
                // Let's fallback only if absolutely necessary.
            }
        }
        // -----------------------------------------

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Login muvaffaqiyatli, profil tekshiriladi (onAuthStateChange orqali)
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Login xatoligi'
            };
        }
    };

    const signup = async (email, password, metadata) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata, // full_name, etc.
                },
            });

            if (error) throw error;
            return { success: true, message: "Ro'yxatdan o'tish muvaffaqiyatli!" };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    };

    const logout = async () => {
        localStorage.removeItem('local_admin_session'); // Clear local admin
        await supabase.auth.signOut();
        setUser(null);
    };

    const checkAccountLimit = (limitDate) => {
        if (!limitDate) return true; // Agar limit bo'lmasa, ruxsat (yoki aksincha qilish mumkin)
        const now = new Date();
        const limit = new Date(limitDate);
        return now < limit;
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, checkAccountLimit }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
