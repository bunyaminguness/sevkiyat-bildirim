'use client';

interface BusinessHoursBannerProps {
    businessHours: {
        start: string;
        end: string;
        tz: string;
        days: string[];
    };
}

export function BusinessHoursBanner({ businessHours }: BusinessHoursBannerProps) {
    const daysStr = businessHours.days.length === 7
        ? 'Hergün'
        : businessHours.days.join(', ');

    return (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                    />
                </svg>
                <div>
                    <h3 className="font-medium text-amber-900 mb-1">
                        Kullanım Saatleri Dışında
                    </h3>
                    <p className="text-sm text-amber-800">
                        <strong>Kullanım saatleri:</strong> {businessHours.start}–{businessHours.end} ({daysStr})
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                        Şu an sadece görüntüleme yapılabilir. İşlem yapmak için belirlenen saatler içinde tekrar deneyin.
                    </p>
                </div>
            </div>
        </div>
    );
}
