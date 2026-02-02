'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    role: string;
    displayName: string;
    storeCode?: string;
    profileImageUrl?: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        // Clear cookies by calling logout endpoint
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        }).finally(() => {
            setUser(null);
            window.location.href = '/login';
        });
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const isAdmin = user?.isAdmin ?? false;

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
