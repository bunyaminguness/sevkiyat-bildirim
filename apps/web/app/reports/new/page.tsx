'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EmailPreviewPanel } from '@/components/EmailPreviewPanel';
import { buildEmailPreview } from '@/utils/email-preview';
import { getApiUrl } from '@/lib/api-url';

interface ReportItem {
    productNo: string;
    productName: string;
    qty: number;
    damageType?: string;
    photoUrl?: string;
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

    // Form Data
    const [formData, setFormData] = useState({
        storeCode: '',
        type: 'Missing',
        tplNo: '',
        waybillNo: '',
        shipmentDate: new Date().toISOString().split('T')[0],
    });

    const [items, setItems] = useState<ReportItem[]>([
        { productNo: '', productName: '', qty: 1, damageType: '', photoUrl: '' },
    ]);

    // Recipient State
    const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [customRecipient, setCustomRecipient] = useState('');
    const [showCustomRecipient, setShowCustomRecipient] = useState(false);

    // Derived Preview State
    const preview = useMemo(() => {
        const currentRecipient = showCustomRecipient ? customRecipient : selectedRecipient;
        return buildEmailPreview({
            storeCode: formData.storeCode,
            type: formData.type,
            tplNo: formData.tplNo,
            waybillNo: formData.waybillNo,
            shipmentDate: formData.shipmentDate,
            items: items,
            recipientEmail: currentRecipient
        });
    }, [formData, items, selectedRecipient, customRecipient, showCustomRecipient]);

    // Photo Attachments (In-Memory Only)
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

    // Fetch Recipient Options
    useEffect(() => {
        async function fetchRecipients() {
            try {
                const res = await fetch(`${getApiUrl()}/api/reports/recipient-options`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setRecipientOptions(data);
                        setSelectedRecipient(data[0].email);
                        setShowCustomRecipient(false);
                    } else {
                        // Success but empty list -> fallback to custom
                        setRecipientOptions([]);
                        setShowCustomRecipient(true);
                    }
                } else {
                    // API fail (e.g. 404) -> fallback to custom
                    setRecipientOptions([]);
                    setShowCustomRecipient(true);
                }
            } catch (err) {
                console.error('Failed to fetch recipients', err);
                // Fetch fail -> fallback to custom
                setRecipientOptions([]);
                setShowCustomRecipient(true);
            }
        }
        fetchRecipients();
    }, []);

    // Handle Recipient Change
    const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'custom') {
            setShowCustomRecipient(true);
            setSelectedRecipient('');
            // Clear recipient validation error when entering custom mode
            setValidationErrors(prev => ({
                ...prev,
                fields: { ...prev.fields, recipient: false }
            }));
        } else {
            setShowCustomRecipient(false);
            setSelectedRecipient(value);
            // Clear custom email and errors when switching to preset
            setCustomRecipient('');
            setValidationErrors(prev => ({
                ...prev,
                fields: { ...prev.fields, recipient: false }
            }));
        }
    };

    // --- LocalStorage Persistence ---
    const STORAGE_KEY = 'report_draft_v1';

    // Load from LocalStorage
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Simple version check/sanity check
                if (parsed.formData && parsed.items) {
                    setFormData(parsed.formData);
                    setItems(parsed.items);
                    if (parsed.selectedRecipient) setSelectedRecipient(parsed.selectedRecipient);
                    if (parsed.customRecipient) setCustomRecipient(parsed.customRecipient);
                }
            } catch (err) {
                console.error('Failed to parse saved draft', err);
            }
        }
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        const draft = {
            formData,
            items,
            selectedRecipient,
            customRecipient
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [formData, items, selectedRecipient, customRecipient]);

    const resetForm = () => {
        setFormData({
            storeCode: '',
            type: 'Missing',
            tplNo: '',
            waybillNo: '',
            shipmentDate: new Date().toISOString().split('T')[0],
        });
        setItems([{ productNo: '', productName: '', qty: 1, damageType: '', photoUrl: '' }]);
        setCustomRecipient('');
        setShowCustomRecipient(false);
        if (recipientOptions.length > 0) {
            setSelectedRecipient(recipientOptions[0].email);
        }
        setSelectedPhotos([]);
        localStorage.removeItem(STORAGE_KEY);
    };

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
                photoUrl: item.photoUrl || null,
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
            const res = await fetch(`${getApiUrl()}/api/reports`, {
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
                // Safe JSON parsing for other errors
                let errData: any = {};
                try {
                    const text = await res.text();
                    errData = text ? JSON.parse(text) : {};
                } catch { /* non-JSON response */ }
                throw new Error(errData.message_tr || 'Taslak kaydedilemedi.');
            }

            const report = await res.json();

            // Success
            setSuccessMessage(`Taslak başarıyla kaydedildi. (Rapor No: ${report.reportNo || 'Yeni'})`);
            resetForm();
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
            const createRes = await fetch(`${getApiUrl()}/api/reports`, {
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
                // Safe JSON parsing for other errors
                let errData: any = {};
                try {
                    const text = await createRes.text();
                    errData = text ? JSON.parse(text) : {};
                } catch { /* non-JSON response */ }
                throw new Error(errData.message_tr || 'Rapor oluşturulamadı.');
            }

            const report = await createRes.json();
            const reportId = report.id;

            // 2. Send Email
            let sendRes;
            if (selectedPhotos.length > 0) {
                const sendFormData = new FormData();
                selectedPhotos.forEach(file => {
                    sendFormData.append('attachments', file);
                });

                sendRes = await fetch(`${getApiUrl()}/api/reports/${reportId}/send-with-attachments`, {
                    method: 'POST',
                    credentials: 'include',
                    body: sendFormData,
                });
            } else {
                sendRes = await fetch(`${getApiUrl()}/api/reports/${reportId}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ sendViaSmtp: true }),
                });
            }

            if (sendRes.status === 401) {
                router.push('/login?error=session_expired');
                return;
            }

            if (!sendRes.ok) {
                // Safe JSON parsing for other errors
                let errData: any = {};
                try {
                    const text = await sendRes.text();
                    errData = text ? JSON.parse(text) : {};
                } catch { /* non-JSON response */ }
                throw new Error(errData.message_tr || 'Email gönderilemedi.');
            }

            setSuccessMessage(`Email gönderildi ve bildirim kaydedildi! ✅`);
            resetForm();
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
        setItems([...items, { productNo: '', productName: '', qty: 1, damageType: '', photoUrl: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Validation: Only images
            const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
            if (invalidFiles.length > 0) {
                alert('Lütfen sadece görsel dosyaları seçin.');
                return;
            }
            // Validation: Size (10MB)
            const largeFiles = files.filter(f => f.size > 10 * 1024 * 1024);
            if (largeFiles.length > 0) {
                alert('Bazı dosyalar 10MB limitini aşıyor.');
                return;
            }

            if (selectedPhotos.length + files.length > 10) {
                alert('En fazla 10 fotoğraf ekleyebilirsiniz.');
                return;
            }
            setSelectedPhotos(prev => [...prev, ...files]);
        }
    };

    const removePhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
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
                                <div className="space-y-3">
                                    <label className={`block text-base font-bold mb-2 ${validationErrors.fields['recipient'] ? 'text-red-600' : 'text-gray-800'}`}>
                                        Kime (Alıcı) <span className="text-red-600">*</span>
                                    </label>

                                    {recipientOptions.length > 0 ? (
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
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Alıcı listesi yüklenemedi, manuel e-posta giriliyor.
                                        </div>
                                    )}

                                    {(showCustomRecipient || recipientOptions.length === 0) && (
                                        <div className="space-y-2 animate-fade-in-down">
                                            <label className="block text-sm font-bold text-gray-700">
                                                {recipientOptions.length > 0 ? "Özel E-posta" : "Alıcı E-posta"}
                                            </label>
                                            <input
                                                type="email"
                                                autoFocus
                                                placeholder="ornek@firma.com"
                                                value={customRecipient}
                                                onChange={(e) => {
                                                    setCustomRecipient(e.target.value.trim().toLowerCase());
                                                    // Clear validaton error when typing
                                                    if (validationErrors.fields['recipient']) {
                                                        setValidationErrors(prev => ({
                                                            ...prev,
                                                            fields: { ...prev.fields, recipient: false }
                                                        }));
                                                    }
                                                }}
                                                className={`w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 rounded-xl focus:ring-4 transition ${validationErrors.fields['recipient'] ? 'border-red-500 focus:ring-red-200' : 'border-blue-300 focus:ring-blue-300 focus:border-blue-500'}`}
                                            />
                                            {validationErrors.fields['recipient'] && validationErrors.general.some(err => err.includes('email')) && (
                                                <p className="text-sm text-red-600 font-medium">Geçerli bir e-posta girin.</p>
                                            )}
                                        </div>
                                    )}
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
                                            <div className="md:col-span-2">
                                                <input
                                                    type="url"
                                                    placeholder="Görsel URL (İsteğe bağlı)"
                                                    value={item.photoUrl}
                                                    onChange={(e) => updateItem(index, 'photoUrl', e.target.value)}
                                                    className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="mt-8 pt-8 border-t-2 border-gray-200">
                            <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                İnceleme Fotoğrafları (Opsiyonel)
                            </label>

                            <div className="flex flex-wrap gap-4 items-center">
                                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-1">
                                        <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter group-hover:text-blue-600">Fotoğraf Ekle</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoSelect} />
                                </label>

                                {selectedPhotos.map((file, idx) => (
                                    <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shadow-lg z-10"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-2 py-1 truncate font-medium">
                                            {file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-3 italic font-medium flex items-center gap-1">
                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Seçilen fotoğraflar sadece bu email ile gönderilir, sisteme kaydedilmez. (Max 10MB/dosya)
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={loading}
                                className={`flex-1 px-8 py-4 rounded-xl font-bold text-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${loadingAction === 'draft' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {loadingAction === 'draft' ? '⏳ Kaydediliyor...' : '💾 Taslak Olarak Kaydet'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAndSend}
                                disabled={loading}
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
