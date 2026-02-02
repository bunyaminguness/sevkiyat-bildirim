'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ReportListItem } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsPage() {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [reports, setReports] = useState<ReportListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await apiClient.getReports();
            setReports(data.items || []);
        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message as string).includes('401')) {
                router.push('/login');
                return;
            }
            setError(err instanceof Error ? err.message : 'Raporlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Draft': 'bg-gray-100 text-gray-700 ring-gray-600/20',
            'Sent': 'bg-blue-100 text-blue-700 ring-blue-700/10',
            'Accepted': 'bg-green-100 text-green-700 ring-green-600/20',
            'Rejected': 'bg-red-100 text-red-700 ring-red-600/10',
            'Closed': 'bg-purple-100 text-purple-700 ring-purple-600/10',
        };

        const labels: Record<string, string> = {
            'Draft': 'Taslak',
            'Sent': 'Gönderildi',
            'Accepted': 'Kabul Edildi',
            'Rejected': 'Reddedildi',
            'Closed': 'Kapatıldı',
        };

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getEmailBadge = (emailState: string, lastSentAt?: string) => {
        if (!emailState || emailState === 'NotSent') {
            return <span className="text-gray-400 text-xs">-</span>;
        }

        if (emailState === 'Failed') {
            return (
                <div className="flex items-center text-red-600" title="E-posta gönderilemedi">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium">Hata</span>
                </div>
            );
        }

        return (
            <div className="flex flex-col">
                <div className="flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium">Gönderildi</span>
                </div>
                {lastSentAt && (
                    <span className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(lastSentAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Sevkiyat Bildirimleri</h1>
                    <div className="flex gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => router.push('/admin')}
                                className="bg-gray-700 text-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-sm flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Admin Panel
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/reports/new')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Yeni Bildirim
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {reports.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz bildirim yok</h3>
                        <p className="mt-1 text-sm text-gray-500">Yeni bir bildirim oluşturarak başlayın.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/reports/new')}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-sm"
                            >
                                + İlk Bildirimi Oluştur
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Desktop Header */}
                        <div className="hidden md:grid grid-cols-8 gap-4 px-6 py-3 bg-gray-50/50 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider items-center border border-gray-100">
                            <div className="col-span-1 pl-2">Rapor No</div>
                            <div className="col-span-1">Durum</div>
                            <div className="col-span-1">E-posta</div>
                            <div className="col-span-1">Mağaza</div>
                            <div className="col-span-1">TPL No</div>
                            <div className="col-span-1">Tip</div>
                            <div className="col-span-1 text-center">Ürün</div>
                            <div className="col-span-1 text-right pr-2">Son İşlem</div>
                        </div>

                        {/* Report Rows */}
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => router.push(`/reports/${report.id}`)}
                                    className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="grid md:grid-cols-8 gap-4 items-center">
                                        {/* Mobile Header for Report No */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Rapor No</span>
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 font-mono">
                                                {report.reportNo}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Durum</span>
                                            {getStatusBadge(report.status)}
                                        </div>

                                        {/* Email State */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">E-posta</span>
                                            {getEmailBadge(report.emailState, report.lastEmailSentAt)}
                                        </div>

                                        {/* Store Code */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Mağaza</span>
                                            <span className="text-sm text-gray-900 font-medium">{report.storeCode}</span>
                                        </div>

                                        {/* TPL No */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">TPL No</span>
                                            <span className="text-sm text-gray-500 font-mono">
                                                {report.tplNo}
                                            </span>
                                        </div>

                                        {/* Type */}
                                        <div className="flex justify-between md:block col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Tip</span>
                                            <span className={`text-sm font-medium ${report.type === 'Missing' ? 'text-orange-600' : 'text-red-600'}`}>
                                                {report.type === 'Missing' ? 'Eksik Ürün' : 'Hasarlı Ürün'}
                                            </span>
                                        </div>

                                        {/* Item Count */}
                                        <div className="flex justify-between md:block md:text-center col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Ürün Sayısı</span>
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {report.itemCount}
                                            </span>
                                        </div>

                                        {/* Last Action */}
                                        <div className="flex justify-between md:block md:text-right col-span-1">
                                            <span className="md:hidden text-xs text-gray-500 font-medium">Son İşlem</span>
                                            <div className="flex flex-col md:items-end">
                                                <span className="text-xs font-medium text-gray-900">
                                                    {report.lastActionType === 'CREATED' ? 'Oluşturuldu' :
                                                        report.lastActionType === 'UPDATED' ? 'Güncellendi' :
                                                            report.lastActionType === 'SENT' ? 'Gönderildi' :
                                                                report.lastActionType === 'ACCEPTED' ? 'Kabul Edildi' :
                                                                    report.lastActionType === 'REJECTED' ? 'Reddedildi' :
                                                                        report.lastActionType === 'CLOSED' ? 'Kapatıldı' : report.lastActionType}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(report.lastActionTime).toLocaleDateString('tr-TR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
