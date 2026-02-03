'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, type AllowedUser } from '@/lib/admin-api';
import { SetPasswordDialog } from '@/components/admin/SetPasswordDialog';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AllowedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Set Password Dialog State
    const [passwordDialoUser, setPasswordDialogUser] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getUsers();
            setUsers(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Kullanıcılar yüklenemedi');
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`${email} kullanıcısını silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await adminAPI.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (err: any) {
            alert('Hata: ' + (err.message || 'Kullanıcı silinemedi'));
        }
    };

    const handleToggleActive = async (user: AllowedUser) => {
        try {
            const updated = await adminAPI.updateUser(user.id, { isActive: !user.isActive });
            setUsers(users.map(u => u.id === user.id ? updated : u));
        } catch (err: any) {
            alert('Hata: ' + (err.message || 'Kullanıcı güncellenemedi'));
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            Admin: 'bg-red-100 text-red-800',
            Manager: 'bg-blue-100 text-blue-800',
            Assistant: 'bg-green-100 text-green-800',
        };
        return styles[role] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-600">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h2>
                    <p className="text-gray-600 mt-1">Sistemde erişim izni olan kullanıcılar</p>
                </div>
                <button
                    onClick={() => router.push('/admin/users/new')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                >
                    + Yeni Kullanıcı Ekle
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">❌ {error}</p>
                    <button
                        onClick={loadUsers}
                        className="mt-2 text-red-600 hover:text-red-800 font-medium"
                    >
                        Tekrar Dene
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Rol</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Mağaza</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Durum</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Oluşturulma</th>
                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-700">{user.storeCode || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        {user.isActive ? '✓ Aktif' : '✗ Pasif'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => setPasswordDialogUser(user.email)}
                                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                                        title="Şifre Tanımla"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="7.5" cy="15.5" r="5.5" />
                                            <path d="m21 2-9.6 9.6" />
                                            <path d="m15.5 7.5 3 3L22 7l-3-3" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id, user.email)}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        Henüz kullanıcı yok
                    </div>
                )}
            </div>

            <SetPasswordDialog
                isOpen={!!passwordDialoUser}
                onClose={() => setPasswordDialogUser(null)}
                email={passwordDialoUser}
            />
        </div>
    );
}
