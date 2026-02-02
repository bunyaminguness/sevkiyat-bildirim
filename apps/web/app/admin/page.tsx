'use client';

import { useEffect, useState } from 'react';
import { adminAPI, type AdminStats } from '@/lib/admin-api';

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'İstatistikler yüklenemedi');
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-600">Yükleniyor...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 font-medium">❌ {error}</p>
                <button
                    onClick={loadStats}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    if (!stats) return null;

    const statusColors: Record<string, string> = {
        Draft: 'bg-gray-100 text-gray-800',
        Sent: 'bg-blue-100 text-blue-800',
        Accepted: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800',
        Closed: 'bg-purple-100 text-purple-800',
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Sistem genel görünümü ve istatistikler</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                    <div className="text-5xl mb-2">👥</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <div className="text-gray-600 font-medium">Toplam Kullanıcı</div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
                    <div className="text-5xl mb-2">📋</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalReports}</div>
                    <div className="text-gray-600 font-medium">Toplam Bildirim</div>
                </div>

                {Object.entries(stats.reportsByStatus).slice(0, 2).map(([status, count]) => (
                    <div key={status} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                        <div className="text-5xl mb-2">📊</div>
                        <div className="text-3xl font-bold text-gray-900">{count}</div>
                        <div className="text-gray-600 font-medium">{status}</div>
                    </div>
                ))}
            </div>

            {/* Reports by Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Duruma Göre Bildirimler</h3>
                <div className="space-y-3">
                    {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                    {status}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Son Aktiviteler</h3>
                {stats.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl">📝</div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{activity.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(activity.timestamp).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Henüz aktivite yok</p>
                )}
            </div>
        </div>
    );
}
