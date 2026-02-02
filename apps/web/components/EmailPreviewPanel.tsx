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
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullText = `Kime: ${recipient}\nKonu: ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border rounded shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied ? 'Kopyalandı!' : 'Kopyala'}
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-2 px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded w-fit font-medium">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bu bir önizlemedir. Gönderim sırasında format aynı kalır.
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kime</span>
                    <div className="p-2 bg-white border rounded text-sm font-medium text-gray-800 shadow-sm">
                        {recipient || <span className="text-gray-400 text-xs italic">Alıcı seçilmedi...</span>}
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Konu</span>
                    <div className="p-2 bg-white border rounded text-sm font-medium text-gray-800 shadow-sm break-all">
                        {subject || <span className="text-gray-400 text-xs italic">Konu oluşturuluyor...</span>}
                    </div>
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">İçerik</span>
                    <div className="p-3 bg-gray-50 border rounded text-sm font-mono text-gray-700 whitespace-pre-wrap min-h-[300px] shadow-inner flex-1">
                        {body || <span className="text-gray-400 text-xs italic">İçerik oluşturuluyor...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
