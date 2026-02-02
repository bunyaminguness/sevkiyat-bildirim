'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is admin
        // In a real app, decode JWT and check role
        // For now, we'll let the backend handle authorization
        setLoading(false);
    }, []);

    const navItems = [
        { href: '/admin', label: '📊 Dashboard', icon: '📊' },
        { href: '/admin/users', label: '👥 Kullanıcı Yönetimi', icon: '👥' },
        { href: '/admin/settings', label: '⚙️ Sistem Ayarları', icon: '⚙️' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl text-gray-600">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Bar */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/reports')}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                            ← Ana Sayfa
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-sm min-h-screen">
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
                    ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
