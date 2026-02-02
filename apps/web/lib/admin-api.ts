export interface AllowedUser {
    id: string;
    email: string;
    role: string;
    storeCode?: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserRequest {
    email: string;
    role: number; // 0=Admin, 1=Manager, 2=Assistant
    storeCode?: string;
    isActive: boolean;
}

export interface UpdateUserRequest {
    role?: number;
    storeCode?: string;
    isActive?: boolean;
}

export interface BusinessHoursConfig {
    enabled: boolean;
    timeZone: string;
    start: string;
    end: string;
    days: string[];
}

export interface AdminStats {
    totalUsers: number;
    totalReports: number;
    reportsByStatus: Record<string, number>;
    recentActivity: RecentActivity[];
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Bir hata oluştu' }));
        throw new Error(error.message || 'Bir hata oluştu');
    }

    return response.json();
}

export const adminAPI = {
    // User Management
    async getUsers(): Promise<AllowedUser[]> {
        return fetchAPI('/api/admin/users');
    },

    async createUser(data: CreateUserRequest): Promise<AllowedUser> {
        return fetchAPI('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateUser(id: string, data: UpdateUserRequest): Promise<AllowedUser> {
        return fetchAPI(`/api/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteUser(id: string): Promise<void> {
        return fetchAPI(`/api/admin/users/${id}`, {
            method: 'DELETE',
        });
    },

    // Dashboard Stats
    async getStats(): Promise<AdminStats> {
        return fetchAPI('/api/admin/stats');
    },

    // Business Hours
    async getBusinessHours(): Promise<BusinessHoursConfig> {
        return fetchAPI('/api/admin/business-hours');
    },

    async updateBusinessHours(data: BusinessHoursConfig): Promise<BusinessHoursConfig> {
        return fetchAPI('/api/admin/business-hours', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};
