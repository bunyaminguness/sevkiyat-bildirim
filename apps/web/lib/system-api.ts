export interface SystemStatus {
    isWithinBusinessHours: boolean;
    businessHours: {
        start: string;
        end: string;
        tz: string;
        days: string[];
    };
    serverTime: string;
}

export interface BusinessHoursError {
    code: 'outside_business_hours';
    message: string;
    businessHours: {
        start: string;
        end: string;
        tz: string;
        days: string[];
    };
}

export async function getSystemStatus(): Promise<SystemStatus> {
    const response = await fetch('http://localhost:5279/api/system/status', {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch system status');
    }

    return response.json();
}
