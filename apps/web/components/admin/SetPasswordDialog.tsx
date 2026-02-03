"use client";

import { useState } from "react";
import { adminAPI } from "@/lib/admin-api";

interface SetPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    email: string | null;
}

export function SetPasswordDialog({ isOpen, onClose, email }: SetPasswordDialogProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (password.length < 6) {
            alert("Şifre en az 6 karakter olmalıdır");
            return;
        }

        setLoading(true);
        try {
            await adminAPI.setPassword(email, password);
            alert("Şifre başarıyla güncellendi");
            setPassword("");
            onClose();
        } catch (error: any) {
            console.error("Set password error:", error);
            alert(error.message || "Şifre güncellenirken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Şifre Tanımla</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {email} kullanıcısı için yeni bir şifre belirleyin.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Yeni Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="En az 6 karakter"
                            disabled={loading}
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : null}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
