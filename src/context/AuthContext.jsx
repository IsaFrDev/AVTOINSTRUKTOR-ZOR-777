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
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // Auth o'zgarishlarini tinglash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user);
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

    const fetchProfile = async (authUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            // Load local picture if exists
            const localPic = localStorage.getItem(`profile_picture_${authUser.id}`);

            if (!data) {
                console.warn("User profile not found in public table. Attempting to create sync...");

                // If profile missing, try to create it manually using auth metadata
                // This is a fallback if the DB trigger failed or didn't run
                const updates = {
                    id: authUser.id,
                    username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
                    first_name: authUser.user_metadata?.first_name || '',
                    last_name: authUser.user_metadata?.last_name || '',
                    // Default 30 days if not specified
                    limit_date: authUser.user_metadata?.limit_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    is_admin: authUser.user_metadata?.is_admin || false,
                    password: 'supa_auth_linked' // Placeholder, not used for real auth
                };

                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([updates])
                    .select()
                    .single();

                if (createError) {
                    // Check for Ghost Session (User exists in browser but not in DB)
                    // Error 23503: foreign_key_violation
                    if (createError.code === '23503') {
                        console.warn("Ghost session detected (user deleted from DB). Logging out...");
                        localStorage.removeItem('sb-vqjcyqvzjkawhwlvtjzd-auth-token'); // Clear Supabase token manually just in case
                        await supabase.auth.signOut();
                        setUser(null);
                        return;
                    }
                    throw createError;
                }

                if (localPic) {
                    newProfile.profile_picture = localPic;
                }
                setUser(newProfile);
                return;
            }

            if (error) throw error;

            if (localPic) {
                data.profile_picture = localPic;
            }
            setUser(data);
        } catch (error) {
            console.error('Error fetching/creating profile:', error);
            // Fallback: set basic user info from auth if DB completely fails
            const fallbackUser = {
                id: authUser.id,
                email: authUser.email,
                ...authUser.user_metadata
            };
            const localPic = localStorage.getItem(`profile_picture_${authUser.id}`);
            if (localPic) {
                fallbackUser.profile_picture = localPic;
            }
            setUser(fallbackUser);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // 0. Hardcoded Admin Check
        if (email.toLowerCase().includes('admin') && password === 'password123') {
            const adminUser = {
                id: 'admin-id-777',
                username: 'admin',
                first_name: 'Asosiy',
                last_name: 'Admin',
                is_admin: true,
                is_staff: true,
                role: 'admin',
                limit_date: '2099-01-01T00:00:00Z'
            };
            localStorage.setItem('local_admin_session', JSON.stringify(adminUser));
            setUser(adminUser);
            return { success: true, user: adminUser };
        }

        // 1. Dastlab Admin (Supabase Auth) orqali kirishni tekshiramiz
        console.log("Login attempt:", { email, password });
        // Email orqali (admin@avto.uz)
        let authEmail = email;
        if (!email.includes('@')) {
            // Agar faqat username kiritilgan bo'lsa, avto.uz qo'shamiz (admin uchun)
            // Lekin oddiy userlar uchun bu baribir ishlamaydi, ular Custom Login qiladi.
            authEmail = `${email}@avto.uz`;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password,
            });

            if (!error && data.session) {
                console.log("Supabase Auth Success");
                // Fetch full profile to verify admin
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
                const fullUser = profile ? { ...data.session.user, ...profile } : data.session.user;
                return { success: true, user: fullUser };
            } else {
                console.log("Supabase Auth Failed (Expected for custom users):", error?.message);
            }
        } catch (e) {
            console.log("Supabase Auth Exception:", e);
            // Supabase auth failed, ignore and try custom
        }

        // 2. Agar Supabase Auth o'xshamasa, "Custom Profile Login" ni tekshiramiz
        // Bu admin tomonidan qo'l bilan yaratilgan userlar uchun.
        console.log("Attempting Custom Profile Login...");
        try {
            // Email emas, Username bo'yicha qidiramiz (chunki inputga username yozilgan bo'lishi mumkin)
            // Input 'email' o'zgaruvchisida keladi (LoginPage dan).
            const loginInput = email.includes('@avto.uz') ? email.split('@')[0] : email;

            console.log("Custom Login Query:", { username: loginInput, password });

            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', loginInput)
                .eq('password', password) // DIQQAT: Oddiy text password tekshiruvi (xavfsiz emas, lekin talab shunday)
                .maybeSingle();

            if (profileError) {
                console.error("Custom Login DB Error:", profileError);
                return { success: false, message: "Tizim xatoligi (DB)" };
            }

            if (!userProfile) {
                console.log("Custom User Not Found");
                return { success: false, message: "Login yoki parol noto'g'ri" };
            }

            console.log("Custom Profile Found:", userProfile);

            // CHECK LIMIT DATE
            if (userProfile.limit_date && new Date() > new Date(userProfile.limit_date)) {
                const dateStr = new Date(userProfile.limit_date).toLocaleDateString();
                console.log("User Expired:", dateStr);
                return { success: false, message: `Hisobingiz muddati tugagan (${dateStr}). Administratorga bog'laning.` };
            }

            // Muvaffaqiyatli Custom Login
            // Biz "fake" session yaratamiz
            const fakeSession = {
                user: {
                    id: userProfile.id,
                    email: `${userProfile.username}@custom.local`,
                    user_metadata: { ...userProfile }
                },
                access_token: 'custom-token',
            };

            // Local storagega saqlaymiz, shunda refreshda chiqib ketmaydi
            localStorage.setItem('local_admin_session', JSON.stringify(userProfile));
            setUser(userProfile);
            return { success: true, user: userProfile };

        } catch (err) {
            console.error("Custom Login Exec Error:", err);
            return { success: false, message: "Tizim xatoligi: " + err.message };
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
