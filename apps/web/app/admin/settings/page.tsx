'use client';

import { useEffect, useState } from 'react';
import { adminAPI, type BusinessHoursConfig } from '@/lib/admin-api';

export default function SettingsPage() {
    const [config, setConfig] = useState<BusinessHoursConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getBusinessHours();
            setConfig(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Ayarlar yüklenemedi');
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
                    onClick={loadConfig}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    if (!config) return null;

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLabels: Record<string, string> = {
        Mon: 'Pazartesi',
        Tue: 'Salı',
        Wed: 'Çarşamba',
        Thu: 'Perşembe',
        Fri: 'Cuma',
        Sat: 'Cumartesi',
        Sun: 'Pazar',
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h2>
                <p className="text-gray-600 mt-1">İş saatleri ve sistem yapılandırması</p>
            </div>

            {/* Business Hours Config */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">⏰ Kullanım Saatleri</h3>

                <div className="space-y-6">
                    {/* Enabled */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-bold text-gray-900">İş Saatleri Kontrolü</div>
                            <div className="text-sm text-gray-600">
                                Aktif olunca POST/PUT/DELETE işlemleri belirlenen saatlerde yapılabilir
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold ${config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {config.enabled ? '✓ Aktif' : '✗ Pasif'}
                        </div>
                    </div>

                    {/* Timezone */}
                    <div>
                        <div className="font-bold text-gray-700 mb-2">Saat Dilimi</div>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                            🌍 {config.timeZone}
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="font-bold text-gray-700 mb-2">Başlangıç Saati</div>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium text-xl">
                                🕐 {config.start}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-gray-700 mb-2">Bitiş Saati</div>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium text-xl">
                                🕔 {config.end}
                            </div>
                        </div>
                    </div>

                    {/* Days */}
                    <div>
                        <div className="font-bold text-gray-700 mb-3">Aktif Günler</div>
                        <div className="grid grid-cols-2 gap-2">
                            {daysOfWeek.map((day) => {
                                const isActive = config.days.includes(day);
                                return (
                                    <div
                                        key={day}
                                        className={`px-4 py-3 rounded-lg font-medium text-center ${isActive
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        {isActive ? '✓' : '✗'} {dayLabels[day]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Info Message */}
                <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <div className="font-bold text-yellow-900">Ayar Değişikliği</div>
                            <div className="text-sm text-yellow-800 mt-1">
                                İş saatleri ayarlarını değiştirmek için <code className="bg-yellow-100 px-2 py-1 rounded">appsettings.json</code> dosyasını
                                düzenleyin ve API server'ını yeniden başlatın.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
