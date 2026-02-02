'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, Report, RejectReportRequest } from '@/lib/api-client';

export default function ReportDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchReport();
        }
    }, [params.id]);

    const fetchReport = async () => {
        try {
            const data = await apiClient.getReport(Number(params.id));
            setReport(data);
        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message as string).includes('401')) {
                router.push('/login');
                return;
            }
            setError(err instanceof Error ? err.message : 'Rapor yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, payload?: any) => {
        if (!report) return;
        if (!confirm(`Bu işlemi yapmak istediğinizden emin misiniz?`)) return;

        setActionLoading(true);
        setError('');

        try {
            const id = report.id;
            switch (action) {
                case 'send':
                    await apiClient.sendReport(id, true);
                    break;
                case 'accept':
                    await apiClient.acceptReport(id);
                    break;
                case 'reject':
                    await apiClient.rejectReport(id, payload as RejectReportRequest);
                    break;
                case 'revise-resend':
                    await apiClient.reviseAndResend(id, true);
                    break;
                case 'close':
                    await apiClient.closeReport(id);
                    break;
            }
            await fetchReport();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'İşlem başarısız');
        } finally {
            setActionLoading(false);
        }
    };

    const copyEmailToClipboard = () => {
        if (report?.lastEmail) {
            const text = `Konu: ${report.lastEmail.subject}\n\n${report.lastEmail.body}`;
            navigator.clipboard.writeText(text);
            alert('Email metni kopyalandı!');
        }
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

    if (!report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Rapor bulunamadı</p>
                    <button onClick={() => router.push('/reports')} className="mt-4 text-blue-600">
                        Raporlara Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center">
                        <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900 transition">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{report.reportNo}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${report.status === 'Draft' ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-200' :
                                        report.status === 'Sent' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' :
                                            report.status === 'Accepted' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' :
                                                report.status === 'Rejected' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' :
                                                    'bg-purple-100 text-purple-700 ring-1 ring-purple-200'
                                    }`}>
                                    {report.status === 'Draft' ? 'Taslak' :
                                        report.status === 'Sent' ? 'Gönderildi' :
                                            report.status === 'Accepted' ? 'Kabul Edildi' :
                                                report.status === 'Rejected' ? 'Reddedildi' : 'Kapatıldı'}
                                </span>
                            </div>
                            <p className="text-gray-500 mt-1 flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${report.type === 'Missing' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                {report.type === 'Missing' ? 'Eksik Ürün Bildirimi' : 'Hasarlı Ürün Bildirimi'}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 font-medium flex items-center">
                        <svg className="w-5 h-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info & Items */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Genel Bilgiler */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                Genel Bilgiler
                            </h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mağaza Kodu</dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900">{report.storeCode}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">TPL No</dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900">{report.tplNo}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">İrsaliye No</dt>
                                    <dd className="mt-1 text-base font-medium text-gray-900">{report.waybillNo || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sevkiyat Tarihi</dt>
                                    <dd className="mt-1 text-base font-medium text-gray-900">
                                        {new Date(report.shipmentDate).toLocaleDateString('tr-TR')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</dt>
                                    <dd className="mt-1 text-base font-medium text-gray-900 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {report.createdByName.charAt(0)}
                                        </div>
                                        {report.createdByName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturma Tarihi</dt>
                                    <dd className="mt-1 text-base font-medium text-gray-900">
                                        {new Date(report.createdAt).toLocaleString('tr-TR')}
                                    </dd>
                                </div>
                            </dl>
                            {report.recipients && report.recipients.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Alıcılar</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {report.recipients.map((email, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                {email}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                            {report.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notlar</dt>
                                    <dd className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {report.notes}
                                    </dd>
                                </div>
                            )}
                        </div>

                        {/* Ürünler */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="p-2 bg-green-50 text-green-600 rounded-lg mr-3">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </span>
                                Ürünler
                            </h2>
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Adı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                                            {report.type === 'Damaged' && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasar Tipi</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {report.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productNo}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.productName}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.qty}</td>
                                                {report.type === 'Damaged' && (
                                                    <td className="px-6 py-4 text-sm text-red-600">{item.damageType}</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions & History */}
                    <div className="space-y-6">
                        {/* Actions Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">İşlemler</h2>
                            <div className="space-y-3">
                                {report.status === 'Draft' && (
                                    <button
                                        onClick={() => handleAction('send')}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? '...' : 'Email Gönder'}
                                    </button>
                                )}
                                {report.status === 'Sent' && (
                                    <>
                                        <button
                                            onClick={() => handleAction('accept')}
                                            disabled={actionLoading}
                                            className="w-full bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-70"
                                        >
                                            Kabul Edildi
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Red sebebi:');
                                                if (reason) handleAction('reject', { rejectionReason: reason, note: '' });
                                            }}
                                            disabled={actionLoading}
                                            className="w-full bg-white border border-red-200 text-red-600 px-4 py-3 rounded-xl font-semibold hover:bg-red-50 transition shadow-sm disabled:opacity-70"
                                        >
                                            Reddedildi
                                        </button>
                                    </>
                                )}
                                {report.status === 'Rejected' && (
                                    <button
                                        onClick={() => handleAction('revise-resend')}
                                        disabled={actionLoading}
                                        className="w-full bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm disabled:opacity-70"
                                    >
                                        Revize Et ve Tekrar Gönder
                                    </button>
                                )}
                                {report.status === 'Accepted' && (
                                    <button
                                        onClick={() => handleAction('close')}
                                        disabled={actionLoading}
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl font-semibold hover:bg-gray-900 transition shadow-sm disabled:opacity-70"
                                    >
                                        Dosyayı Kapat
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Email Status Card */}
                        {report.lastEmail && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                                    <span>Son E-posta Durumu</span>
                                    {report.lastEmail.sentAt ? (
                                        <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                            Gönderildi
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                                            Hata
                                        </span>
                                    )}
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Gönderim Zamanı</span>
                                        <span className="text-sm text-gray-900">
                                            {report.lastEmail.sentAt ? new Date(report.lastEmail.sentAt).toLocaleString('tr-TR') : '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Konu</span>
                                        <span className="text-sm text-gray-700 bg-gray-50 block p-2 rounded border border-gray-100">{report.lastEmail.subject}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={copyEmailToClipboard}
                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-lg border border-gray-200 transition font-medium text-center"
                                        >
                                            Kopyala
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (report.lastEmail) {
                                                    const subject = encodeURIComponent(report.lastEmail.subject);
                                                    const body = encodeURIComponent(report.lastEmail.body);
                                                    const to = encodeURIComponent(report.lastEmail.to || '');
                                                    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
                                                }
                                            }}
                                            className="flex-1 bg-white hover:bg-gray-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100 transition font-medium text-center flex items-center justify-center"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                            </svg>
                                            Gmail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* İşlem Geçmişi */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">İşlem Geçmişi</h2>
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {report.actions.map((action, actionIdx) => (
                                        <li key={action.id}>
                                            <div className="relative pb-8">
                                                {actionIdx !== report.actions.length - 1 ? (
                                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                                ) : null}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${action.actionType === 'CREATED' ? 'bg-gray-200' :
                                                                action.actionType === 'SENT' ? 'bg-blue-500' :
                                                                    action.actionType === 'ACCEPTED' ? 'bg-green-500' :
                                                                        action.actionType === 'REJECTED' ? 'bg-red-500' :
                                                                            'bg-purple-500'
                                                            }`}>
                                                            {/* Icon */}
                                                            <span className="text-white text-xs font-bold">
                                                                {action.actionType === 'SENT' ? '✉️' : action.actionType.charAt(0)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">
                                                                <span className="font-medium text-gray-900">{action.actorName}</span>
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">{action.message}</p>
                                                        </div>
                                                        <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                                            <time dateTime={action.createdAt}>
                                                                {new Date(action.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                <div className="text-[10px]">{new Date(action.createdAt).toLocaleDateString('tr-TR')}</div>
                                                            </time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
