import { useState } from 'react';

interface EmailPreviewPanelProps {
    subject: string;
    body: string;
    recipient: string;
    isLoading?: boolean;
}

export function EmailPreviewPanel({
    subject,
    body,
    recipient,
    isLoading = false,
}: EmailPreviewPanelProps) {
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedSubject, setCopiedSubject] = useState(false);
    const [copiedBody, setCopiedBody] = useState(false);

    const handleCopyAll = () => {
        const fullText = `Kime: ${recipient}\nKonu: ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullText);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleCopySubject = () => {
        navigator.clipboard.writeText(subject);
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
    };

    const handleCopyBody = () => {
        navigator.clipboard.writeText(body);
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
    };

    return (
        <div className="h-full sticky top-4 bg-white border border-l-4 border-l-blue-500 rounded-lg shadow-sm flex flex-col">
            <div className="bg-gray-50/50 p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Email Önizleme
                        </h3>
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyAll}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${copiedAll ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <svg className="h-3.4 w-3.4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copiedAll ? 'Kopyalandı!' : 'Hepsini Kopyala'}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1 flex flex-col overflow-y-auto">
                {/* Kime */}
                <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kime</span>
                    <div className="p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded text-sm font-medium text-gray-800">
                        {recipient || <span className="text-gray-400 text-xs italic">Alıcı seçilmedi...</span>}
                    </div>
                </div>

                {/* Konu */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Konu</span>
                        <button
                            onClick={handleCopySubject}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${copiedSubject ? 'text-green-600 bg-green-50' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                            {copiedSubject ? '✓ Kopyalandı' : 'Konuyu Kopyala'}
                        </button>
                    </div>
                    <div className="p-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-900 shadow-sm break-all">
                        {subject}
                    </div>
                </div>

                {/* İçerik */}
                <div className="space-y-1 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">İçerik</span>
                        <button
                            onClick={handleCopyBody}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${copiedBody ? 'text-green-600 bg-green-50' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                            {copiedBody ? '✓ Kopyalandı' : 'İçeriği Kopyala'}
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-mono text-gray-700 whitespace-pre-wrap min-h-[300px] shadow-inner flex-1 leading-relaxed">
                        {body}
                    </div>
                </div>
            </div>
        </div>
    );
}
