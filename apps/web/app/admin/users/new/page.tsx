'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, type CreateUserRequest } from '@/lib/admin-api';

export default function NewUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<CreateUserRequest>({
        email: '',
        role: 1, // Manager by default
        storeCode: '',
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await adminAPI.createUser({
                ...formData,
                storeCode: formData.storeCode || undefined,
            });
            router.push('/admin/users');
        } catch (err: any) {
            setError(err.message || 'Kullanıcı eklenemedi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 font-medium mb-4"
                >
                    ← Geri Dön
                </button>
                <h2 className="text-3xl font-bold text-gray-900">Yeni Kullanıcı Ekle</h2>
                <p className="text-gray-600 mt-1">Sisteme erişim izni verilecek kullanıcı bilgileri</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">❌ {error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                {/* Email */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email Adresi <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="ornek@email.com"
                    />
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white"
                    >
                        <option value={0}>Admin - Tüm yetkiler</option>
                        <option value={1}>Manager - Rapor yönetimi</option>
                        <option value={2}>Assistant - Sadece görüntüleme</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                        Admin: Kullanıcı yönetimi dahil tüm işlemler |
                        Manager: Rapor oluşturma ve gönderme |
                        Assistant: Sadece okuma
                    </p>
                </div>

                {/* Store Code */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Mağaza Kodu
                    </label>
                    <input
                        type="text"
                        value={formData.storeCode}
                        onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                        className="w-full px-4 py-3 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="Opsiyonel"
                    />
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Kullanıcı aktif olsun
                    </label>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Ekleniyor...' : '✓ Kullanıcı Ekle'}
                    </button>
                </div>
            </form>
        </div>
    );
}
