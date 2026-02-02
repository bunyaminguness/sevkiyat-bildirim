'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmailPreviewPanel } from '@/components/EmailPreviewPanel';
import { BusinessHoursBanner } from '@/components/BusinessHoursBanner';
import { buildEmailPreview } from '@/utils/email-preview';
import { getSystemStatus, SystemStatus } from '@/lib/system-api';

interface ReportItem {
    productNo: string;
    productName: string;
    qty: number;
    damageType?: string;
}

interface RecipientOption {
    label: string;
    email: string;
}

// Validation Helper
interface ValidationErrors {
    general: string[];
    fields: Record<string, boolean>;
}

export default function NewReportPage() {
    const router = useRouter();

    // UI State
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<'draft' | 'send' | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({ general: [], fields: {} });
    const [successMessage, setSuccessMessage] = useState('');

    // Business Hours State
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [isWithinBusinessHours, setIsWithinBusinessHours] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        storeCode: '',
        type: 'Missing',
        tplNo: '',
        waybillNo: '',
        shipmentDate: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [items, setItems] = useState<ReportItem[]>([
        { productNo: '', productName: '', qty: 1, damageType: '' },
    ]);

    // Recipient State
    const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [customRecipient, setCustomRecipient] = useState('');
    const [showCustomRecipient, setShowCustomRecipient] = useState(false);

    // Preview State
    const [preview, setPreview] = useState({ subject: '', body: '', recipient: '' });

    // Fetch Recipient Options
    useEffect(() => {
        async function fetchRecipients() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/recipient-options`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setRecipientOptions(data);
                    if (data.length > 0) {
                        setSelectedRecipient(data[0].email);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch recipients', err);
            }
        }
        fetchRecipients();
    }, []);

    // Fetch Business Hours Status
    useEffect(() => {
        async function checkBusinessHours() {
            try {
                const status = await getSystemStatus();
                setSystemStatus(status);
                setIsWithinBusinessHours(status.isWithinBusinessHours);
            } catch (err) {
                console.error('Failed to fetch system status', err);
                // On error, assume within hours (fail open for UX)
                setIsWithinBusinessHours(true);
            }
        }

        // Initial fetch
        checkBusinessHours();

        // Poll every 60 seconds
        const interval = setInterval(checkBusinessHours, 60000);

        return () => clearInterval(interval);
    }, []);

    // Handle Recipient Change
    const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'custom') {
            setShowCustomRecipient(true);
            setSelectedRecipient('');
        } else {
            setShowCustomRecipient(false);
            setSelectedRecipient(value);
        }
    };

    // Live Preview Logic (Client Side)
    useEffect(() => {
        const currentRecipient = showCustomRecipient ? customRecipient : selectedRecipient;
        const previewData = buildEmailPreview({
            storeCode: formData.storeCode,
            type: formData.type,
            tplNo: formData.tplNo,
            waybillNo: formData.waybillNo,
            shipmentDate: formData.shipmentDate,
            notes: formData.notes,
            items: items,
            recipientEmail: currentRecipient
        });
        setPreview(previewData);
    }, [formData, items, selectedRecipient, customRecipient, showCustomRecipient]);

    // --- Validation Logic ---

    const validateForm = (isSending: boolean): boolean => {
        const errors: string[] = [];
        const fieldErrors: Record<string, boolean> = {};

        // Required for both Draft and Send
        if (!formData.storeCode.trim()) {
            errors.push('Mağaza kodu zorunludur.');
            fieldErrors['storeCode'] = true;
        }
        if (!formData.tplNo.trim()) {
            errors.push('TPL No zorunludur.');
            fieldErrors['tplNo'] = true;
        }
        if (!formData.shipmentDate) {
            errors.push('Sevkiyat tarihi zorunludur.');
            fieldErrors['shipmentDate'] = true;
        }
        if (items.length === 0) {
            errors.push('En az 1 adet ürün girmelisiniz.');
        }

        // Validate Items
        let hasItemErrors = false;
        items.forEach((item, index) => {
            if (!item.productNo.trim() || !item.productName.trim() || item.qty <= 0) {
                hasItemErrors = true;
            }
            if (formData.type === 'Damaged' && !item.damageType?.trim()) {
                hasItemErrors = true;
            }
        });

        if (hasItemErrors) {
            errors.push('Lütfen tüm ürün bilgilerini (No, Ad, Adet, Hasar Tipi) eksiksiz doldurun.');
        }

        // Strict rules for Sending
        if (isSending) {
            const recipient = showCustomRecipient ? customRecipient : selectedRecipient;
            if (!recipient.trim()) {
                errors.push('Email gönderimi için alıcı seçmelisiniz.');
                fieldErrors['recipient'] = true;
            } else if (showCustomRecipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
                errors.push('Geçersiz alıcı email adresi.');
                fieldErrors['recipient'] = true;
            }
        }

        setValidationErrors({ general: errors, fields: fieldErrors });
        return errors.length === 0;
    };

    const buildPayload = () => {
        const recipient = showCustomRecipient ? customRecipient : selectedRecipient;
        return {
            ...formData,
            recipients: recipient ? [recipient] : null, // Send as list to match DTO
            items: items.map(item => ({
                productNo: item.productNo,
                productName: item.productName,
                qty: item.qty,
                damageType: formData.type === 'Damaged' ? item.damageType : null,
            })),
        };
    };

    // --- Actions ---

    const handleSaveDraft = async () => {
        setSuccessMessage('');
        setValidationErrors({ general: [], fields: {} });

        if (!validateForm(false)) return;

        setLoading(true);
        setLoadingAction('draft');

        try {
            const payload = buildPayload();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                router.push('/login?error=session_expired');
                return;
            }

            if (!res.ok) {
                // Check for business hours error
                if (res.status === 403) {
                    try {
                        const errData = await res.json();
                        if (errData.code === 'outside_business_hours') {
                            // Update state to show banner
                            setIsWithinBusinessHours(false);
                            if (errData.businessHours) {
                                setSystemStatus(prev => prev ? {
                                    ...prev,
                                    isWithinBusinessHours: false,
                                    businessHours: errData.businessHours
                                } : null);
                            }
                            throw new Error(errData.message || 'Kullanım saatleri dışında işlem yapılamaz.');
                        }
                    } catch (jsonErr) {
                        throw new Error('Erişim engellendi.');
                    }
                }
                const errData = await res.json();
                throw new Error(errData.message_tr || 'Taslak kaydedilemedi.');
            }

            const report = await res.json();

            // Success
            setSuccessMessage(`Taslak başarıyla kaydedildi. (Rapor No: ${report.reportNo || 'Yeni'})`);
            setTimeout(() => {
                router.push('/reports'); // Redirect to list
            }, 1000);

        } catch (err: any) {
            setValidationErrors(prev => ({
                ...prev,
                general: [err.message || 'Beklenmeyen bir hata oluştu.']
            }));
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    const handleSaveAndSend = async () => {
        setSuccessMessage('');
        setValidationErrors({ general: [], fields: {} });

        if (!validateForm(true)) return;

        setLoading(true);
        setLoadingAction('send');

        try {
            // 1. Create Report (Draft)
            const payload = buildPayload();
            const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (createRes.status === 401) {
                router.push('/login?error=session_expired');
                return;
            }

            if (!createRes.ok) {
                // Check for business hours error
                if (createRes.status === 403) {
                    try {
                        const errData = await createRes.json();
                        if (errData.code === 'outside_business_hours') {
                            setIsWithinBusinessHours(false);
                            if (errData.businessHours) {
                                setSystemStatus(prev => prev ? {
                                    ...prev,
                                    isWithinBusinessHours: false,
                                    businessHours: errData.businessHours
                                } : null);
                            }
                            throw new Error(errData.message || 'Kullanım saatleri dışında işlem yapılamaz.');
                        }
                    } catch (jsonErr) {
                        throw new Error('Erişim engellendi.');
                    }
                }
                const errData = await createRes.json();
                throw new Error(errData.message_tr || 'Rapor oluşturulamadı.');
            }

            const report = await createRes.json();
            const reportId = report.id;

            // 2. Send Email
            const sendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sendViaSmtp: true }),
            });

            if (sendRes.status === 401) {
                router.push('/login?error=session_expired');
                return;
            }

            if (!sendRes.ok) {
                // Check for business hours error on send
                if (sendRes.status === 403) {
                    try {
                        const errData = await sendRes.json();
                        if (errData.code === 'outside_business_hours') {
                            setIsWithinBusinessHours(false);
                            if (errData.businessHours) {
                                setSystemStatus(prev => prev ? {
                                    ...prev,
                                    isWithinBusinessHours: false,
                                    businessHours: errData.businessHours
                                } : null);
                            }
                            throw new Error(errData.message || 'Kullanım saatleri dışında işlem yapılamaz.');
                        }
                    } catch (jsonErr) {
                        throw new Error('Erişim engellendi.');
                    }
                }
                const errData = await sendRes.json();
                throw new Error(errData.message_tr || 'Email gönderilemedi.');
            }

            setSuccessMessage(`Email gönderildi ve bildirim kaydedildi! ✅`);
            setTimeout(() => {
                router.push('/reports');
            }, 1500);

        } catch (err: any) {
            setValidationErrors(prev => ({
                ...prev,
                general: [err.message || 'İşlem başarısız.']
            }));
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    // --- Handlers for Inputs ---

    const addItem = () => {
        setItems([...items, { productNo: '', productName: '', qty: 1, damageType: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof ReportItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition text-gray-800 font-semibold"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900">Yeni Bildirim Oluştur</h1>
                </div>

                {/* Business Hours Banner */}
                {!isWithinBusinessHours && systemStatus?.businessHours && (
                    <BusinessHoursBanner businessHours={systemStatus.businessHours} />
                )}

                {/* Feedback Banners */}
                {validationErrors.general.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-red-800">Lütfen aşağıdaki hataları düzeltin:</h3>
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {validationErrors.general.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-xl shadow-sm animate-fade-in-down">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-bold text-green-800">{successMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* LEFT COLUMN: FORM */}
                    <div className="space-y-6">
                        {/* Genel Bilgiler */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-blue-500 pb-2">
                                📋 Genel Bilgiler
                            </h2>

                            <div className="space-y-6">
                                {/* Recipient Selection */}
                                <div>
                                    <label className={`block text-base font-bold mb-2 ${validationErrors.fields['recipient'] ? 'text-red-600' : 'text-gray-800'}`}>
                                        Kime (Alıcı) <span className="text-red-600">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            value={showCustomRecipient ? 'custom' : selectedRecipient}
                                            onChange={handleRecipientChange}
                                            className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['recipient'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                        >
                                            {recipientOptions.map((opt) => (
                                                <option key={opt.email} value={opt.email}>
                                                    {opt.label} ({opt.email})
                                                </option>
                                            ))}
                                            <option value="custom">✏️ Özel Email Gir...</option>
                                        </select>

                                        {showCustomRecipient && (
                                            <input
                                                type="email"
                                                placeholder="ornek@email.com"
                                                value={customRecipient}
                                                onChange={(e) => setCustomRecipient(e.target.value)}
                                                className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['recipient'] ? 'border-red-500 focus:ring-red-200' : 'border-blue-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-base font-bold mb-2 ${validationErrors.fields['storeCode'] ? 'text-red-600' : 'text-gray-800'}`}>
                                            Mağaza Kodu <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.storeCode}
                                            onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                                            className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['storeCode'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                            placeholder="Örn: IST001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-2">
                                            Bildirim Tipi <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition"
                                        >
                                            <option value="Missing">Eksik Ürün</option>
                                            <option value="Damaged">Hasarlı Ürün</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-base font-bold mb-2 ${validationErrors.fields['tplNo'] ? 'text-red-600' : 'text-gray-800'}`}>
                                            TPL No <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tplNo}
                                            onChange={(e) => setFormData({ ...formData, tplNo: e.target.value })}
                                            className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['tplNo'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                            placeholder="Örn: TPL123456"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-2">
                                            İrsaliye No
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.waybillNo}
                                            onChange={(e) => setFormData({ ...formData, waybillNo: e.target.value })}
                                            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition"
                                            placeholder="İsteğe bağlı"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-base font-bold mb-2 ${validationErrors.fields['shipmentDate'] ? 'text-red-600' : 'text-gray-800'}`}>
                                            Sevkiyat Tarihi <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.shipmentDate}
                                            onChange={(e) => setFormData({ ...formData, shipmentDate: e.target.value })}
                                            className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['shipmentDate'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-base font-bold text-gray-800 mb-2">
                                        Notlar
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition"
                                        placeholder="Ek açıklamalar yazabilirsiniz..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ürünler */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-green-500 pb-2">
                                <h2 className="text-2xl font-bold text-gray-900">📦 Ürünler</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-bold text-lg shadow-md hover:shadow-lg"
                                >
                                    + Ürün Ekle
                                </button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-bold text-gray-900">Ürün {index + 1}</span>
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-800 font-bold text-base px-4 py-2 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    ✕ Kaldır
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Ürün No *"
                                                    value={item.productNo}
                                                    onChange={(e) => updateItem(index, 'productNo', e.target.value)}
                                                    className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 placeholder-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Ürün Adı *"
                                                    value={item.productName}
                                                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                                    className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 placeholder-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Adet *"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 placeholder-gray-400"
                                                />
                                            </div>
                                            {formData.type === 'Damaged' && (
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Hasar Tipi *"
                                                        value={item.damageType}
                                                        onChange={(e) => updateItem(index, 'damageType', e.target.value)}
                                                        className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 placeholder-gray-400"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={loading || !isWithinBusinessHours}
                                title={!isWithinBusinessHours ? 'İşlem saat 09:00–18:00 arasında yapılabilir.' : ''}
                                className={`flex-1 px-8 py-4 rounded-xl font-bold text-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${loadingAction === 'draft' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {loadingAction === 'draft' ? '⏳ Kaydediliyor...' : '💾 Taslak Olarak Kaydet'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAndSend}
                                disabled={loading || !isWithinBusinessHours}
                                title={!isWithinBusinessHours ? 'İşlem saat 09:00–18:00 arasında yapılabilir.' : ''}
                                className={`flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${loadingAction === 'send' ? 'opacity-90' : ''}`}
                            >
                                {loadingAction === 'send' ? '⏳ Gönderiliyor...' : '📧 Kaydet ve Email Gönder'}
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center text-gray-500 text-sm">
                            Kırmızı (*) ile işaretli alanların doldurulması zorunludur.
                        </div>

                        {/* Mobile Only Preview Accordion */}
                        <div className="xl:hidden">
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-500 overflow-hidden">
                                <details className="group">
                                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-blue-50">
                                        <span className="text-blue-900 font-bold flex items-center gap-2">
                                            📧 Email Önizleme
                                        </span>
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <div className="p-4 border-t border-blue-100">
                                        <EmailPreviewPanel
                                            subject={preview.subject}
                                            body={preview.body}
                                            recipient={preview.recipient}
                                            isLoading={false}
                                        />
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW (Desktop Only) */}
                    <div className="hidden xl:block sticky top-8">
                        <div className="h-[calc(100vh-100px)] overflow-y-auto pb-8">
                            <EmailPreviewPanel
                                subject={preview.subject}
                                body={preview.body}
                                recipient={preview.recipient}
                                isLoading={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
