'use client';

import { useEffect, useState } from 'react';
import { adminAPI, AdminReport } from '@/lib/admin-api';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        storeCode: '',
        q: '',
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getReports(filters);
            setReports(data);
        } catch (err: any) {
            setError(err.message || 'Raporlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        fetchReports();
    };

    const handleStatusChange = async (reportId: number, newStatus: string) => {
        try {
            await adminAPI.updateReportStatus(reportId, newStatus);
            fetchReports(); // Refresh list
            alert('Rapor durumu güncellendi');
        } catch (err: any) {
            alert(err.message || 'Bir hata oluştu');
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
            <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-bold ring-1 ring-inset ${styles[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading && reports.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Raporlar Yönetimi</h2>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Tümü</option>
                            <option value="Draft">Taslak</option>
                            <option value="Sent">Gönderildi</option>
                            <option value="Accepted">Kabul Edildi</option>
                            <option value="Rejected">Reddedildi</option>
                            <option value="Closed">Kapatıldı</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mağaza Kodu</label>
                        <input
                            type="text"
                            value={filters.storeCode}
                            onChange={(e) => handleFilterChange('storeCode', e.target.value)}
                            placeholder="örn: 001"
                            className="w-full px-3 py-2 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-gray-400 placeholder:font-normal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(e) => handleFilterChange('q', e.target.value)}
                            placeholder="Rapor No, TPL, vb."
                            className="w-full px-3 py-2 text-base font-bold text-gray-900 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-gray-400 placeholder:font-normal"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Filtrele
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Reports Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Rapor No
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Mağaza
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                TPL No
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Tip
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Durum
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Oluşturan
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                İşlem
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    Rapor bulunamadı
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900 font-mono">
                                        {report.reportNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900">
                                        {report.storeCode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 font-mono">
                                        {report.tplNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base">
                                        <span className={`font-semibold ${report.type === 'Missing' ? 'text-orange-600' : 'text-red-600'}`}>
                                            {report.type === 'Missing' ? 'Eksik' : 'Hasarlı'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                                        {report.createdBy}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                                        {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                            value={report.status}
                                            className="text-base font-bold text-gray-900 border-2 border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="Draft">Taslak</option>
                                            <option value="Sent">Gönderildi</option>
                                            <option value="Accepted">Kabul Edildi</option>
                                            <option value="Rejected">Reddedildi</option>
                                            <option value="Closed">Kapatıldı</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500">
                Toplam {reports.length} rapor
            </div>
        </div>
    );
}
